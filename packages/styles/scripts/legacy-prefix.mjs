import postcss from "postcss";
import selectorParser from "postcss-selector-parser";

const LEGACY_PREFIX = "gl-";

function splitCandidate(candidate) {
  const parts = [];
  let start = 0;
  let squareDepth = 0;
  let parenthesisDepth = 0;
  let escaped = false;

  for(let index = 0; index < candidate.length; index += 1) {
    const character = candidate[index];

    if(escaped) {
      escaped = false;
      continue;
    }

    if(character === "\\") {
      escaped = true;
      continue;
    }

    if(character === "[") squareDepth += 1;
    if(character === "]") squareDepth -= 1;
    if(character === "(") parenthesisDepth += 1;
    if(character === ")") parenthesisDepth -= 1;

    if(character === ":" && squareDepth === 0 && parenthesisDepth === 0) {
      parts.push(candidate.slice(start, index));
      start = index + 1;
    }
  }

  parts.push(candidate.slice(start));
  return parts;
}

function stripLegacyPrefix(utility) {
  let modifierEnd = 0;

  while(utility[modifierEnd] === "!" || utility[modifierEnd] === "-") {
    modifierEnd += 1;
  }

  if(utility.startsWith(LEGACY_PREFIX, modifierEnd)) {
    return `${utility.slice(0, modifierEnd)}${utility.slice(modifierEnd + LEGACY_PREFIX.length)}`;
  }

  // Older Tailwind output can place the negative marker after the configured prefix.
  if(utility.startsWith(`${LEGACY_PREFIX}-`, modifierEnd)) {
    return `${utility.slice(0, modifierEnd)}-${utility.slice(modifierEnd + LEGACY_PREFIX.length + 1)}`;
  }

  return null;
}

/**
 * Converts an upstream Tailwind v3 candidate to the unprefixed candidate that
 * Tailwind v4 compiles internally.
 *
 * @example hover:gl-text-link -> hover:text-link
 * @example -gl-m-2 -> -m-2
 */
export function toTailwindCandidate(candidate) {
  const parts = splitCandidate(candidate);
  const utility = stripLegacyPrefix(parts.at(-1));

  if(utility === null) return null;

  parts[parts.length - 1] = utility;
  return parts.join(":");
}

export function createCandidateMap(candidates) {
  const legacyByTailwindCandidate = new Map();

  for(const legacyCandidate of candidates) {
    const tailwindCandidate = toTailwindCandidate(legacyCandidate);

    if(tailwindCandidate === null) continue;

    const existingCandidate = legacyByTailwindCandidate.get(tailwindCandidate);

    if(existingCandidate && existingCandidate !== legacyCandidate) {
      throw new Error(
        `Legacy Tailwind candidates "${existingCandidate}" and "${legacyCandidate}" both map to "${tailwindCandidate}".`,
      );
    }

    legacyByTailwindCandidate.set(tailwindCandidate, legacyCandidate);
  }

  return legacyByTailwindCandidate;
}

export function rewriteLegacyApplyDirectives(css, from) {
  const root = postcss.parse(css, { from });

  root.walkAtRules("apply", (atRule) => {
    atRule.params = atRule.params
      .split(/\s+/u)
      .map((candidate) => toTailwindCandidate(candidate) ?? candidate)
      .join(" ");
  });

  return root.toString();
}

export function restoreLegacySelectors(root, legacyByTailwindCandidate) {
  const processor = selectorParser((selectors) => {
    selectors.walkClasses((classNode) => {
      const legacyCandidate = legacyByTailwindCandidate.get(classNode.value);

      if(legacyCandidate) classNode.value = legacyCandidate;
    });
  });

  root.walkRules((rule) => {
    if(!rule.selector.includes(".")) return;

    rule.selector = processor.processSync(rule.selector, { lossless: true });
  });
}
