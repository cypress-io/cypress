module.exports = {
  plugins: ['@cypress-design'],
  parser: 'vue-eslint-parser',
  parserOptions: {
    parser: '@typescript-eslint/parser',
  },
  rules: {
    '@cypress-design/deprecate-imports': [
      'warn',
      [
        {
          name: 'Alert',
          source: ['**/frontend-shared/src/components/Alert.vue'],
          docs: 'https://design.cypress.io/components/vue/Alert',
        },
        {
          name: 'Button',
          source: ['**/frontend-shared/src/components/Button.vue'],
          docs: 'https://design.cypress.io/components/vue/Button',
        },
        {
          name: 'Checkbox',
          source: ['**/frontend-shared/src/components/Checkbox.vue'],
          docs: 'https://design.cypress.io/components/vue/Checkbox',
        },
        {
          name: 'Spinner',
          source: ['**/frontend-shared/src/components/Spinner.vue'],
          docs: 'https://design.cypress.io/components/vue/Spinner',
        },
        {
          name: 'Tooltip',
          source: ['**/frontend-shared/src/components/Tooltip.vue'],
          docs: 'https://design.cypress.io/components/vue/Tooltip',
        },
      ],
    ],
  },
  settings: {
    'import/resolver': {
      typescript: {
        project: 'packages/{app,launchpad,frontend-shared}/tsconfig.json',
      },
    },
  },
}
