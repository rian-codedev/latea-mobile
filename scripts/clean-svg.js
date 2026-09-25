const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', 'assets', 'illustrations');
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.svg'));

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  const before = content.length;

  // 1. Hapus BOM
  content = content.replace(/^\uFEFF/, '');

  // 2. Hapus <style>...</style> (animasi CSS — aman)
  content = content.replace(/<style[\s\S]*?<\/style>/gi, '');

  // 3. Hapus class="..." — aman
  content = content.replace(/\s+class="[^"]*"/g, '');

  // 4. Hapus id="..." — aman
  content = content.replace(/\s+id="[^"]*"/g, '');

  // 5. Hapus xmlns:xlink, xmlns:svgjs — aman
  content = content.replace(/\s+xmlns:xlink="[^"]*"/g, '');
  content = content.replace(/\s+xmlns:svgjs="[^"]*"/g, '');

  // 6. Hapus <!-- comments -->
  content = content.replace(/<!--[\s\S]*?-->/g, '');

  // 7. ⭐ CONVERT style="..." → atribut native
  // Cari semua style="..." dan pecah jadi atribut
  content = content.replace(/\s+style="([^"]*)"/g, (match, styleValue) => {
    const props = styleValue
      .split(';')
      .map((p) => p.trim())
      .filter(Boolean);

    let attrs = '';

    for (const prop of props) {
      const [key, ...rest] = prop.split(':');
      const value = rest.join(':').trim();
      const trimmedKey = key.trim();

      // Skip transform-origin (khusus animation, tidak dipakai)
      if (trimmedKey === 'transform-origin') continue;

      // Convert known CSS props → SVG native attrs
      if (trimmedKey === 'fill') {
        attrs += ` fill="${value}"`;
      } else if (trimmedKey === 'transform') {
        attrs += ` transform="${value}"`;
      } else if (trimmedKey === 'opacity') {
        attrs += ` opacity="${value}"`;
      } else if (trimmedKey === 'stroke') {
        attrs += ` stroke="${value}"`;
      } else if (trimmedKey === 'stroke-width') {
        attrs += ` stroke-width="${value}"`;
      } else if (trimmedKey === 'stroke-linecap') {
        attrs += ` stroke-linecap="${value}"`;
      } else if (trimmedKey === 'stroke-linejoin') {
        attrs += ` stroke-linejoin="${value}"`;
      } else if (trimmedKey === 'fill-rule') {
        attrs += ` fill-rule="${value}"`;
      } else if (trimmedKey === 'clip-rule') {
        attrs += ` clip-rule="${value}"`;
      }
      // Sisanya diabaikan (isolation, mix-blend-mode, dll — tidak dipakai RN)
    }

    return attrs;
  });

  // 8. Rapikan spasi berlebih
  content = content.replace(/\s+/g, ' ').trim();

  fs.writeFileSync(filePath, content, 'utf8');

  console.log(
    `✅ ${file}: ${before} → ${content.length} bytes (${Math.round((1 - content.length / before) * 100)}% smaller)`
  );
}