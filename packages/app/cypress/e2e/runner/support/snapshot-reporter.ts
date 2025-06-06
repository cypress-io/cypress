// Takes percy snapshot with navigation/AUT/reporter hidden
export const snapshotReporter = () => {
  let sidebarWidth = 0

  cy.get('[data-cy=sidebar]')
  .invoke('width')
  .then((w) => {
    if (w) {
      sidebarWidth = w
    }
  }).then(() => {
    cy.get('[data-cy=reporter-panel]')
  })
  .invoke('width')
  .then((w) => {
    cy.percySnapshot({
      width: w + sidebarWidth,
      elementOverrides: {
        '.cy-tooltip': true,
        '[data-cy=sidebar]': ($el) => {
          $el.attr('style', 'display: none !important')
        },
        '[data-cy=aut-panel]': ($el) => {
          $el.attr('style', 'display: none !important')
        },
        '[data-cy=reporter-running-icon]': ($el) => {
          // remove 'fa-spin' class so that the icon is not animated
          $el.attr('class', '')
        },
        '.command-progress': ($el) => {
          // don't display command progress bar in snapshot
          $el.attr('style', 'display: none !important')
        },
      },
    })
  })
}
