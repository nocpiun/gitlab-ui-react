// oxlint-disable typescript/no-require-imports
const defaults = require('./tailwind.defaults');

/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [defaults],
  darkMode: ['variant', ['&:where(.dark *)']],
  content: [
    // './.storybook/**/*.js',
    // './src/**/*.{vue,js}',
    // '!./src/**/*.spec.js',
    // '!./src/vendor/bootstrap-vue/node_modules/**',
    // '!./src/vendor/bootstrap/**',
    // './src/scss/typescale/*_demo.html',
  ],
};
