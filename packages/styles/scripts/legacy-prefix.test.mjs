import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import postcss from 'postcss';
import { expect, test } from 'vitest';
import { toTailwindCandidate } from './legacy-prefix.mjs';
import gitlabTailwind from './postcss-gitlab-tailwind.mjs';

const packageDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const inputPath = path.join(packageDirectory, 'src/index.css');
const fixtureDirectory = path.join(packageDirectory, 'scripts/fixtures');

test('converts upstream gl-* candidates without changing variant order', () => {
  expect(toTailwindCandidate('gl-bg-default')).toBe('bg-default');
  expect(toTailwindCandidate('hover:gl-text-link')).toBe('hover:text-link');
  expect(toTailwindCandidate('md:hover:-gl-m-2')).toBe('md:hover:-m-2');
  expect(toTailwindCandidate('[&:nth-child(2)]:gl-text-link')).toBe(
    '[&:nth-child(2)]:text-link',
  );
  expect(toTailwindCandidate('dark')).toBeNull();
});

test('compiles @apply and restores upstream gl-* selectors', async () => {
  const input = await readFile(inputPath, 'utf8');
  const result = await postcss([
    gitlabTailwind({
      sources: [{ base: fixtureDirectory, pattern: '*.html', negated: false }],
    }),
  ]).process(input, { from: inputPath });

  expect(result.css).not.toMatch(/@apply/u);
  expect(result.css).toMatch(/body\s*\{[^}]*background-color:/su);
  expect(result.css).toMatch(/\.gl-bg-default\s*\{/u);
  expect(result.css).toMatch(/\.hover\\:gl-text-link:hover\s*\{/u);
  expect(result.css).toMatch(/\.dark\\:gl-bg-default:where\(\.dark \*\)/u);
  expect(result.css).toMatch(/\.gl-border\s*\{/u);
  expect(result.css).toMatch(
    /\.group-hover\\:gl-bg-default:is\(:where\(\.gl-group\):hover \*\)/u,
  );
  expect(result.css).not.toMatch(/:where\(\.gl-dark \*\)/u);
});
