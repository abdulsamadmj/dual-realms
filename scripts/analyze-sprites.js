import sharp from 'sharp';

const files = [
  'public/sprites/Knight_Normal.png',
  'public/sprites/Knight_Ghost.png',
  'public/sprites/Thief.png',
];

for (const f of files) {
  const meta = await sharp(f).metadata();
  console.log(`${f}: ${meta.width}x${meta.height}`);
}
