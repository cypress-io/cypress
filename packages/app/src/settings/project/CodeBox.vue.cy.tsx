import CodeBox from './CodeBox.vue'
// tslint:disable-next-line: no-implicit-dependencies - unsure how to handle these
import IconOctothorpe from '~icons/cy/octothorpe_x16.svg'

describe('<CodeBox/>', () => {
  it('renders the code', () => {
    cy.mount(() =>
      (<div class="p-12 resize-x overflow-auto">
        <CodeBox code="123456789" prefixIcon={IconOctothorpe}/>
      </div>))

    cy.findByText('123456789').should('be.visible')
  })

  it('renders the confidential', () => {
    cy.mount(() =>
      (<div class="p-12 resize-x overflow-auto">
        <CodeBox confidential code="123456789" prefixIcon={IconOctothorpe}/>
      </div>))

    cy.findByText('123456789').should('not.exist')
    cy.get('[aria-label="Record Key Visibility Toggle"]').click()
    cy.findByText('123456789').should('be.visible')
  })

  it('renders the icon', () => {
    cy.mount(() =>
      (<div class="p-12 resize-x overflow-auto">
        <CodeBox code="123456789" prefixIcon={() => <IconOctothorpe data-cy="icon"/>}/>
      </div>))

    cy.get('[data-cy="icon"]').should('be.visible')
  })
})
