import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

// CLAUDE.md convention #2 — RTL is a release gate, so physical Tailwind
// spacing/positioning utilities are banned everywhere. Use logical ones:
//   ml-/mr- -> ms-/me-, pl-/pr- -> ps-/pe-,
//   text-left/text-right -> text-start/text-end, left-N/right-N -> start-N/end-N.
const PHYSICAL_CLASS_REGEX =
  "\\b(ml|mr|pl|pr)-|\\btext-left\\b|\\btext-right\\b|\\bleft-[0-9]|\\bright-[0-9]";

const PHYSICAL_CLASS_MESSAGE =
  "Physical spacing/positioning utility detected. RTL support requires logical properties (CLAUDE.md convention #2): use ms-/me- instead of ml-/mr-, ps-/pe- instead of pl-/pr-, text-start/text-end instead of text-left/text-right, start-*/end-* instead of left-*/right-*.";

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    files: ["src/**/*.{js,jsx,ts,tsx}"],
    rules: {
      "no-restricted-syntax": [
        "error",
        // Plain string literals inside className={...} / className="..."
        {
          selector: `JSXAttribute[name.name="className"] Literal[value=/${PHYSICAL_CLASS_REGEX}/]`,
          message: PHYSICAL_CLASS_MESSAGE,
        },
        // Template literals inside className={`...`}
        {
          selector: `JSXAttribute[name.name="className"] TemplateElement[value.raw=/${PHYSICAL_CLASS_REGEX}/]`,
          message: PHYSICAL_CLASS_MESSAGE,
        },
        // Class strings assembled outside JSX via cn()/cva()/clsx()/twMerge()
        {
          selector: `CallExpression[callee.name=/^(cn|cva|clsx|twMerge)$/] Literal[value=/${PHYSICAL_CLASS_REGEX}/]`,
          message: PHYSICAL_CLASS_MESSAGE,
        },
        {
          selector: `CallExpression[callee.name=/^(cn|cva|clsx|twMerge)$/] TemplateElement[value.raw=/${PHYSICAL_CLASS_REGEX}/]`,
          message: PHYSICAL_CLASS_MESSAGE,
        },
      ],
    },
  },
  {
    // next-i18next requires a CommonJS config file; next.config.ts imports it too.
    files: ["next-i18next.config.js"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
];

export default eslintConfig;
