import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["app/**/*.tsx"],
    rules: {
      // The Julia golden master intentionally uses native img elements so its
      // exported markup and loading behaviour stay unchanged.
      "@next/next/no-img-element": "off",
    },
  },
  {
    files: ["app/mobile-claytone.tsx", "public/claytone-enhancements.js"],
    rules: {
      // Dormant promotion/before-after hooks are retained for data-driven
      // clients while those optional sections are empty in the Julia sample.
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
  {
    files: ["site-data.mjs"],
    rules: {
      "import/no-anonymous-default-export": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
