import ExampleDebugMapping from './ExampleDebugMapping.vue'

context('Complete Debug Page states', () => {
  const spec = {
    id: 'a1b',
  }

  describe('singular specs', () => {
    it('single test', () => {
      const test = {
        id: '917504a3-10a2-4c8a-a9c8-5f5e0be50ce2',
        specId: 'a1b',
      }

      cy.mount(
        <ExampleDebugMapping specs={[spec]} tests={[test]} />,
      )

      let specId

      cy.findByTestId(`spec-${spec.id}`).then(($div) => {
        specId = $div.text()
      })

      cy.findByTestId(`failed-test-${test.specId}-${test.id}`).then(($div) => {
        const testId = $div.text()

        expect(testId).equal(specId)
      })
    })
  })
})
