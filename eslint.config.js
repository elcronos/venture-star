import sonarjs from "eslint-plugin-sonarjs";
import tsparser from "@typescript-eslint/parser";
import tsplugin from "@typescript-eslint/eslint-plugin";
export default [
  {
    files: ["src/**/*.{js,jsx,ts,tsx}"],
    languageOptions: { parser: tsparser, ecmaVersion: "latest", sourceType: "module" },
    plugins: { "@typescript-eslint": tsplugin, sonarjs },
    rules: {
      "complexity": ["error", 50],
      "sonarjs/cognitive-complexity": ["error", 40],
      "max-lines-per-function": ["error", { max: 200, skipBlankLines: true, skipComments: true }],
      "max-lines": ["error", { max: 1500, skipBlankLines: true, skipComments: true }],
      "no-console": "error",
    },
  },
];
