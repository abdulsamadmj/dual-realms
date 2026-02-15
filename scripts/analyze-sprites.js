import fs from 'fs';
import path from 'path';

console.log('CWD:', process.cwd());
console.log('__dirname approx:', path.dirname(new URL(import.meta.url).pathname));

// Try to find the sprites
const searchPaths = [
  process.cwd(),
  '/vercel/share/v0-project',
  '/home/user',
  '/home',
];

for (const base of searchPaths) {
  const target = path.join(base, 'public', 'sprites');
  console.log(`Checking ${target}: exists=${fs.existsSync(target)}`);
  if (fs.existsSync(target)) {
    console.log('  Contents:', fs.readdirSync(target));
  }
  // Also check if base has package.json
  const pkg = path.join(base, 'package.json');
  console.log(`  package.json at ${base}: ${fs.existsSync(pkg)}`);
}

// List CWD
console.log('\nCWD contents:', fs.readdirSync(process.cwd()));
