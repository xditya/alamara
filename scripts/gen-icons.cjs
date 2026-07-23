/**
 * Generates all app icon / splash / favicon assets from a single in-code SVG glyph.
 * Run: `node scripts/gen-icons.cjs`  (needs the `sharp` dev dependency).
 *
 * Switch the mark by changing CONCEPT below ('almirah' | 'shield' | 'folderCheck').
 * Everything is white line-art on the indigo brand gradient, sized for Expo:
 * iOS/main icon, Android adaptive (fg/bg/monochrome), splash icon, and web favicon.
 */

const sharp = require('sharp');
const path = require('path');

const CONCEPT = 'almirah';
const OUT = path.join(__dirname, '..', 'assets', 'images');

const BG = `
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#7A82FF"/>
      <stop offset="1" stop-color="#4F46E5"/>
    </linearGradient>
  </defs>`;

const stroke = (w = 40) =>
  `fill="none" stroke="#ffffff" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"`;

const glyphs = {
  almirah: `
    <g ${stroke(40)}>
      <rect x="330" y="250" width="364" height="500" rx="46"/>
      <line x1="512" y1="250" x2="512" y2="750"/>
      <line x1="470" y1="452" x2="470" y2="548"/>
      <line x1="554" y1="452" x2="554" y2="548"/>
      <line x1="388" y1="750" x2="388" y2="798"/>
      <line x1="636" y1="750" x2="636" y2="798"/>
    </g>`,
  shield: `
    <g ${stroke(40)}>
      <path d="M512 244 L716 330 V516 C716 638 622 724 512 772 C402 724 308 638 308 516 V330 Z"/>
      <line x1="430" y1="452" x2="594" y2="452"/>
      <line x1="430" y1="520" x2="594" y2="520"/>
      <line x1="430" y1="588" x2="540" y2="588"/>
    </g>`,
  folderCheck: `
    <g ${stroke(40)}>
      <path d="M300 350 H452 L500 410 H724 C742 410 756 424 756 442 V690 C756 708 742 722 724 722 H332 C314 722 300 708 300 690 Z"/>
      <path d="M456 556 L512 610 L604 508" stroke-width="46"/>
    </g>`,
};

function iconSvg(glyph, { bg = true, glyphColor, scale = 1 } = {}) {
  const g = glyphColor ? glyph.replaceAll('#ffffff', glyphColor) : glyph;
  const tf = scale !== 1 ? `transform="translate(512 512) scale(${scale}) translate(-512 -512)"` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
    ${bg ? BG + '<rect width="1024" height="1024" fill="url(#bg)"/>' : ''}
    <g ${tf}>${g}</g>
  </svg>`;
}

function roundedSvg(glyph) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
    ${BG}<rect width="1024" height="1024" rx="228" fill="url(#bg)"/>${glyph}</svg>`;
}

const png = (svg, file, size) =>
  sharp(Buffer.from(svg)).resize(size, size).png().toFile(path.join(OUT, file)).then(() => console.log('wrote', file));

(async () => {
  const G = glyphs[CONCEPT];
  await png(iconSvg(G, { bg: true }), 'icon.png', 1024);
  await png(iconSvg(G, { bg: false, scale: 0.62 }), 'android-icon-foreground.png', 1024);
  await png(iconSvg(G, { bg: false, glyphColor: '#000000', scale: 0.62 }), 'android-icon-monochrome.png', 1024);
  await png(
    `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024">${BG}<rect width="1024" height="1024" fill="url(#bg)"/></svg>`,
    'android-icon-background.png',
    1024,
  );
  await png(iconSvg(G, { bg: false }), 'splash-icon.png', 1024);
  await png(roundedSvg(G), 'favicon.png', 48);
  console.log('done:', CONCEPT);
})();
