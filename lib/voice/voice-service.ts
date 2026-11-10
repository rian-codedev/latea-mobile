import {
  ExpoSpeechRecognitionModule,
  type ExpoSpeechRecognitionResultEvent,
  type ExpoSpeechRecognitionErrorEvent,
} from 'expo-speech-recognition';
import { usePreferences } from '@/lib/stores/preferences';

export type VoiceServiceState =
  | 'idle'
  | 'starting'
  | 'listening'
  | 'processing'
  | 'paused';

type StateListener = (state: VoiceServiceState) => void;
type ResultListener = (text: string) => void;
type ErrorListener = (code: string) => void;

/* ══════════════════════════════════════════════════════
   Timings (diperbaiki untuk auto-mode)
   ══════════════════════════════════════════════════════ */
const LANGUAGE = 'id-ID';
const RESTART_DELAY_MS = 800;
const MAX_NO_SPEECH = 10;
const ERROR_BACKOFF_MS = 1000;
const MAX_CONSECUTIVE_ERRORS = 3;
const PROCESSING_SAFETY_MS = 4000;

class VoiceService {
  private _state: VoiceServiceState = 'idle';
  private _running = false;
  private _consecutiveErrors = 0;
  private _consecutiveNoSpeech = 0;

  private stateListeners = new Set<StateListener>();
  private resultListeners = new Set<ResultListener>();
  private errorListeners = new Set<ErrorListener>();

  private restartTimer: ReturnType<typeof setTimeout> | null = null;
  private safetyTimer: ReturnType<typeof setTimeout> | null = null;
  private subscriptions: { remove: () => void }[] = [];
  private listenersBound = false;

  get state(): VoiceServiceState {
    return this._state;
  }

  subscribeState(fn: StateListener): () => void {
    this.stateListeners.add(fn);
    return () => {
      this.stateListeners.delete(fn);
    };
  }

  subscribeResult(fn: ResultListener): () => void {
    this.resultListeners.add(fn);
    return () => {
      this.resultListeners.delete(fn);
    };
  }

  subscribeError(fn: ErrorListener): () => void {
    this.errorListeners.add(fn);
    return () => {
      this.errorListeners.delete(fn);
    };
  }

  async start(): Promise<void> {
    if (this._running) return;
    this._running = true;
    this._consecutiveErrors = 0;
    this._consecutiveNoSpeech = 0;
    await this.bindListeners();
    this.setState('starting');
    this.startRecognition();
  }

  async stop(): Promise<void> {
    this._running = false;
    this.clearRestartTimer();
    this.clearSafetyTimer();
    try {
      ExpoSpeechRecognitionModule.abort();
    } catch {
      // ignore
    }
    this.setState('idle');
  }

  async pause(): Promise<void> {
    if (!this._running || this._state === 'paused') return;
    this.clearRestartTimer();
    this.clearSafetyTimer();
    this._running = false;
    try {
      ExpoSpeechRecognitionModule.abort();
    } catch {
      // ignore
    }
    this.setState('paused');
  }

  async resume(): Promise<void> {
    if (this._state !== 'paused') return;
    this._running = true;
    this._consecutiveErrors = 0;
    this._consecutiveNoSpeech = 0;
    this.setState('starting');
    this.startRecognition();
  }

  static async isAvailable(): Promise<boolean> {
    try {
      const services =
        ExpoSpeechRecognitionModule.getSpeechRecognitionServices();
      return Array.isArray(services) && services.length > 0;
    } catch {
      return false;
    }
  }

  /* ── Internal ── */

  private setState(next: VoiceServiceState) {
    if (this._state === next) return;
    this._state = next;
    this.stateListeners.forEach((fn) => fn(next));
  }

  private isInactive(): boolean {
    return !this._running || this._state === 'paused' || this._state === 'idle';
  }

  private getNoSpeechDelayMs(): number {
    try {
      const secs = usePreferences.getState().voiceNoSpeechDelaySeconds;
      const safe = Math.max(1, Math.min(60, secs || 3));
      return safe * 1000;
    } catch {
      return 3000;
    }
  }

