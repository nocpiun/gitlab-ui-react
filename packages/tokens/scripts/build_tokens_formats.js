/**
 * Copyright GitLab Inc.
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import { fileHeader } from "style-dictionary/utils";

const CONTEXTUAL_PREFIX = "🔒/";
const CONTEXTUAL_DIRECTORY = "/contextual/";
const STATUS_VARIANTS = ["neutral", "info", "success", "warning", "danger", "brand"];
const FEEDBACK_VARIANTS = ["strong", "neutral", "info", "success", "warning", "danger", "brand"];
const BRAND_VARIANTS = [
  "brand-white",
  "brand-charcoal",
  "brand-orange",
  "brand-purple",
  "brand-gray",
  "brand-pink",
];
const BASE_COLOR_VARIANTS = ["blue", "gray", "green", "orange", "purple", "red"];

/**
 * Returns key/value pairs of token scales and CSS custom properties
 * @param {object} tokens
 * @returns {object} { example: 'var(--gl-token-example, #000)' }
 */
const getScalesAndCSSCustomProperties = (tokens = {}) => Object.entries(tokens).reduce(
  (acc, [scale, token]) => {
    if(token.cssWithValue) {
      acc[scale] = token.cssWithValue;
    } else {
      acc[scale] = getScalesAndCSSCustomProperties(token);
    }
    return acc;
  },
  {},
);

/*
 * @param {Object} colorTokens - The token object to process
 * @returns {Object} - Flattened object with path-based keys and CSS values
 */
const generateBaseColors = (colorTokens) => Object.entries(colorTokens).reduce(
  (acc, [, scales]) => {
    Object.entries(scales).forEach(([, token]) => {
      if(token.path) {
        acc[token.path.join("-")] = token.cssWithValue;
      }
    });
    return acc;
  },
  {},
);

/**
 * Generates color objects for a specific set of variants
 * @param {Object} tokens
 * @param {Array} variants - Array of variants (e.g. ['success', 'warning', 'error'])
 * @param {string} parent - The parent category (e.g. 'status', 'feedback')
 * @param {Array} properties - Array of property types to generate
 * @returns {Object} - Object containing all color objects
 */

const generateColorMap = (
  tokens,
  variants,
  parent,
  properties = ["background", "text", "fill"],
  // eslint-disable-next-line max-params
) => properties.reduce(
  (acc, property) => {
    const key = `${parent}${property.charAt(0).toUpperCase() + property.slice(1)}Colors`;

    // Create the mapping of variant names to colors
    acc[key] = Object.fromEntries(
      variants.map((variant) => [
        `${parent}-${variant}`,
        tokens[property][parent][variant].cssWithValue,
      ]),
    );

    return acc;
  },
  {},
);

/**
 * Return string CSS custom property for token object
 *
 * @param {object} token
 * @returns {string} CSS custom property
 */
const getTokenCssCustomProperty = (token) => {
  const path = [token.prefix !== false ? "gl" : false, ...token.path].filter(Boolean);
  return `var(--${path.join("-")})`;
};

/**
 * Generates SCSS variables that reference CSS custom properties for all tokens
 *
 * This formatter creates SCSS variables ($gl-design-token-name) that reference their
 * corresponding CSS custom properties (--gl-design-token-name), allowing tokens to be
 * used in SCSS while still respecting runtime theming through CSS variables.
 *
 * @param {Object} options - The formatter options
 * @param {Object} options.dictionary - The Style Dictionary containing all tokens
 * @param {Object} options.file - The file being generated
 * @returns {Promise<string>} The formatted SCSS output with file header
 *
 * @example
 * // Output example:
 * // $gl-design-token-name: var(--gl-design-token-name);
 */
const scssCustomPropertiesFormat = async ({ dictionary, file }) => {
  let output = [];
  dictionary.allTokens.forEach((token) => {
    output = output.concat(`$${token.name}: var(--${token.name});`);
  });
  return `${await fileHeader({ file })}${output.join("\n")}\n`;
};

