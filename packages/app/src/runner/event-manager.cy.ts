describe('event manager', () => {
  describe('teardown', () => {
    it('should reset the prompt store', () => {
      const resetState = cy.stub()
      const eventManager = window.top!.getEventManager()

      eventManager['promptStore'].resetState = resetState

      eventManager.teardown({
        setIsLoading: cy.stub(),
      } as any, true)

      expect(resetState).to.have.been.calledOnce
    })
  })
})
