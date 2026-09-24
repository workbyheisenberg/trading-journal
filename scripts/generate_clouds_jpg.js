import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

async function generateCloudsJpg() {
  const width = 1600;
  const height = 900;
  const spacing = 8;
  const skyColor = '#24a1ee';

  // Cloud centers and radii for smooth density field
  const clouds = [
    // Left cloud mound
    { cx: 160, cy: 520, rx: 200, ry: 150, intensity: 0.95 },
    { cx: 80, cy: 450, rx: 140, ry: 110, intensity: 0.8 },
    { cx: 220, cy: 620, rx: 240, ry: 160, intensity: 0.9 },
    // Center/lower-middle cloud bank
    { cx: 500, cy: 750, rx: 320, ry: 180, intensity: 0.95 },
    { cx: 680, cy: 780, rx: 280, ry: 160, intensity: 0.9 },
    { cx: 380, cy: 820, rx: 300, ry: 170, intensity: 0.95 },
    // Bottom wide shelf
    { cx: 800, cy: 850, rx: 800, ry: 140, intensity: 0.98 },
    { cx: 1200, cy: 820, rx: 420, ry: 170, intensity: 0.92 },
    { cx: 1450, cy: 790, rx: 260, ry: 150, intensity: 0.85 },
    // Mid-sky subtle wisps
    { cx: 620, cy: 620, rx: 180, ry: 70, intensity: 0.45 },
    { cx: 950, cy: 680, rx: 200, ry: 80, intensity: 0.4 },
    { cx: 340, cy: 480, rx: 120, ry: 60, intensity: 0.35 }
  ];

  let circles = '';
  
  // Generate uniform hexagonal/grid halftone dots
  for (let y = 4; y < height; y += spacing) {
    const isOdd = Math.floor(y / spacing) % 2 === 1;
    const xOffset = isOdd ? spacing / 2 : 0;
    for (let x = xOffset; x < width; x += spacing) {
      // Calculate cloud density at (x, y)
      let density = 0;
      for (const c of clouds) {
        const dx = (x - c.cx) / c.rx;
        const dy = (y - c.cy) / c.ry;
        const d2 = dx * dx + dy * dy;
        if (d2 < 1.0) {
          const contrib = Math.pow(1.0 - d2, 1.6) * c.intensity;
          density = Math.max(density, contrib);
        }
      }

      // Halftone dot radius
      // Sky base: small pin-dot (0.9px - 1.2px)
      // Cloud dense: expands up to 4.2px (almost filling the 8px cell)
      const r = 0.95 + density * 3.3;
      const opacity = 0.82 + density * 0.18;

      circles += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(2)}" fill="rgba(255,255,255,${opacity.toFixed(2)})"/>`;
    }
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect width="${width}" height="${height}" fill="${skyColor}"/>
    <g>${circles}</g>
  </svg>`;

  const buffer = Buffer.from(svg);
  
  const destDir1 = path.resolve('public');
  const destDir2 = path.resolve('src/assets/images');
  fs.mkdirSync(destDir1, { recursive: true });
  fs.mkdirSync(destDir2, { recursive: true });

  await sharp(buffer)
    .jpeg({ quality: 96, chromaSubsampling: '4:4:4' })
    .toFile(path.join(destDir1, 'Clouds.jpg'));

  await sharp(buffer)
    .jpeg({ quality: 96, chromaSubsampling: '4:4:4' })
    .toFile(path.join(destDir2, 'Clouds.jpg'));

  console.log('Successfully created Clouds.jpg in public and src/assets/images');
}

generateCloudsJpg().catch(console.error);
