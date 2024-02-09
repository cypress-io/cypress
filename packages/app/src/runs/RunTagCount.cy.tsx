import RunTagCount from './RunTagCount.vue'

describe('<RunTagCount />', () => {
  it('should show all information', () => {
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

  it('should show tags only', () => {
    cy.mount({
      name: 'RunTagCount',
      render () {
        return (
          <RunTagCount
            value={5}
            tooltipData={{
              tags: ['tag-one', 'tag-two'],
            }}
          />
        )
      },
    })

    cy.get(`[data-cy="runTagCount"`).should('be.visible').contains('5')
    cy.findAllByLabelText('tag-one tag-two').should('exist')
  })

  it('should show flaky only', () => {
    cy.mount({
      name: 'RunTagCount',
      render () {
        return (
          <RunTagCount
            value={5}
            tooltipData={{
              flaky: 1,
            }}
          />
        )
      },
    })

    cy.get(`[data-cy="runTagCount"`).should('be.visible').contains('5')
    cy.findAllByLabelText('1 Flaky').should('exist')
  })

  it('should show branch only', () => {
    cy.mount({
      name: 'RunTagCount',
      render () {
        return (
          <RunTagCount
            value={5}
            tooltipData={{
              branchName: 'test-branch',
            }}
          />
        )
      },
    })

    cy.get(`[data-cy="runTagCount"`).should('be.visible').contains('5')
    cy.findAllByLabelText('Branch Name: test-branch').should('exist')
  })
})
