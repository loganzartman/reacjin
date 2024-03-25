// @ts-check

import eslint from '@eslint/js';
import prettier from 'eslint-config-prettier';
import noRelativeImportPaths from 'eslint-plugin-no-relative-import-paths';
import pluginReact from 'eslint-plugin-react';
import pluginHooks from 'eslint-plugin-react-hooks';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import unusedImports from 'eslint-plugin-unused-imports';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: ['node_modules/*', 'dist/*'],
  },
  {
    languageOptions: {
      sourceType: 'module',
    },
    plugins: {
      simpleImportSort,
      noRelativeImportPaths,
      unusedImports,
    },
    rules: {
      'simpleImportSort/imports': 'error',
      'simpleImportSort/exports': 'error',
      'noRelativeImportPaths/no-relative-import-paths': [
        'error',
        {allowSameFolder: false, rootDir: '.', prefix: '@'},
      ],
      'unusedImports/no-unused-imports': 'error',
      'no-constant-condition': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    plugins: {
      react: pluginReact,
    },
    rules: pluginReact.configs['jsx-runtime'].rules,
  },
  {
    plugins: {
      'react-hooks': pluginHooks,
    },
    // @ts-expect-error broken types
    rules: pluginHooks.configs.recommended.rules,
  },
  prettier,
);