  private async bindListeners(): Promise<void> {
    if (this.listenersBound) return;
    this.listenersBound = true;

    this.subscriptions.push(
      ExpoSpeechRecognitionModule.addListener('start', () => {
        if (this.isInactive()) return;
        if (__DEV__) console.log('[VoiceService] event: start');
        this.setState('listening');
      }),
      ExpoSpeechRecognitionModule.addListener('speechstart', () => {
        if (this.isInactive()) return;
        if (__DEV__) console.log('[VoiceService] event: speechstart');
        this.setState('listening');
      }),
      ExpoSpeechRecognitionModule.addListener('speechend', () => {
        if (this.isInactive()) return;
        if (__DEV__) console.log('[VoiceService] event: speechend');
      }),
      ExpoSpeechRecognitionModule.addListener(
        'result',
        (event: ExpoSpeechRecognitionResultEvent) => {
          if (this.isInactive()) return;
          if (__DEV__) {
            console.log(
              '[VoiceService] event: result',
              event.results?.[0]?.transcript,
            );
          }
          this.handleResults(event);
        },
      ),
      ExpoSpeechRecognitionModule.addListener('end', () => {
        if (this.isInactive()) return;
        if (__DEV__) console.log('[VoiceService] event: end');
        this.clearSafetyTimer();
        this.scheduleRestart(RESTART_DELAY_MS);
      }),
      ExpoSpeechRecognitionModule.addListener(
        'error',
        (event: ExpoSpeechRecognitionErrorEvent) => {
          if (event.error === 'aborted') return;
          if (this.isInactive()) return;
          if (__DEV__) {
            console.log(
              '[VoiceService] event: error',
              event.error,
              event.message,
            );
          }
          this.handleError(event);
        },
      ),
    );
  }

  private handleResults(event: ExpoSpeechRecognitionResultEvent) {
    const text = event.results?.[0]?.transcript?.trim();
    this._consecutiveErrors = 0;
    this._consecutiveNoSpeech = 0;

    if (!text) return;

    this.setState('processing');
    this.resultListeners.forEach((fn) => fn(text));

    this.clearSafetyTimer();
    this.safetyTimer = setTimeout(() => {
      if (this._running && this._state === 'processing') {
        if (__DEV__) console.log('[VoiceService] safety: force restart');
        this.scheduleRestart(100);
      }
    }, PROCESSING_SAFETY_MS);
  }

  private handleError(event: ExpoSpeechRecognitionErrorEvent) {
    const code = event.error ?? 'unknown';

    if (code === 'no-speech') {
      this._consecutiveNoSpeech += 1;

      if (this._consecutiveNoSpeech >= MAX_NO_SPEECH) {
        if (__DEV__) {
          console.log(
            `[VoiceService] ${MAX_NO_SPEECH}× no-speech → pausing (tap FAB to resume)`,
          );
        }
        this._consecutiveNoSpeech = 0;
        void this.pause();
        return;
      }

      /* ⭐ Baca base delay dari preferences (user setting) */
      const baseMs = this.getNoSpeechDelayMs();
      const delay = baseMs + (this._consecutiveNoSpeech - 1) * 1000;

      if (__DEV__) {
        console.log(
          `[VoiceService] no-speech #${this._consecutiveNoSpeech} → restart in ${delay}ms (base ${baseMs}ms)`,
        );
      }

      this.scheduleRestart(delay);
      return;
    }

    const softErrors = ['no-match', 'speech-timeout', 'busy'];
    if (softErrors.includes(code)) {
      this._consecutiveNoSpeech = 0;
      this.scheduleRestart(RESTART_DELAY_MS);
      return;
    }

    if (code === 'not-allowed' || code === 'service-not-allowed') {
      this.errorListeners.forEach((fn) => fn(code));
      void this.stop();
      return;
    }

    this._consecutiveErrors += 1;
    this.errorListeners.forEach((fn) => fn(code));

    if (this._consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
      void this.stop();
      return;
    }

    this.scheduleRestart(ERROR_BACKOFF_MS);
  }

  private startRecognition() {
    try {
      ExpoSpeechRecognitionModule.start({
        lang: LANGUAGE,
        interimResults: false,
        continuous: false,
        requiresOnDeviceRecognition: false,
        maxAlternatives: 1,
      });
    } catch (err) {
      if (__DEV__) {
        console.warn('[VoiceService] start error:', err);
      }
      this._consecutiveErrors += 1;
      if (this._consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
        void this.stop();
        return;
      }
      this.scheduleRestart(ERROR_BACKOFF_MS);
    }
  }

  private scheduleRestart(delay: number) {
    if (this.isInactive()) return;
    if (this.restartTimer) return;

    this.clearSafetyTimer();
    this.restartTimer = setTimeout(() => {
      this.restartTimer = null;
      if (this.isInactive()) return;
      this.setState('starting');
      this.startRecognition();
    }, delay);
  }

  private clearRestartTimer() {
    if (this.restartTimer) {
      clearTimeout(this.restartTimer);
      this.restartTimer = null;
    }
  }

  private clearSafetyTimer() {
    if (this.safetyTimer) {
      clearTimeout(this.safetyTimer);
      this.safetyTimer = null;
    }
  }

  async destroy(): Promise<void> {
    await this.stop();
    this.subscriptions.forEach((s) => s.remove());
    this.subscriptions = [];
    this.listenersBound = false;
    this.stateListeners.clear();
    this.resultListeners.clear();
    this.errorListeners.clear();
  }
}

export const voiceService = new VoiceService();