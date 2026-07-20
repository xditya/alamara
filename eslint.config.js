// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
  },
  {
    rules: {
      // Data-loading hooks intentionally set loading/data state inside effects. This rule
      // is advisory (perf guidance), not a correctness check, so keep it as a warning.
      "react-hooks/set-state-in-effect": "warn",
      // Reanimated shared values are intentionally mutable (`sharedValue.value = …`); this
      // React-Compiler rule misreads them as immutable. Keep visible as a warning.
      "react-hooks/immutability": "warn",
    },
  },
]);
