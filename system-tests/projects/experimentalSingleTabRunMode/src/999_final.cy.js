it('verifies AUT is destroyed after each spec', () => {
  // there are three other specs that have run by now
  // so the aut destroy count should be 3
  expect(window.top.getEventManager().autDestroyedCount).to.eq(3)
})
