import PizzaShop from './PizzaShop/index.vue'
import router from './PizzaShop/router'
import { mount } from '@cypress/vue'

// TODO: fix with https://github.com/cypress-io/cypress/issues/30706
describe.skip('Vue Router - Pizza Shop', () => {
  // configure component
  const extensions = {
    plugins: [router],
    components: {
      PizzaShop,
    },
  }

  // define component template
  const template = '<router-view />'

  // initialize a fresh Vue app before each test
  beforeEach(() => {
    mount({ template, router }, { extensions })
  })

  it('go to order page', () => {
    cy.get('button.order').click()
    cy.contains('Toppings')
  })

  it('order veggie option', () => {
    // go back to home page
    // from: /order -> to: /
    cy.get('a.home').click()

    // order a meatlover pizza
    // to: /order/meatlover
    cy.get('a.order-veggie')
    .click()
    .then(() => {
      const { path, params } = Cypress.vue.$route

      expect(path).to.eql('/order/veggie')
      expect(params).to.eql({ preset: 'veggie' })
    })

    // veggie pizza shouldn't have any meat
    // we wouldn't want a lawsuit
    for (const topping of ['chicken', 'steak', 'bacon', 'ham']) {
      cy.get('.order-overview > ul > li').should('not.contain', topping)
    }
  })

  it('order meatlover option', () => {
    // go back to home page
    // from: /order/veggie -> to: /
    cy.get('a.home')
    .click()
    .then(() => {
      const { path, query, params } = Cypress.vue.$route

      expect(path).to.eql('/')
      expect(query).to.be.empty
      expect(params).to.be.empty
    })

    // order a meatlover pizza
    // to: /order/meatlover
    cy.get('a.order-meatlover')
    .click()
    .then(() => {
      const { path, params } = Cypress.vue.$route

      expect(path).to.eql('/order/meatlover')
      expect(params).to.eql({ preset: 'meatlover' })
    })
  })

  it('order cheese option', () => {
    // directly control the router from your test
    cy.wrap(Cypress.vue.$router).then(($router) => {
      return $router.push({ name: 'home' })
    })

    // order just a cheese
    // to: /order?cheese=true
    cy.get('a.order-cheese')
    .click()
    .then(() => {
      const { path, query } = Cypress.vue.$route

      expect(path).to.eql('/order')
      expect(query).to.eql({ cheese: 'true' })
    })

    // cheese topping should be in the order overview
    cy.get('.order-overview > ul > li').contains('cheese')
  })

  it('order hawaiian + peppers pizza without using UI', () => {
    cy.wrap(Cypress.vue.$router)
    .then(($router) => $router.push({ name: 'home' }))
    .then(($router) => {
      return $router.push({
        name: 'order',
        params: { preset: 'hawaiian' },
        query: { peppers: true },
      })
    })
  })
})