/**
 * Generates Tailwind CSS component classes from composite design tokens
 *
 * This formatter creates CSS component classes that use CSS custom properties
 * for composite tokens. Each token becomes a CSS class with properties mapped
 * to their corresponding CSS custom property variables.
 *
 *
 * @param {Object} options - The formatter options
 * @param {Object} options.dictionary - The Style Dictionary containing all tokens
 * @param {Array} options.dictionary.allTokens - Array of all processed tokens
 * @param {Object} options.file - The file being generated
 * @returns {Promise<string>} A JavaScript module string that exports Tailwind components
 *
 * @example
 * // Output example:
 * // module.exports = {
 * //   typographyComponents: {
 * //     '.heading-1': {
 * //       'font-weight': 'var(--gl-heading-1-font-weight)',
 * //       'margin-top': 'var(--gl-heading-1-margin-top)',
 * //       'font-size': 'var(--gl-heading-1-font-size)',
 * //       'letter-spacing': 'var(--gl-heading-1-letter-spacing)',
 * //       'line-height': 'var(--gl-heading-1-line-height)',
 * //       'margin-bottom': 'var(--gl-heading-1-margin-bottom)',
 * //       color: 'var(--gl-heading-1-color)',
 * //     },
 * //   }
 * // }
 */
const tailwindComponentsFormat = async ({ dictionary, file }) => {
  const tokens = dictionary.allTokens;
  const components = {};

  const propertyMap = {
    fontFamily: "font-family",
    marginTop: "margin-top",
    fontSize: "font-size",
    fontWeight: "font-weight",
    letterSpacing: "letter-spacing",
    lineHeight: "line-height",
    marginBottom: "margin-bottom",
    color: "color",
  };

  tokens.forEach((token) => {
    components[`.${token.path.join("-")}`] = Object.entries(token.$value).reduce(
      // eslint-disable-next-line no-unused-vars
      (acc, [prop, _]) => {
        const cssProperty = propertyMap[prop];
        if(cssProperty) acc[cssProperty] = `var(--${token.name}-${cssProperty})`;
        return acc;
      },
      {},
    );
  });

  return `${await fileHeader({ file })}module.exports = ${JSON.stringify({ typographyComponents: components }, null, 2)};`;
};

/**
 * Generates a JSON representation of design tokens formatted for Tailwind documentation
 *
 * This formatter transforms the Style Dictionary tokens into a structured JSON format
 * that can be consumed by documentation tools. It organizes tokens into categories
 * (background, border, fill, text, etc.) and enhances each token with additional
 * properties like CSS custom property representation.
 *
 * The formatter handles nested token structures and applies special formatting for
 * different token types like colors, spacing, and shadows.
 *
 * @param {Object} options - The formatter options
 * @param {Object} options.dictionary - The Style Dictionary containing all tokens
 * @param {Object} options.dictionary.tokens - The tokens object from Style Dictionary
 * @returns {Promise<string>} A JSON string containing the formatted tokens
 *
 * @example
 * // Output example (simplified):
 * // {
 * //   "background": { ... },
 * //   "border": { ... },
 * //   "text": { ... },
 * //   "spacing": { ... }
 * // }
 */
