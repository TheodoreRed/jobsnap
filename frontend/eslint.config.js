import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import unicorn from 'eslint-plugin-unicorn'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    ignores: ['coverage', 'dist', 'node_modules']
  },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite
    ],
    plugins: { unicorn },
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser
    },
    rules: {
      'unicorn/filename-case': [
        'error',
        {
          cases: { kebabCase: true },
          ignore: [
            String.raw`^[A-Z].*\.tsx$`, // React components
            String.raw`^use[A-Z].*\.ts$` // hooks starting with "use"
          ]
        }
      ]
    }
  }
])
