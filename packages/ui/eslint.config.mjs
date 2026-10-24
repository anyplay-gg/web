import { packageConfig } from "@anyplay/eslint-config";

export default [
  ...packageConfig,
  {
    // The one place that may import the motion library: it is the gate every animation goes through.
    files: ["src/motion.ts"],
    rules: { "no-restricted-imports": "off" },
  },
];