const tailwindDocsFormat = async ({ dictionary }) => {
  const formatToken = (token) => ({
    ...token,
    cssWithValue: getTokenCssCustomProperty(token),
  });

  const formatTokens = (tokens = {}) => Object.entries(tokens).reduce(
    (acc, [key, value]) => {
      if(tokens[key].$value) {
        acc[key] = formatToken(value);
      } else {
        acc[key] = formatTokens(value);
      }
      return acc;
    },
    {},
  );

  const generateTokenObject = (parent, variants = [], property) => Object.fromEntries(
    variants.map((variant) => [
      `${variant}`,
      formatToken(dictionary.tokens[parent][variant][property].color),
    ]),
  );

  const baseColors = BASE_COLOR_VARIANTS.reduce((acc, color) => {
    acc[color] = dictionary.tokens[color];
    return acc;
  }, {});

  const brandColors = {
    ...BRAND_VARIANTS.reduce((acc, brand) => {
      acc[brand] = dictionary.tokens.color[brand];
      return acc;
    }, {}),
  };

  const colorTokens = {
    alpha: {
      light: formatTokens(dictionary.tokens.color.alpha.light),
      dark: formatTokens(dictionary.tokens.color.alpha.dark),
    },
    ...formatTokens(baseColors),
    ...formatTokens(brandColors),
    "data-viz": formatTokens(dictionary.tokens["data-viz"]),
    neutral: formatTokens(dictionary.tokens.color.neutral),
    white: formatToken(dictionary.tokens.white),
    black: formatToken(dictionary.tokens.black),
  };

  const backgroundColors = {
    ...colorTokens,
    color: formatTokens(dictionary.tokens.background.color),
    status: generateTokenObject("status", STATUS_VARIANTS, "background"),
    feedback: generateTokenObject("feedback", FEEDBACK_VARIANTS, "background"),
    "application-chrome": formatToken(dictionary.tokens["application-chrome"].background.color),
    dropdown: formatToken(dictionary.tokens.dropdown.background.color),
    control: {
      default: formatToken(dictionary.tokens.control.background.color.default),
      disabled: formatToken(dictionary.tokens.control.background.color.disabled),
      concatenation: formatToken(dictionary.tokens.control.background.color.concatenation),
      readonly: formatToken(dictionary.tokens.control.background.color.readonly),
    },
  };

  const borderColors = {
    ...colorTokens,
    color: formatTokens(dictionary.tokens.border.color),
    feedback: generateTokenObject("feedback", FEEDBACK_VARIANTS, "border"),
    dropdown: formatToken(dictionary.tokens.dropdown.border.color),
    "dropdown-divider": formatToken(dictionary.tokens.dropdown.divider.color),
    control: {
      default: formatToken(dictionary.tokens.control.border.color.default),
      disabled: formatToken(dictionary.tokens.control.border.color.disabled),
      error: formatToken(dictionary.tokens.control.border.color.error),
    },
  };

  const fillColors = {
    ...colorTokens,
    icon: formatTokens(dictionary.tokens.icon.color, "fill-icon"),
    status: generateTokenObject("status", STATUS_VARIANTS, "icon"),
    feedback: generateTokenObject("feedback", FEEDBACK_VARIANTS, "icon"),
  };

  const textColors = {
    ...colorTokens,
    color: formatTokens(dictionary.tokens.text.color),
    status: generateTokenObject("status", STATUS_VARIANTS, "text"),
    feedback: generateTokenObject("feedback", FEEDBACK_VARIANTS, "text"),
    primary: formatToken(dictionary.tokens.text.primary),
    secondary: formatToken(dictionary.tokens.text.secondary),
    tertiary: formatToken(dictionary.tokens.text.tertiary),
    control: {
      placeholder: formatToken(dictionary.tokens.control.placeholder.color),
      error: formatToken(dictionary.tokens.control.text.color.error),
      valid: formatToken(dictionary.tokens.control.text.color.valid),
    },
  };

  const outlineColor = {
    focus: formatToken(dictionary.tokens["focus-ring"].outer.color),
  };

  const spacingScale = formatTokens(dictionary.tokens["spacing-scale"]);
  const borderRadiuses = {
    ...formatTokens(dictionary.tokens.border.radius),
    action: formatToken(dictionary.tokens.action.border.radius),
    control: formatToken(dictionary.tokens.control.border.radius),
    feedback: formatToken(dictionary.tokens.feedback.border.radius),
  };
  const opacity = formatTokens(dictionary.tokens.opacity);
  const zindexes = formatTokens(dictionary.tokens.zindex);
  const lineHeight = formatTokens(dictionary.tokens["line-height"]);
  const fontFamily = formatTokens(dictionary.tokens.font.family);
  const fontSize = formatTokens(dictionary.tokens.font.size);
  const fontWeight = formatTokens(dictionary.tokens.font.weight);

  const boxShadow = {
    sm: formatToken(dictionary.tokens.shadow.sm),
    md: formatToken(dictionary.tokens.shadow.md),
    lg: formatToken(dictionary.tokens.shadow.lg),
  };

  const tokens = {
    background: backgroundColors,
    border: borderColors,
    fill: fillColors,
    text: textColors,
    outline: outlineColor,
    colors: colorTokens,
    spacing: spacingScale,
    borderRadius: borderRadiuses,
    opacity,
    zIndex: zindexes,
    boxShadow,
    lineHeight,
    fontFamily,
    fontSize,
    fontWeight,
  };

  // Format as JSON
  return `${JSON.stringify(tokens, null, 2)}`;
};

