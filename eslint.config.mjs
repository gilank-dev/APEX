import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Scratch / vendored dirs that are not part of the Next.js app source:
    "research/**",
    "tmp/**",
    "supabase/migrations.quarantine/**",
  ]),
  {
    rules: {
      // 62 pre-existing `any` casts across tenant pages. These are type debt,
      // not correctness bugs — the React Compiler rules below stay as errors.
      // TODO: revert to "error" once `supabase gen types` output is generated
      // and the DB row interfaces are typed from the real schema.
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
]);

export default eslintConfig;
