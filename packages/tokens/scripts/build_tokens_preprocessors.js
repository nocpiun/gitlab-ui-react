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

/**
 * Removes descriptions from tokens
 *
 * A preprocessor function to remove $description from tokens so they
 * are not included as comments in the generated output files.
 *
 * Usage:
 *
 * ```javascript
 * StyleDictionary.registerPreprocessor({
 *   name: 'stripDescriptions',
 *   preprocessor: stripDescriptionsPreprocessor,
 * });
 * ```
 *
 * @param {Object} dictionary - StyleDictionary's dictionary object
 * @returns {Object} - Modified dictionary object
 */
const stripDescriptionsPreprocessor = (dictionary) => {
  function stripDescription(node) {
    if(node === null || typeof node !== "object") {
      return node;
    }
    if(Array.isArray(node)) {
      return node.map((el) => stripDescription(el));
    }

    const entries = Object.entries(node)
      // recursively traverse token objects and skip $description attributes
      .filter(([k]) => k !== "$description")
      .map(([k, v]) => [k, stripDescription(v)]);
    return Object.fromEntries(entries);
  }

  return stripDescription(dictionary);
};

/**
 * Resolves unit objects to string values
 *
 * A preprocessor function that converts objects with `value` and `unit` properties
 * to string representations (e.g., { value: 16, unit: 'px' } -> '16px').
 *
 * Usage:
 *
 * ```javascript
 * StyleDictionary.registerPreprocessor({
 *   name: 'gitlab/resolve-units',
 *   preprocessor: resolveUnitsPreprocessor,
 * });
 * ```
 *
 * @param {Object} dictionary - StyleDictionary's dictionary object
 * @returns {Object} - Modified dictionary object
 */
const resolveUnitsPreprocessor = (dictionary) => {
  function traverse(node) {
    if(node === null || typeof node !== "object") {
      return node;
    }

    // Convert unit objects to strings
    if(
      node.value !== undefined &&
      node.unit !== undefined &&
      (typeof node.value === "number" || !Number.isNaN(Number(node.value))) &&
      typeof node.unit === "string" &&
      node.unit.trim().length > 0
    ) {
      return `${node.value}${node.unit}`;
    }

    // Recursively handle arrays and objects
    return Array.isArray(node)
      ? node.map((element) => traverse(element))
      : Object.fromEntries(Object.entries(node).map(([k, v]) => [k, traverse(v)]));
  }

  return traverse(dictionary);
};

/**
 * Selects the "default" value from design tokens
 *
 * A preprocessor function that handles tokens with a structure containing
 * both "default" and "dark" properties, returning only the "default" value.
 *
 * Usage:
 *
 * ```javascript
 * StyleDictionary.registerPreprocessor({
 *   name: 'gitlab/select-default-value',
 *   preprocessor: selectDefaultValuePreprocessor,
 * });
 * ```
 *
 * @param {Object} dictionary - StyleDictionary's dictionary object
 * @returns {Object} - Modified dictionary object with only default values
 */
const selectDefaultValuePreprocessor = (dictionary) => {
  function traverse(node) {
    if(node === null || typeof node !== "object" || Array.isArray(node)) {
      return node;
    }

    // If object has a "default" property, return its value
    if(node.default != null && node.dark != null && Object.keys(node).length === 2) {
      return node.default;
    }

    // Recursively handle nested objects
    return Object.fromEntries(Object.entries(node).map(([k, v]) => [k, traverse(v)]));
  }

  return traverse(dictionary);
};

/**
 * Selects the "dark" value from design tokens
 *
 * A preprocessor function that handles tokens with a structure containing
 * both "default" and "dark" properties, returning only the "dark" value.
 *
 * Usage:
 *
 * ```javascript
 * StyleDictionary.registerPreprocessor({
 *   name: 'gitlab/select-dark-value',
 *   preprocessor: selectDarkValuePreprocessor,
 * });
 * ```
 *
 * @param {Object} dictionary - StyleDictionary's dictionary object
 * @returns {Object} - Modified dictionary object with only dark values
 */
const selectDarkValuePreprocessor = (dictionary) => {
  function traverse(node) {
    if(node === null || typeof node !== "object" || Array.isArray(node)) {
      return node;
    }

    // If object has a "dark" property, return its value
    if(node.default != null && node.dark != null && Object.keys(node).length === 2) {
      return node.dark;
    }

    // Recursively handle nested objects
    return Object.fromEntries(Object.entries(node).map(([k, v]) => [k, traverse(v)]));
  }

  return traverse(dictionary);
};

/**
 * Selects the value from design tokens color formats
 *
 * A preprocessor function that returns a string value for colors
 *
 * Usage:
 *
 * ```javascript
 * StyleDictionary.registerPreprocessor({
 *   name: 'gitlab/select-color-value',
 *   preprocessor: selectColorValuePreprocessor,
 * });
 * ```
 *
 * @param {Object} dictionary - StyleDictionary's dictionary object
 * @returns {Object} - Modified dictionary object with color string values
 */
const selectColorValuePreprocessor = (dictionary) => {
  function traverse(node) {
    if(node === null || typeof node !== "object" || Array.isArray(node)) {
      return node;
    }

    // Return HEX property if provided
    if(node.colorSpace === "srgb" && node.hex) {
      return node.hex;
    }

    // Return CSS RGBA format if hex property not provided
    if(node.colorSpace === "srgb" && node.components && node.alpha !== undefined) {
      const [r, g, b] = node.components.map((component) => Math.round(component * 255));
      return `rgba(${r}, ${g}, ${b}, ${node.alpha})`;
    }

    // Recursively handle nested objects
    return Object.fromEntries(Object.entries(node).map(([k, v]) => [k, traverse(v)]));
  }

  return traverse(dictionary);
};

/**
 * Resolves clamp string values to dimension objects
 *
 * A preprocessor function that clamp() strings to dimension objects
 * with `value` and `unit` properties
 * e.g., 'clamp(1.125rem, 0.9027777778rem + 0.462962963vw, 1.25rem)'
 * -> { value: 1.25, unit: 'rem' }.
 *
 * Usage:
 *
 * ```javascript
 * StyleDictionary.registerPreprocessor({
 *   name: 'gitlab/convert-clamp-string-to-dimension',
 *   preprocessor: convertClampStringToDimension,
 * });
 * ```
 *
 * @param {Object} dictionary - StyleDictionary's dictionary object
 * @returns {Object} - Modified dictionary object
 */
const convertClampStringToDimension = (dictionary) => {
  function traverse(node) {
    if(node === null || typeof node !== "object" || Array.isArray(node)) {
      return node;
    }

    if(node.$type === "string" && typeof node.$value === "string") {
      const clampMatch = node.$value.match(/^clamp\s*\(\s*[^,]+,\s*[^,]+,\s*([^)]+)\s*\)$/);

      if(clampMatch) {
        const maxValue = clampMatch[1].trim();
        const valueMatch = maxValue.match(/^([\d.]+)(rem|px|)$/);

        if(valueMatch) {
          const [, value, unit] = valueMatch;
          return {
            ...node,
            $type: "dimension",
            $value: {
              value: parseFloat(value),
              unit,
            },
          };
        }
      }
    }

    // Recursively handle nested objects
    return Object.fromEntries(Object.entries(node).map(([k, v]) => [k, traverse(v)]));
  }

  return traverse(dictionary);
};

export {
  stripDescriptionsPreprocessor,
  resolveUnitsPreprocessor,
  selectDefaultValuePreprocessor,
  selectDarkValuePreprocessor,
  selectColorValuePreprocessor,
  convertClampStringToDimension,
};


