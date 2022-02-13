// Takes percy snapshot with navigation/AUT hidden and run duration mocked
export const reporterSnapshot = () => {
  // @ts-ignore
  cy.percySnapshot({
    width: 320,
    elementOverrides: {
      '[data-cy=aut-panel]': true,
      '.cy-tooltip': true,
      '[data-cy=sidebar]': ($el) => {
        $el.attr('style', 'display: none !important')
      },
      '.runnable-header .duration': ($el) => {
        $el.text('XX:XX')
      },
    },
  })
}
