it('will exit even if an beforeload event dialog is present in a child window', function () {
  cy.window().invoke('open', '/blocking_beforeunload_event.html')
})