/**
 * Generates a Tailwind CSS configuration file from design tokens
 *
 * This formatter transforms Style Dictionary tokens into a JavaScript module that exports
 * a Tailwind-compatible configuration object. It processes various token categories
 * (colors, spacing, border radius, etc.) and formats them as CSS custom properties.
 *
 * @param {Object} options - The formatter options
 * @param {Object} options.dictionary - The Style Dictionary containing all tokens
 * @param {Object} options.dictionary.tokens - The tokens object from Style Dictionary
 * @param {Object} options.file - The file being generated
 * @returns {Promise<string>} A JavaScript module string that exports the Tailwind configuration
 *
 * @example
 * // Output example (simplified):
 * // module.exports = {
 * //   colors: { ... },
 * //   backgroundColor: { ... },
 * //   borderColor: { ... },
 * //   spacing: { ... }
 * // }
 */
const tailwindFormat = async ({ dictionary, file }) => {
  const baseColorsTokens = Object.fromEntries(
    BASE_COLOR_VARIANTS.map((color) => [color, dictionary.tokens.colors[color]]),
  );

  const brandColorsTokens = Object.fromEntries(
    BRAND_VARIANTS.map((brand) => [brand, dictionary.tokens.colors[brand]]),
  );

  const neutralColors = Object.fromEntries(
    Object.entries(dictionary.tokens.colors.neutral)
      .filter(([, token]) => token.path)
      .map(([, token]) => [
        token.path.filter((segment) => segment !== "color").join("-"),
        token.cssWithValue,
      ]),
  );

  const feedbackColorObjects = generateColorMap(dictionary.tokens, FEEDBACK_VARIANTS, "feedback", [
    "background",
    "text",
    "fill",
    "border",
  ]);
  const { feedbackBackgroundColors, feedbackTextColors, feedbackFillColors, feedbackBorderColors } =
    feedbackColorObjects;

  const statusColorObjects = generateColorMap(dictionary.tokens, STATUS_VARIANTS, "status");
  const { statusBackgroundColors, statusTextColors, statusFillColors } = statusColorObjects;

  return `${await fileHeader({ file })}
  const baseColors = ${JSON.stringify(generateBaseColors(baseColorsTokens))};
  const dataVizColors = ${JSON.stringify(generateBaseColors(dictionary.tokens.colors["data-viz"]))};
  const neutralColors = ${JSON.stringify(neutralColors)};
  const textColors = ${JSON.stringify(getScalesAndCSSCustomProperties(dictionary.tokens.text.color))};
  const backgroundColors = ${JSON.stringify(getScalesAndCSSCustomProperties(dictionary.tokens.background.color))};
  const borderColors = ${JSON.stringify(getScalesAndCSSCustomProperties(dictionary.tokens.border.color))};
  const iconColors = ${JSON.stringify(getScalesAndCSSCustomProperties(dictionary.tokens.fill.icon))};
  const alphaDarkColors = ${JSON.stringify(getScalesAndCSSCustomProperties(dictionary.tokens.colors.alpha.dark))};
  const alphaLightColors = ${JSON.stringify(getScalesAndCSSCustomProperties(dictionary.tokens.colors.alpha.light))};
  const brandColors = ${JSON.stringify(getScalesAndCSSCustomProperties(brandColorsTokens))};
  const statusBackgroundColors = ${JSON.stringify(statusBackgroundColors)};
  const statusTextColors = ${JSON.stringify(statusTextColors)};
  const statusIconColors = ${JSON.stringify(statusFillColors)};
  const feedbackBackgroundColors = ${JSON.stringify(feedbackBackgroundColors)};
  const feedbackBorderColors = ${JSON.stringify(feedbackBorderColors)};
  const feedbackTextColors = ${JSON.stringify(feedbackTextColors)};
  const feedbackIconColors = ${JSON.stringify(feedbackFillColors)};
  const spacingScale = ${JSON.stringify(getScalesAndCSSCustomProperties(dictionary.tokens.spacing))};
  const borderRadius = ${JSON.stringify(getScalesAndCSSCustomProperties(dictionary.tokens.borderRadius))};
  const opacity = ${JSON.stringify(getScalesAndCSSCustomProperties(dictionary.tokens.opacity))};
  const zindexes = ${JSON.stringify(getScalesAndCSSCustomProperties(dictionary.tokens.zIndex))};
  const boxShadow = ${JSON.stringify(getScalesAndCSSCustomProperties(dictionary.tokens.boxShadow))};
  const lineHeight = ${JSON.stringify(getScalesAndCSSCustomProperties(dictionary.tokens.lineHeight))};
  const fontFamily = ${JSON.stringify(getScalesAndCSSCustomProperties(dictionary.tokens.fontFamily))};
  const fontSize = ${JSON.stringify(getScalesAndCSSCustomProperties(dictionary.tokens.fontSize))};
  const fontWeight = ${JSON.stringify(getScalesAndCSSCustomProperties(dictionary.tokens.fontWeight))};

  const colors = {
    inherit: 'inherit',
    current: 'currentColor',
    transparent: 'transparent',
    white: '${dictionary.tokens.colors.white.cssWithValue}',
    black: '${dictionary.tokens.colors.black.cssWithValue}',
    alpha: {
      dark: {...alphaDarkColors},
      light: {...alphaLightColors},
    },
    ...baseColors,
    ...dataVizColors,
    ...neutralColors,
    ...brandColors,
  };

  const backgroundColor = {
    ...colors,
    ...backgroundColors,
    ...statusBackgroundColors,
    ...feedbackBackgroundColors,
    'application-chrome': '${dictionary.tokens.background["application-chrome"].cssWithValue}',
    dropdown: '${dictionary.tokens.background.dropdown.cssWithValue}',
    control: {
      default: '${dictionary.tokens.background.control.default.cssWithValue}',
      disabled: '${dictionary.tokens.background.control.disabled.cssWithValue}',
      concatenation: '${dictionary.tokens.background.control.concatenation.cssWithValue}',
      readonly: '${dictionary.tokens.background.control.readonly.cssWithValue}',
    },
  };

  const borderColor  = {
    ...colors,
    ...borderColors,
    ...feedbackBorderColors,
    dropdown: '${dictionary.tokens.border.dropdown.cssWithValue}',
    'dropdown-divider': '${dictionary.tokens.border["dropdown-divider"].cssWithValue}',
    control: {
      default: '${dictionary.tokens.border.control.default.cssWithValue}',
      disabled: '${dictionary.tokens.border.control.disabled.cssWithValue}',
      error: '${dictionary.tokens.border.control.error.cssWithValue}',
    },
  };

  const outlineColor = {
    focus: '${dictionary.tokens.outline.focus.cssWithValue}',
  };

  const fill = {
    ...colors,
    ...statusIconColors,
    ...feedbackIconColors,
    icon: {
      ...iconColors,
    },
  };

  const textColor = {
    ...colors,
    ...textColors,
    ...statusTextColors,
    ...feedbackTextColors,
    primary: '${dictionary.tokens.text.primary.cssWithValue}',
    secondary: '${dictionary.tokens.text.secondary.cssWithValue}',
    tertiary: '${dictionary.tokens.text.tertiary.cssWithValue}',
    control: {
      placeholder: '${dictionary.tokens.text.control.placeholder.cssWithValue}',
      error: '${dictionary.tokens.text.control.error.cssWithValue}',
      valid: '${dictionary.tokens.text.control.valid.cssWithValue}',
    },
  };

  module.exports = {
    colors,
    backgroundColor,
    borderColor,
    outlineColor,
    textColor,
    fill,
    spacing: spacingScale,
    borderRadius,
    opacity,
    zIndex: zindexes,
    boxShadow,
    lineHeight,
    fontFamily,
    fontSize,
    fontWeight,
  }
  `;
};

