import {
  copyFileSync,
  existsSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const output = join(root, 'dist');
const index = join(output, 'index.html');

if (!existsSync(index)) {
  throw new Error('Web export is missing dist/index.html');
}

copyFileSync(join(root, 'assets', 'icon.png'), join(output, 'pwa-icon.png'));
copyFileSync(index, join(output, '404.html'));
writeFileSync(join(output, '.nojekyll'), '');

console.log('Prepared GitHub Pages PWA output.');
