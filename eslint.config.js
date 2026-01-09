import js from '@eslint/js';
import stylisticPlugin from '@stylistic/eslint-plugin';
import taskadePlugin from '@taskade/eslint-plugin';
import prettierPlugin from 'eslint-plugin-prettier';
import simpleImportSortPlugin from 'eslint-plugin-simple-import-sort';
import tsEslint from 'typescript-eslint';

export default [
  js.configs.recommended,
  ...tsEslint.configs.recommended,
  {
    ignores: ['dist', 'coverage', 'node_modules'],
  },
  {
    files: ['**/*.ts'],
    languageOptions: {
      parserOptions: {
        project: './tsconfig.eslint.json',
      },
    },
    plugins: {
      '@taskade': taskadePlugin,
      prettier: prettierPlugin,
      '@stylistic': stylisticPlugin,
      'simple-import-sort': simpleImportSortPlugin,
    },
    rules: {
      // Use only the basic rules from our plugin for now
      ...taskadePlugin.configs.base.rules,
      ...taskadePlugin.configs.recommended.rules,
      '@typescript-eslint/strict-boolean-expressions': 'error',
    },
  },
];