// Prevents a warning about collision when building tokens
tailwindFormat.nested = true;

/**
 * Checks if a value is a design token alias reference
 * @param {*} value - The value to check for alias format
 * @returns {boolean} True if the value is an alias reference, false otherwise
 */
function isAliasValue(value) {
  return typeof value === "string" && value.startsWith("{") && value.endsWith("}");
}

/**
 * Converts alias values from dot notation to hyphen notation
 * @param {string} value - The token value to process (e.g., "{color.primary}")
 * @returns {string} The processed value with flattened aliases (e.g., "{color-primary}")
 */
function flattenAliasValue(value) {
  return value.replace(/\./g, "-");
}

/**
 * Find a token in the nested tokens structure by its path
 * @param {Object} tokens - The tokens object
 * @param {Array} path - The path array (e.g., ['button', 'default', 'primary'])
 * @returns {Object|null} The token object or null if not found
 */
function findDesignTokenByPath(tokens, path) {
  let current = tokens;
  for(const segment of path) {
    if(current && typeof current === "object" && segment in current) {
      current = current[segment];
    } else {
      return null;
    }
  }
  return current && typeof current === "object" && "$value" in current ? current : null;
}

/**
 * Checks if design token is in `/contextual` directory
 * @param {Object} token - The design token object containing filePath
 * @param {Object} token.filePath - The file path of design token definition JSON file
 * @returns {boolean} True if design token is in `/contextual` directory, else false
 */
