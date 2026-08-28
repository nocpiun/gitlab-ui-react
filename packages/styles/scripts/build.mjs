import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import postcss from 'postcss';

import postcssConfig from '../postcss.config.mjs';

const packageDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const inputPath = path.join(packageDirectory, 'src/index.css');
const outputPath = path.join(packageDirectory, 'dist/gitlab-ui.css');
const input = await readFile(inputPath, 'utf8');
const result = await postcss(postcssConfig.plugins).process(input, {
  from: inputPath,
  to: outputPath,
  map: false,
});

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, result.css);

console.log(`Built ${path.relative(packageDirectory, outputPath)}`);
