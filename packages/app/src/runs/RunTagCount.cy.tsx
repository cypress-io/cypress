import RunTagCount from './RunTagCount.vue'

describe('<RunTagCount />', () => {
  it('should show a normal tag count', () => {
    cy.mount({
      name: 'RunTagCount',
      render () {
        return (
          <RunTagCount
            value={5}
            tooltipData={{
              flaky: 1,
              branchName: 'test-branch',
              tags: ['tag-one', 'tag-two'],
            }}
          />
        )
      },
    })

    cy.get(`[data-cy="runTagCount"`).should('be.visible').contains('5')
    cy.findAllByLabelText('1 Flaky Branch Name: test-branch tag-one tag-two').should('exist')
  })
})
