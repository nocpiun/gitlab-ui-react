// oxlint-disable typescript/no-require-imports

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

const { range, round } = require("lodash-es");
const plugin = require("tailwindcss/plugin");
const { tailwindCQsMQsPlugin } = require("@gitlab/ui/tailwind_cqs_mqs_plugin");
const {
  colors,
  backgroundColor,
  borderColor,
  outlineColor,
  fill,
  textColor,
  spacing,
  borderRadius,
  opacity,
  zIndex,
  boxShadow,
  lineHeight,
  fontFamily,
  fontSize,
  fontWeight,
} = require("@gitlab-ui-react/tokens/dist/tailwind/tokens.cjs");
const { typographyComponents } = require("@gitlab-ui-react/tokens/dist/tailwind/components.cjs");

const buildCQs = Boolean(process.env.USE_TAILWIND_CONTAINER_QUERIES);

function addCustomDefinitions({ addComponents, addUtilities }) {
  addComponents({
    ".action-neutral-colors": {
      color: "var(--gl-action-neutral-foreground-color-default)",
      "background-color": "var(--gl-action-neutral-background-color-default)",
      "border-color": "var(--gl-action-neutral-border-color-default)",
      "&:hover": {
        color: "var(--gl-action-neutral-foreground-color-hover)",
        "background-color": "var(--gl-action-neutral-background-color-hover)",
        "border-color": "var(--gl-action-neutral-border-color-hover)",
      },
      "&:focus-visible": {
        color: "var(--gl-action-neutral-foreground-color-focus)",
        "background-color": "var(--gl-action-neutral-background-color-focus)",
        "border-color": "var(--gl-action-neutral-border-color-focus)",
      },
      "&:active": {
        color: "var(--gl-action-neutral-foreground-color-active)",
        "background-color": "var(--gl-action-neutral-background-color-active)",
        "border-color": "var(--gl-action-neutral-border-color-active)",
      },
    },
    ".action-confirm-colors": {
      color: "var(--gl-action-confirm-foreground-color-default)",
      "background-color": "var(--gl-action-confirm-background-color-default)",
      "border-color": "var(--gl-action-confirm-border-color-default)",
      "&:hover": {
        color: "var(--gl-action-confirm-foreground-color-hover)",
        "background-color": "var(--gl-action-confirm-background-color-hover)",
        "border-color": "var(--gl-action-confirm-border-color-hover)",
      },
      "&:focus-visible": {
        color: "var(--gl-action-confirm-foreground-color-focus)",
        "background-color": "var(--gl-action-confirm-background-color-focus)",
        "border-color": "var(--gl-action-confirm-border-color-focus)",
      },
      "&:active": {
        color: "var(--gl-action-confirm-foreground-color-active)",
        "background-color": "var(--gl-action-confirm-background-color-active)",
        "border-color": "var(--gl-action-confirm-border-color-active)",
      },
    },
    ".action-danger-colors": {
      color: "var(--gl-action-danger-foreground-color-default)",
      "background-color": "var(--gl-action-danger-background-color-default)",
      "border-color": "var(--gl-action-danger-border-color-default)",
      "&:hover": {
        color: "var(--gl-action-danger-foreground-color-hover)",
        "background-color": "var(--gl-action-danger-background-color-hover)",
        "border-color": "var(--gl-action-danger-border-color-hover)",
      },
      "&:focus-visible": {
        color: "var(--gl-action-danger-foreground-color-focus)",
        "background-color": "var(--gl-action-danger-background-color-focus)",
        "border-color": "var(--gl-action-danger-border-color-focus)",
      },
      "&:active": {
        color: "var(--gl-action-danger-foreground-color-active)",
        "background-color": "var(--gl-action-danger-background-color-active)",
        "border-color": "var(--gl-action-danger-border-color-active)",
      },
    },
    ".bg-action-neutral": {
      "background-color": "var(--gl-action-neutral-background-color-default)",
      "&:hover": {
        "background-color": "var(--gl-action-neutral-background-color-hover)",
      },
      "&:focus-visible": {
        "background-color": "var(--gl-action-neutral-background-color-focus)",
      },
      "&:active": {
        "background-color": "var(--gl-action-neutral-background-color-active)",
      },
    },
    ".animate-skeleton-loader": {
      overflow: "hidden",
      "max-width": "32rem",
      "background-size": "32rem 100%",
      "background-position": "-32rem 0",
      "background-color": "var(--gl-skeleton-loader-background-color)",
      "background-image":
        "linear-gradient(to right, var(--gl-skeleton-loader-background-color) 0, var(--gl-skeleton-loader-shimmer-color) 23%, var(--gl-skeleton-loader-shimmer-color) 27%, var(--gl-skeleton-loader-background-color) 50%)",
      "background-repeat": "no-repeat",
      "@media (prefers-reduced-motion: no-preference)": {
        animation: "gl-keyframes-skeleton-loader 2.5s linear",
        "animation-delay": "inherit",
        "animation-iteration-count": "3",
      },
      "@keyframes gl-keyframes-skeleton-loader": {
        "0%": {
          // absolute numbers are required to make the animation width-independent
          "background-position-x": "-32rem",
        },
        "100%": {
          "background-position-x": "32rem",
        },
      },
    },
    ".bg-control": {
      "background-color": "var(--gl-control-background-color-default)",
      "&:disabled": {
        "background-color": "var(--gl-control-background-color-disabled)",
      },
      "&:readonly": {
        "background-color": "var(--gl-control-background-color-readonly)",
      },
    },
    ".border": {
      "border-style": "solid",
      "border-color": "var(--gl-border-color-default)",
    },
    ".border-t": {
      "border-top-style": "solid",
      "border-top-color": "var(--gl-border-color-default)",
    },
    ".border-r": {
      "border-right-style": "solid",
      "border-right-color": "var(--gl-border-color-default)",
    },
    ".border-b": {
      "border-bottom-style": "solid",
      "border-bottom-color": "var(--gl-border-color-default)",
    },
    ".border-l": {
      "border-left-style": "solid",
      "border-left-color": "var(--gl-border-color-default)",
    },
    ".border-control": {
      "border-color": "var(--gl-control-border-color-default)",
      "&:hover": {
        "border-color": "var(--gl-control-border-color-hover)",
      },
      "&:focus-visible": {
        "border-color": "var(--gl-control-border-color-focus)",
      },
      "&:disabled": {
        "border-color": "var(--gl-control-border-color-disabled)",
      },
    },
    ".str-truncated": {
      display: "inline-block",
      "min-width": "0",
      "overflow-x": "clip",
      "overflow-y": "visible",
      "text-overflow": "ellipsis",
      "vertical-align": "top",
      "white-space": "nowrap",
      "max-width": "82%",
    },
    ".no-spin[type=\"number\"]": {
      "&::-webkit-outer-spin-button": {
        "-webkit-appearance": "none",
        margin: "0",
      },
      "&::-webkit-inner-spin-button": {
        "-webkit-appearance": "none",
        margin: "0",
      },
      "-moz-appearance": "textfield",
    },
    ...typographyComponents,
  });

  addUtilities({
    ".font-monospace": {
      "font-family":
        "var(--default-mono-font, \"GitLab Mono\"), \"JetBrains Mono\", \"Menlo\", \"DejaVu Sans Mono\", \"Liberation Mono\", \"Consolas\", \"Ubuntu Mono\", \"Courier New\", \"andale mono\", \"lucida console\", monospace",
      "font-variant-ligatures": "none",
    },
    ".break-anywhere": {
      "overflow-wrap": "anywhere",
      "word-break": "normal",
    },
    ".wrap-anywhere": {
      "overflow-wrap": "anywhere",
    },
    ".border-b-solid": {
      "border-bottom-style": "solid",
    },
    ".border-b-initial": {
      "border-bottom-style": "initial",
    },
    ".border-l-solid": {
      "border-left-style": "solid",
    },
    ".border-r-solid": {
      "border-right-style": "solid",
    },
    ".border-t-solid": {
      "border-top-style": "solid",
    },
    ".clearfix": {
      "&::after": {
        display: "block",
        clear: "both",
        content: "\"\"",
      },
    },
    ".focus": {
      "box-shadow":
        "0 0 0 1px var(--gl-focus-ring-inner-color), 0 0 0 3px var(--gl-focus-ring-outer-color)",
      outline: "none",
    },
    ".focus-inset": {
      "box-shadow":
        "inset 0 0 0 2px var(--gl-focus-ring-outer-color), inset 0 0 0 3px var(--gl-focus-ring-inner-color), inset 0 0 0 1px var(--gl-focus-ring-inner-color)",
      outline: "none",
    },
    ".text-align-inherit": {
      "text-align": "inherit",
    },
    ".truncate": {
      "overflow-x": "clip",
      "overflow-y": "visible",
      "text-overflow": "ellipsis",
      "white-space": "nowrap",
      "min-width": "0",
    },
  });
}

