import ButtonBar from './ButtonBar.vue'

describe('<ButtonBar />', () => {
  let nextFn: ReturnType<typeof cy.stub>
  let backFn: ReturnType<typeof cy.stub>

  beforeEach(() => {
    nextFn = cy.stub()
    backFn = cy.stub()
  })

  it('playground', () => {
    cy.mount(() => <ButtonBar next="Next Step" back="Back" nextFn={nextFn} backFn={backFn} />)
  })

  it('should trigger the next function', () => {
    cy.mount(() => <ButtonBar next="Next Step" back="Back" nextFn={nextFn} backFn={backFn} canNavigateForward={true} />)
    cy.contains('Next Step')
    .click()
    .then(() => {
      expect(nextFn).to.have.been.calledOnce
    })
  })

  it('should trigger the back function', () => {
    cy.mount(() => <ButtonBar next="Next Step" back="Back" nextFn={nextFn} backFn={backFn} />)
    cy.contains('Back')
    .click()
    .then(() => {
      expect(backFn).to.have.been.calledOnce
    })
  })

  it('should show a switch on the right when alt is mentionned and onAlt is set', () => {
    const altFunction = cy.spy()

    cy.mount(() => (
      <ButtonBar next="Next Step" back="Back" nextFn={nextFn} backFn={backFn} altFn={altFunction} alt="Install manually" />
    ))

    cy.contains('Install manually')
    .click()
    .then(() => {
      expect(altFunction).to.have.been.calledOnce
    })
  })
})
