import Card from './Card.vue'
// tslint:disable-next-line: no-implicit-dependencies - unsure how to handle these module imports
import IconE2E from '~icons/cy/testing-type-e2e_x64.svg'
// tslint:disable-next-line: no-implicit-dependencies - unsure how to handle these module imports
import IconE2ESolid from '~icons/cy/testing-type-e2e-solid_x64.svg'
// tslint:disable-next-line: no-implicit-dependencies - unsure how to handle these module imports
import IconComponent from '~icons/cy/testing-type-component_x64.svg'
// tslint:disable-next-line: no-implicit-dependencies - unsure how to handle these module imports
import IconComponentSolid from '~icons/cy/testing-type-component-solid_x64.svg'

describe('Card', { viewportHeight: 400 }, () => {
  it('renders with icons, text, and focus state', () => {
    const e2eTitle = 'E2E Testing'
    const e2eDescription = 'Build and test the entire experience of your application from end-to-end to ensure each flow matches your expectations.'
    const ctTitle = 'Component Testing'
    const ctDescription = 'Build and test your components from your design system in isolation in order to ensure each state matches your expectations.'

    cy.mount(() => {
      const clickSpy = cy.spy().as('clickSpy')

      return (<div class="flex m-[32px] justify-center">
        <Card
          title={e2eTitle}
          class="m-[16px] px-[40px] pt-[36px] pb-[32px] w-[336px]"
          description={e2eDescription}
          icon={IconE2E}
          hoverIcon={IconE2ESolid}
          iconSize={64}
          onClick={clickSpy}
          variant='jade'/>
        <Card
          title={ctTitle}
          class="m-[16px] px-[40px] pt-[36px] pb-[32px] w-[336px]"
          description={ctDescription}
          iconSize={64}
          icon={IconComponent}
          hoverIcon={IconComponentSolid}
          onClick={clickSpy}
          variant='jade'/>
      </div>)
    })

    cy.contains('button', e2eTitle)
    .as('e2eTitle')
    .should('be.visible')
    .and('not.be.disabled')

    cy.contains(e2eDescription).should('be.visible')

    cy.contains('button', ctTitle)
    .as('ctTitle')
    .should('be.visible')
    .and('not.be.disabled')

    cy.contains(ctDescription).should('be.visible')

    // health check that expected icons and hover icons are present in the dom
    cy.get('svg').should('have.length', 4)

    // cy.percySnapshot('both cards unfocused') TODO: Find out why focus state is not captured in Percy.

    cy.get('@e2eTitle').should('not.be.focused')
    cy.get('@e2eTitle').focus()
    cy.get('@e2eTitle').should('be.focused')
    // cy.percySnapshot('card-1 focused') TODO: Find out why focus state is not captured in Percy.

    cy.get('@ctTitle').focus()
    cy.get('@ctTitle').should('be.focused')
    // cy.percySnapshot('card-2 focused') TODO: Find out why focus state is not captured in Percy.

    // clicks work on card or button
    cy.get('[data-cy="card"]').eq(0).click()
    cy.get('[data-cy="card"]').eq(1).click()
    cy.get('@e2eTitle').click()
    cy.get('@ctTitle').click()
    cy.get('@clickSpy').should('have.callCount', 4)
  })

  it('renders disabled state', () => {
    const clickSpy = cy.spy().as('clickSpy')

    cy.mount(() => {
      return (
        <div class="flex m-[32px] justify-center">
          <Card
            title="Disabled card"
            class="m-[16px] px-[40px] pt-[36px] pb-[32px] w-[336px]"
            description="Can't do this now!"
            icon={IconE2E}
            hoverIcon={IconE2ESolid}
            iconSize={64}
            disabled
            onClick={clickSpy}
            variant='jade'/>
        </div>
      )
    })

    // button should be disabled
    cy.contains('button', 'Disabled card')
    .should('be.visible')
    .and('be.disabled')

    // Asserting on pointer-events property because
    // we can't actually click it

    cy.get('[data-cy="card"]')
    .should('have.css', 'cursor', 'default')

    cy.get('@clickSpy').should('not.have.been.called')

    cy.percySnapshot()
  })
})
