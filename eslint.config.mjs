import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = defineConfig([
  ...nextVitals,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Vendored Stageshow kit (MIT, ported from TypeScript). Kept as it ships
    // rather than rewritten to this app's lint rules, so it can be updated.
    "src/components/stageshow/**",
  ]),
]);

export default eslintConfig;
