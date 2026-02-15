import sharp from 'sharp';
import path from 'path';

const sprites = [
  'public/sprites/Knight_Normal.png',
  'public/sprites/Knight_Ghost.png',
  'public/sprites/Thief.png',
];

for (const sprite of sprites) {
  const meta = await sharp(path.resolve(sprite)).metadata();
  console.log(`${sprite}: ${meta.width}x${meta.height}`);
}
