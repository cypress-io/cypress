// Takes percy snapshot with navigation/AUT hidden and run duration mocked
export const reporterSnapshot = (height?: number) => {
  // @ts-ignore
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
        let styleString = 'width: 450px !important'

        if (height) {
          styleString = `${styleString }; height: ${height}px !important`
        }

        $el.attr('style', styleString)
      },
    },
  })
}
