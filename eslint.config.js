// @ts-check
const eslint = require('@eslint/js');
const tseslint = require('@typescript-eslint/eslint-plugin');
const tsparser = require('@typescript-eslint/parser');
const importPlugin = require('eslint-plugin-import');
const simpleImportSort = require('eslint-plugin-simple-import-sort');

module.exports = [
    // Ignore patterns
    {
        ignores: ['dist/**', 'node_modules/**', 'eslint.config.js', 'prisma/**', 'scripts/**']
    },
    // Base ESLint recommended rules
    eslint.configs.recommended,
    // Configuration for TypeScript files
    {
        files: ['**/*.ts'],
        languageOptions: {
            parser: tsparser,
            parserOptions: {
                project: './tsconfig.json',
                sourceType: 'module',
                ecmaVersion: 2021
            },
            globals: {
                console: 'readonly',
                process: 'readonly',
                __dirname: 'readonly',
                __filename: 'readonly',
                module: 'readonly',
                require: 'readonly',
                exports: 'readonly',
                Buffer: 'readonly',
                setTimeout: 'readonly',
                clearTimeout: 'readonly',
                setInterval: 'readonly',
                clearInterval: 'readonly'
            }
        },
        plugins: {
            '@typescript-eslint': tseslint,
            'import': importPlugin,
            'simple-import-sort': simpleImportSort
        },
        rules: {
            ...tseslint.configs.recommended.rules,
            'no-unused-vars': 'off',
            '@typescript-eslint/no-unused-vars': [
                'warn',
                {
                    argsIgnorePattern: '^_',
                    varsIgnorePattern: '^_',
                    caughtErrorsIgnorePattern: '^_'
                }
            ],
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-namespace': 'off',
            'simple-import-sort/imports': 'error',
            'simple-import-sort/exports': 'error',
            'import/order': [
                'error',
                {
                    groups: [
                        ['builtin', 'external'],
                        ['internal'],
                        ['parent', 'sibling', 'index']
                    ],
                    'newlines-between': 'always'
                }
            ]
        },
        settings: {
            'import/resolver': {
                typescript: true,
                node: true
            }
        }
    }
];
