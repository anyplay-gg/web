import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import { anyplayRules, marketingRules } from "@anyplay/eslint-config";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([".next/**", "out/**", "next-env.d.ts", "public/**", "test-results/**", "playwright-report/**"]),
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: anyplayRules,
  },
  {
    files: ["src/components/landing/**/*.{ts,tsx}", "src/components/auth/**/*.{ts,tsx}", "src/components/account/**/*.{ts,tsx}", "src/components/legal/**/*.{ts,tsx}"],
    rules: marketingRules,
  },
]);
