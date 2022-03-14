// Takes percy snapshot with navigation/AUT hidden and run duration mocked
export const snapshotReporter = () => {
  cy.percySnapshot({
    width: 450,
    elementOverrides: {
      '.cy-tooltip': true,
      '.runnable-header .duration': ($el) => {
        $el.text('XX:XX')
      },
      '[data-cy=sidebar]': ($el) => {
        $el.attr('style', 'display: none !important')
      },
      '[data-cy=aut-panel]': ($el) => {
        $el.attr('style', 'display: none !important')
      },
      '[data-cy=reporter-panel]': ($el) => {
        $el.attr('style', 'width: 450px !important')
      },
    },
  })
}