function isContextualDesignToken(token) {
  return Boolean(token?.filePath?.includes(CONTEXTUAL_DIRECTORY));
}

/**
 * Creates a flattened token key with contextual prefix for Figma tokens
 * @param {string[]} path - Token path segments (e.g., ['color', 'blue', '500'])
 * @param {boolean} isContextual - Whether token is from /contextual/ directory
 * @returns {string} Flattened key, prefixed if contextual
 */
function createDesignTokenKey(path, isContextual) {
  const flatKey = path.join("-");
  return isContextual ? `${CONTEXTUAL_PREFIX}${flatKey}` : flatKey;
}

/**
 * Processes alias references for contextual tokens adding prefix when needed
 * @param {string} value - alias value (e.g., "{color.primary}")
 * @param {string} flattenedAlias - Flattened alias value (e.g., "{color-primary}")
 * @param {Object} allTokens - Complete tokens object to resolve alias targets
 * @returns {string} Processed alias with contextual prefix if target is contextual
 */
function processDesignTokenAlias(value, flattenedAlias, allTokens) {
  if(flattenedAlias.includes("/")) return flattenedAlias;

  const aliasToken = findDesignTokenByPath(allTokens, value.slice(1, -1).split("."));

  return isContextualDesignToken(aliasToken)
    ? `{${CONTEXTUAL_PREFIX}${flattenedAlias.slice(1, -1)}}`
    : flattenedAlias;
}

/**
 * Transforms alias values with proper contextual handling
 * @param {string} value - The alias value to transform (e.g., "{color.primary}")
 * @param {boolean} isContextual - Whether the current token is contextual
 * @param {Object|null} allTokens - Complete tokens object for alias resolution
 * @returns {string} Flattened alias, with contextual prefix if needed
 */
function transformDesignTokenAlias(value, isContextual, allTokens) {
  const flattenedAlias = flattenAliasValue(value);

  return isContextual && allTokens
    ? processDesignTokenAlias(value, flattenedAlias, allTokens)
    : flattenedAlias;
}

/**
 * Transforms design token values into Figma-compatible formats
 *
 * @param {Object} token - The design token object containing original value and type
 * @param {Object} token.original - The original token definition
 * @param {string} token.original.$type - The token type (fontFamily, number, dimension, etc.)
 * @param {*} token.original.$value - The token value to be transformed
 * @param {boolean} isContextual - Whether this token is from the contextual folder
 * @param {Object} allTokens - The complete tokens object to check if alias targets are contextual
 * @returns {*} The transformed value ready for Figma consumption
 */
