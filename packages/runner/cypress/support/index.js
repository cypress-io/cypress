require('@packages/ui-components/cypress/support/customPercyCommand')({
  elementOverides: {
    '.stats .duration': ($el) => $el.text('XX.XX'),
    '.cy-tooltip': true,
  },
})
