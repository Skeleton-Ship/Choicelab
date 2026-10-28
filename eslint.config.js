import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    // Build output (the player's dist/ is compiled from src/player/src)
    ignores: ["dist/**", "src/player/dist/**"],
  },
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
