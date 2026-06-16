import js from "@eslint/js";
import vue from "eslint-plugin-vue";

const globals = {
  Blob: "readonly",
  clearTimeout: "readonly",
  console: "readonly",
  document: "readonly",
  Event: "readonly",
  fetch: "readonly",
  globalThis: "readonly",
  IntersectionObserver: "readonly",
  localStorage: "readonly",
  MouseEvent: "readonly",
  process: "readonly",
  sessionStorage: "readonly",
  setTimeout: "readonly",
  URL: "readonly",
  window: "readonly",
};

export default [
  {
    ignores: ["coverage/**", "dist/**", "node_modules/**"],
  },
  js.configs.recommended,
  ...vue.configs["flat/essential"],
  {
    files: ["**/*.{js,vue}"],
    languageOptions: {
      ecmaVersion: "latest",
      globals,
      sourceType: "module",
    },
    rules: {
      "vue/multi-word-component-names": "off",
    },
  },
];
