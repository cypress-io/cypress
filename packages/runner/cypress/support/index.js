require('@packages/ui-components/cypress/support/customPercyCommand')({
  elementOverrides: {
    '.stats .duration': ($el) => $el.text('XX.XX'),
    '.cy-tooltip': true,
  },
})
