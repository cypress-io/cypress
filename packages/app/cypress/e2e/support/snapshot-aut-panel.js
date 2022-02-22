export const snapshotAUTPanel = (name) => {
  const hideEl = ($el) => {
    $el.attr('style', 'display: none !important')
  }

  cy.percySnapshot(name, {
    // @ts-ignore
    width: 536,
    elementOverrides: {
      '[data-cy=sidebar]': hideEl,
      '[data-cy="reporter-panel"]': hideEl,
      '[data-cy="specs-list-panel"]': hideEl,
    },
  })
}
