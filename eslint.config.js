import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    files: ["**/*.js"],
    rules: {
      semi: ["error", "always"],
      quotes: ["error", "double"],
    },
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    extends: tseslint.configs.recommended,
    rules: {
      semi: ["error", "always"],
      quotes: ["error", "double"],
    },
  },
);
