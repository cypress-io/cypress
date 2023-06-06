import TestingTypePromo from './TestingTypePromo.vue'

describe('<TestingTypePromo />', () => {
  describe('component testing', () => {
    it('triggers event on button click', () => {
      const stub = cy.stub().as('activateTestingType')

      cy.mount(<TestingTypePromo testingType="component" onActivateTestingType={stub} />)

      cy.get('button').click()

      cy.get('@activateTestingType').should('have.been.calledOnceWith', 'component')
    })

    it('has expected utm params on links', () => {
      cy.mount(<TestingTypePromo testingType="component" />)

      cy.findByTestId('testing-type-promo-guide-link').should('have.attr', 'href').and((href) => {
        const params = new URL(href as any as string).searchParams

        expect(params.get('utm_medium')).to.eql('CT Preview')
        expect(params.get('utm_campaign')).to.eql('Read our guide')
      })

      cy.findAllByTestId('testing-type-promo-framework-link').should('have.attr', 'href').and((href) => {
        const params = new URL(href as any as string).searchParams

        expect(params.get('utm_medium')).to.eql('CT Preview')
        expect(params.get('utm_campaign')).to.be.oneOf(['Angular', 'React', 'Vue', 'More'])
      })

      cy.findByTestId('testing-type-promo-feedback-link').should('have.attr', 'href').and((href) => {
        const params = new URL(href as any as string).searchParams

        expect(params.get('utm_medium')).to.eql('CT Preview')
        expect(params.get('utm_campaign')).to.eql('Give feedback')
      })
    })
  })

  describe('e2e testing', () => {
    it('renders', () => {
      cy.mount(<TestingTypePromo testingType="e2e" />)

      cy.percySnapshot()
    })

    it('triggers event on button click', () => {
      const stub = cy.stub().as('activateTestingType')

      cy.mount(<TestingTypePromo testingType="e2e" onActivateTestingType={stub} />)

      cy.get('button').click()

      cy.get('@activateTestingType').should('have.been.calledOnceWith', 'e2e')
    })

    it('has expected utm params on links', () => {
      cy.mount(<TestingTypePromo testingType="e2e" />)

      cy.findByTestId('testing-type-promo-guide-link').should('have.attr', 'href').and((href) => {
        const params = new URL(href as any as string).searchParams

        expect(params.get('utm_medium')).to.eql('E2E Preview')
        expect(params.get('utm_campaign')).to.eql('Read our guide')
      })
    })
  })
})
