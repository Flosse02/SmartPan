module.exports = {
  root: true,
  extends: '@react-native',
  rules: {
    // Default @react-native config doesn't set ignoreRestSiblings, so the
    // common `const { a, b, ...rest } = x` pattern (destructure fields out
    // just to exclude them from a spread) flags a/b as unused even though
    // that's the whole point of writing them.
    '@typescript-eslint/no-unused-vars': ['error', {
      argsIgnorePattern: '^_',
      destructuredArrayIgnorePattern: '^_',
      ignoreRestSiblings: true,
    }],
  },
};
