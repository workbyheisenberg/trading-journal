import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const SRC = path.resolve('public/nako.png');
const OUT = path.resolve('public');

async function squareIcon(size, file, padding = 0.06) {
  const trimmed = await sharp(SRC).trim({ threshold: 10 }).png().toBuffer();
  const pad = Math.round(size * padding);
  const inner = Math.max(1, size - pad * 2);
  const innerBuf = await sharp(trimmed)
    .resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  await sharp({
    create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }
  })
    .composite([{ input: innerBuf, top: pad, left: pad }])
    .png()
    .toFile(path.join(OUT, file));

  return fs.readFileSync(path.join(OUT, file));
}

function buildIco(images) {
  const count = images.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(count, 4);

  const entries = [];
  let offset = 6 + count * 16;
  for (const img of images) {
    const e = Buffer.alloc(16);
    const dim = img.size >= 256 ? 0 : img.size;
    e.writeUInt8(dim, 0);
    e.writeUInt8(dim, 1);
    e.writeUInt8(0, 2);
    e.writeUInt8(0, 3);
    e.writeUInt16LE(1, 4);
    e.writeUInt16LE(32, 6);
    e.writeUInt32LE(img.data.length, 8);
    e.writeUInt32LE(offset, 12);
    offset += img.data.length;
    entries.push(e);
  }

  return Buffer.concat([header, ...entries, ...images.map((i) => i.data)]);
}

const meta = await sharp(SRC).metadata();
console.log(`source ${meta.width}x${meta.height} alpha=${meta.hasAlpha}`);

const icoSizes = [16, 32, 48];
const icoImages = [];

for (const size of [16, 32, 48]) {
  const data = await squareIcon(size, `favicon-${size}x${size}.png`, 0.04);
  icoImages.push({ size, data });
  console.log(`favicon-${size}x${size}.png`);
}

await squareIcon(180, 'apple-touch-icon.png', 0.08);
console.log('apple-touch-icon.png');
await squareIcon(192, 'android-chrome-192x192.png', 0.08);
console.log('android-chrome-192x192.png');
await squareIcon(512, 'android-chrome-512x512.png', 0.08);
console.log('android-chrome-512x512.png');
await squareIcon(512, 'android-chrome-maskable-512x512.png', 0.22);
console.log('android-chrome-maskable-512x512.png');

fs.writeFileSync(path.join(OUT, 'favicon.ico'), buildIco(icoImages));
console.log('favicon.ico');
