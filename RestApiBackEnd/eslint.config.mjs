import globals from "globals";
import pluginJs from "@eslint/js";
import n from "eslint-plugin-n";

/** @type {import('eslint').Linter.Config[]} */
export default [
  pluginJs.configs.recommended,
  {
    files: ["**/*.js"],
    languageOptions: {
      sourceType: "commonjs",
    },
  },
  {
    files: ["**/*.mjs"],
    languageOptions: {
      sourceType: "module",
      globals: {
        Intl: "readonly",
      },
    },
  },
  {
    languageOptions: {
      globals: globals.node,
    },
    plugins: { n },
    rules: {
      eqeqeq: ["error", "always", { null: "ignore" }],
      "require-await": "error",

      "no-cond-assign": "error",
      "no-const-assign": "error",
      "no-dupe-args": "error",
      "no-mixed-operators": "error",
      "no-useless-return": "error",
      "no-undef": "error",
      "no-invalid-this": "error",
      "no-return-assign": "error",
      "no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "no-unused-expressions": [
        "error",
        { allowTernary: true, allowTaggedTemplates: true },
      ],
      "no-console": "error",
      "array-callback-return": "error",
      // "curly": "warn",
      // "no-param-reassign": "warn",

      "no-use-before-define": [
        "error",
        {
          functions: true,
          classes: true,
          variables: true,
          allowNamedExports: false,
        },
      ],

      // ES6
      "arrow-spacing": "error",
      "no-confusing-arrow": "error",
      "no-duplicate-imports": "error",
      "no-var": "error",
      "object-shorthand": "off",
      "prefer-const": "error",
      "prefer-template": "warn",

      // NODE.JS RULES
      "n/exports-style": ["error", "module.exports"],
    },
  },
];