const widthPercentageScales = [8, 10, 20].reduce((accumulator1, denominator) => (
  {
    ...accumulator1,
    ...range(1, denominator).reduce((accumulator2, numerator) => {
      const width = (numerator / denominator) * 100;

      return {
        ...accumulator2,
        [`${numerator}/${denominator}`]: `${round(width, 6)}%`,
      };
    }, {}),
  }
), {});

/** @type {import('tailwindcss').Config} */
module.exports = {
  corePlugins: {
    /*
     * Disable preflight styles so that `@tailwind base` compiles to CSS vars declarations without
     * any of the resets which we don't need.
     * More on this at https://tailwindcss.com/docs/preflight.
     */
    preflight: false,
    ringOffsetColor: false,
    ringOpacity: false,
    ringWidth: false,
    ringColor: false,
    ringOffsetWidth: false,
  },
  plugins: [plugin(addCustomDefinitions), tailwindCQsMQsPlugin(buildCQs)],
  theme: {
    animation: {
      spin: "spin 0.6s infinite linear",
    },
    backgroundColor,
    borderColor,
    borderRadius: {
      ...borderRadius,
      6: "1.5rem",
      base: ".25rem",
      small: ".125rem",
      pill: ".75rem",
    },
    boxShadow: {
      DEFAULT: boxShadow.md,
      none: "none",
      ...boxShadow,
      "inner-1-blue-500": "inset 0 0 0 1px var(--blue-500, #1f75cb)",
      "inner-1-gray-100": "inset 0 0 0 1px var(--gray-100, #dcdcde)",
      "inner-1-border-default":
        "inset 0 0 0 1px var(--gl-border-color-default, var(--gl-color-neutral-100, #dcdcde))",
      "inner-1-border-subtle":
        "inset 0 0 0 1px var(--gl-border-color-subtle, var(--gl-color-neutral-50, #ececef))",
      "inner-1-border-strong":
        "inset 0 0 0 1px var(--gl-border-color-strong, var(--gl-color-neutral-200, #bfbfc3))",
      "inner-1-gray-200": "inset 0 0 0 1px var(--gray-200, #bfbfc3)",
      "inner-1-gray-400": "inset 0 0 0 1px var(--gray-400, #89888d)",
      "inner-1-red-300": "inset 0 0 0 1px var(--red-300, #f57f6c)",
      "inner-1-red-400": "inset 0 0 0 1px var(--red-400, #ec5941)",
      "inner-1-red-500": "inset 0 0 0 1px var(--red-500, #dd2b0e)",
      "inner-2-blue-400": "inset 0 0 0 2px var(--blue-400, #428fdc)",
      "inner-b-1-gray-100": "inset 0 -1px 0 0 var(--gray-100, #dcdcde)",
      "inner-b-1-border-default":
        "inset 0 -1px 0 0 var(--gl-border-color-default, var(--gl-color-neutral-100, #dcdcde))",
      "inner-b-2-blue-500": "inset 0 -2px 0 0 var(--blue-500, #1f75cb)",
      "inner-l-3-red-600": "inset 3px 0 0 0 var(--red-600, #c91c00)",
      "inner-l-4-gray-100": "inset 4px 0 0 0 var(--gray-100, #dcdcde)",
      "x0-y0-b3-s1-blue-500": "inset 0 0 3px 1px var(--blue-500, #1f75cb)",
      "x0-y2-b4-s0": "0 2px 4px 0 #0000001a",
    },
    colors,
    dropShadow: {
      DEFAULT: [
        "0 0 0.5px var(--gl-shadow-color-default, #05050629)",
        "0 0.5px 1px var(--gl-shadow-color-default, #05050629)",
        "0 1px 3px var(--gl-shadow-color-default, #05050629)",
      ],
      none: "none",
      sm: [
        "0 0 1px var(--gl-shadow-color-default, #05050629)",
        "0 0.5px 2px var(--gl-shadow-color-default, #05050629)",
      ],
      md: [
        "0 0 0.5px var(--gl-shadow-color-default, #05050629)",
        "0 0.5px 1px var(--gl-shadow-color-default, #05050629)",
        "0 1px 3px var(--gl-shadow-color-default, #05050629)",
      ],
      lg: [
        "0 0 1px var(--gl-shadow-color-default, #05050629)",
        "0 0 2px var(--gl-shadow-color-default, #05050629)",
        "0 2px 8px var(--gl-shadow-color-default, #05050629)",
      ],
    },
    fill,
    fontFamily,
    fontSize: {
      ...fontSize,
      "size-h-display": "1.75rem",
      "size-h1": "1.4375rem",
      "size-h2": "1.1875rem",
      "size-h1-xl": "2rem",
      "size-h2-xl": "1.4375rem",
      "size-reset": "inherit",
    },
    fontWeight,
    lineHeight: {
      reset: "inherit",
      0: "0",
      1: "1",
      normal: "1rem",
      ...lineHeight,
    },
    opacity,
    outlineColor,
    screens: {
      sm: "576px",
      md: "768px",
      lg: "992px",
      xl: "1200px",
    },
    spacing,
    textColor,
    transitionDuration: {
      DEFAULT: "200ms",
      slow: "400ms",
      medium: "200ms",
      fast: "100ms",
    },
    transitionTimingFunction: {
      DEFAULT: "ease",
      ease: "ease",
      linear: "linear",
    },
    zIndex,
    extend: {
      borderWidth: {
        1: "1px",
      },
      flexGrow: {
        2: "2",
      },
      gridTemplateRows: {
        auto: "auto",
      },
      maxWidth: {
        ...widthPercentageScales,
        screen: "100vw",
        limited: "1006px",
        "1/2": "50%",
      },
      transitionProperty: {
        "box-shadow": "box-shadow",
        "border-color": "border-color",
        "stroke-opacity": "stroke-opacity",
        background: "background",
        left: "left",
        opacity: "opacity",
        padding: "padding",
        right: "right",
        stroke: "stroke",
        transform: "transform",
        width: "width",
      },
      width: widthPercentageScales,
    },
  },
};