function resolveFigmaValue(token, isContextual = false, allTokens = null) {
  const type = token.original?.$type;
  const value = token.original?.$value;

  // Figma expects font families as a single string rather than an array
  // Select first font family name value, ignore first value CSS custom
  // property in font stack
  if(type === "fontFamily") {
    return value[1].replace(/'/g, "");
  }

  // Ensure numeric values are proper JavaScript numbers
  // Converts string representations of numbers to actual number types
  if(type === "number") {
    return Number(value);
  }

  // Convert rem units to pixels for Figma compatibility
  // Figma works primarily with pixel values, so we convert rem using 16px base
  if(type === "dimension" && value?.unit === "rem") {
    return {
      value: parseFloat(value.value) * 16,
      unit: "px",
    };
  }

  // Transform alias references to use flattened naming convention
  // Converts dot-notation aliases (e.g., {color.red.500}) to hyphen-notation ({color-red-500})
  // to match the flattened token key structure used in Figma.
  // If the token is contextual and the alias target is also contextual, add the contextual/ prefix
  if(isAliasValue(value)) {
    return transformDesignTokenAlias(value, isContextual, allTokens);
  }

  // Return the original value unchanged for all other cases
  return value;
}

/**
 * Recursively flattens a nested design tokens structure into a flat object
 *
 * Traverses a nested token object and creates a flattened structure where
 * each token's path becomes a hyphen-separated key. Contextual tokens are
 * prefixed to distinguish them from regular tokens.
 *
 * @param {Object} tokens - The nested tokens object to flatten
 * @param {Object} [result={}] - The accumulator object for flattened tokens
 * @param {string[]} [path=[]] - The current path array for building token keys
 * @param {Object|null} [allTokens=null] - Reference to root tokens for alias resolution
 * @returns {Object} A flat object with contextual tokens properly prefixed
 */
function getFigmaFormattedTokens(tokens, { result = {}, path = [], allTokens = null } = {}) {
  // On first call, allTokens is null, so we set it to the root tokens object
  if(allTokens === null) {
    allTokens = tokens;
  }

  Object.entries(tokens).forEach(([key, token]) => {
    const currentPath = [...path, key];

    if(token && typeof token === "object" && !token.$value) {
      getFigmaFormattedTokens(token, { result, path: currentPath, allTokens });
    } else {
      // Check if token is from contextual folder and add prefix
      const isContextual = isContextualDesignToken(token);
      const flatKey = createDesignTokenKey(currentPath, isContextual);
      const tokenData = {
        $value: resolveFigmaValue(token, isContextual, allTokens),
        $type: token.original?.$type,
        $description: token.original?.$description,
        $extensions: token.original?.$extensions,
      };
      result[flatKey] = tokenData;
    }
  });

  return result;
}

/**
 * Generates flattened JSON structure for Figma design tokens with grouping
 *
 * This formatter creates a flat object structure where nested token paths are
 * joined with hyphens to create unique keys. Tokens are organized into groups:
 * - Regular tokens at root level
 * - Deprecated tokens under "DEPRECATED" group
 * - Contextual tokens under "CONTEXTUAL" group
 *
 * @param {Object} options - The formatter options
 * @param {Object} options.dictionary - The Style Dictionary containing all tokens
 * @param {Object} options.dictionary.tokens - The nested tokens object to flatten
 * @returns {Promise<string>} The formatted JSON output as a string with proper indentation
 */
const figmaFormat = async ({ dictionary }) => {
  const flatTokens = getFigmaFormattedTokens(dictionary.tokens);
  return `${JSON.stringify(flatTokens, null, 2)}\n`;
};

export {
  getScalesAndCSSCustomProperties,
  generateBaseColors,
  generateColorMap,
  getTokenCssCustomProperty,
  scssCustomPropertiesFormat,
  tailwindComponentsFormat,
  tailwindDocsFormat,
  tailwindFormat,
  findDesignTokenByPath,
  isContextualDesignToken,
  createDesignTokenKey,
  processDesignTokenAlias,
  transformDesignTokenAlias,
  getFigmaFormattedTokens,
  figmaFormat,
};
