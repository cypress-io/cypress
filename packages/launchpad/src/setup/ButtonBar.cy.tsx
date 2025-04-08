import ButtonBar from './ButtonBar.vue'
// tslint:disable-next-line: no-implicit-dependencies - need to handle this
import { defaultMessages } from '@cy/i18n'

const { next: nextLabel, back: backLabel } = defaultMessages.setupPage.step

describe('<ButtonBar />', () => {
  let nextFn: ReturnType<typeof cy.stub>
  let backFn: ReturnType<typeof cy.stub>

  beforeEach(() => {
    nextFn = cy.stub()
    backFn = cy.stub()
  })

  it('playground', () => {
    cy.mount(() => <ButtonBar next={nextLabel} back={backLabel} nextFn={nextFn} backFn={backFn} />)
  })

  it('should trigger the next function', () => {
    cy.mount(() => <ButtonBar next={nextLabel} back={backLabel} nextFn={nextFn} backFn={backFn} canNavigateForward={true} />)
    cy.contains(nextLabel)
    .click()
    .then(() => {
      expect(nextFn).to.have.been.calledOnce
    })
  })

  it('should trigger the back function', () => {
    cy.mount(() => <ButtonBar next={nextLabel} back={backLabel} nextFn={nextFn} backFn={backFn} />)
    cy.contains(backLabel)
    .click()
    .then(() => {
      expect(backFn).to.have.been.calledOnce
    })
  })

  it('should show a switch on the right when alt is mentionned and onAlt is set', () => {
    const altFunction = cy.spy()

    cy.mount(() => (
      <ButtonBar next={nextLabel} back={backLabel} nextFn={nextFn} backFn={backFn} altFn={altFunction} alt="Install manually" />
    ))

    cy.findAllByLabelText('Install manually')
    .click()
    .then(() => {
      expect(altFunction).to.have.been.calledOnce
    })
  })

  it('changes the main button variant', () => {
    const altFunction = cy.spy()

    cy.mount(() => (
      <ButtonBar next="Waiting for you" back={backLabel} nextFn={nextFn} backFn={backFn} altFn={altFunction} mainVariant='pending'/>
    ))

    cy.contains('button', 'Waiting for you').find('svg').should('be.visible')
  })
})
