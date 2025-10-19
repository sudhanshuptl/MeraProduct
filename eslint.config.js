// ESLint configuration for MeraProduct Chrome Extension
module.exports = [
  {
    files: ['src/**/*.js', 'scripts/**/*.js', 'tests/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: {
        chrome: 'readonly',
        browser: 'readonly',
        document: 'readonly',
        window: 'readonly',
        console: 'readonly',
        require: 'readonly',
        module: 'readonly',
        exports: 'readonly',
        process: 'readonly',
        __dirname: 'readonly',
        jest: 'readonly',
        test: 'readonly',
        describe: 'readonly',
        beforeEach: 'readonly',
        expect: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        MutationObserver: 'readonly',
        requestIdleCallback: 'readonly'
      }
    },
    rules: {
      'no-console': 'off', // Allow console for extension development
      'no-unused-vars': 'warn',
      'prefer-const': 'error',
      'no-var': 'error',
      'semi': ['error', 'always'],
      'quotes': ['error', 'single', { avoidEscape: true }]
    }
  },
  {
    files: ['tests/**/*.js'],
    rules: {
      'no-global-assign': 'off' // Allow global mocking in tests
    }
  }
];