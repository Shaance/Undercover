module.exports = {
  extends: ['airbnb-typescript/base'],
  // overrides: [
  //   {
  //     files: [
  //       "src/**/*.ts",
  //       "src/**/*.d.ts",
  //       "src**/*.test.ts",
  //       "**/**/index.ts"
  //     ],
  //     parserOptions: {
  //       project: ['./tsconfig.json'],
  //     },
  //   }
  // ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: ['./tsconfig.json'],
  },
  rules: {
    "import/extensions": 0,
    "@typescript-eslint/no-use-before-define": 0,
    "import/no-extraneous-dependencies": 0,
    "@typescript-eslint/no-redeclare": 0,
    "max-len": [1, 120, 2]
  }
};