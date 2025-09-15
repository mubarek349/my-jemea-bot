/** @type {import('lint-staged').Config} */
module.exports = {
  '*.{ts,tsx}': [
    'eslint --fix',
    'prettier --write',
    'jest --bail --findRelatedTests',
  ],
  '*.{js,jsx}': [
    'eslint --fix',
    'prettier --write',
  ],
  '*.{json,md,yml,yaml}': [
    'prettier --write',
  ],
  '*.{css,scss}': [
    'prettier --write',
  ],
};
