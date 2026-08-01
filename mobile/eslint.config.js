const { defineConfig } = require('eslint/config');
const reactPlugin = require('eslint-plugin-react');
const reactHooksPlugin = require('eslint-plugin-react-hooks');

module.exports = defineConfig([
  // Ignore patterns (must be a standalone config object)
  {
    ignores: ['dist/**', 'node_modules/**', '.expo/**'],
  },

  // React recommended rules (flat config)
  reactPlugin.configs.flat.recommended,

  // React Hooks rules (explicitly register plugin in flat config format)
  {
    plugins: {
      'react-hooks': reactHooksPlugin,
    },
    rules: reactHooksPlugin.configs.recommended.rules,
  },

  // Base language settings and custom rules
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      // React 17+ JSX transform doesn't require React import
      'react/react-in-jsx-scope': 'off',
      // No PropTypes used — this was a TypeScript codebase
      'react/prop-types': 'off',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
]);
