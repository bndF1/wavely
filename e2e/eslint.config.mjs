import playwright from 'eslint-plugin-playwright';

export default [
  playwright.configs['flat/recommended'],
  {
    files: ['**/*.ts', '**/*.js'],
    // Override or add rules here
    rules: {},
  },
];
