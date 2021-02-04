import { mount } from '@cypress/vue'
import App from '@/App'
import store from '@/store'
import router from '@/router'
import VueRouter from 'vue-router'
import Vuex from 'vuex'

const crossword = '[data-testid=crossword-section]'
const title = '[data-testid=crossword-title]'
const prev = '[data-testid=prev]'
const next = '[data-testid=next]'
const reset = '[data-testid=reset]'
const cells = `${crossword} input`

describe('App', () => {
  beforeEach(() => {
    mount(App, { plugins: [VueRouter, Vuex], router, store })
    cy.wait(100)
  })

  it('resets the crossword correctly after you fill it in', (done) => {
    cy.get(crossword).fillCrossword({ partially: true })
    cy.get(title)
    .then((titleEl) => {
      let oldCrossword
      const oldTitle = titleEl.text()

      cy.get(crossword).getCrossword().then((text) => {
        oldCrossword = text
      })

      cy.get(reset).click()
      cy.get(crossword).should('not.have.text', oldCrossword)
      cy.get(title).should('have.text', oldTitle).then(() => done())
    })
  })

  it('renders the crossword puzzle on load', function (done) {
    cy.get(crossword).should('exist').then(() => done())
  })

  it('lets you navigate to previous days', function (done) {
    let oldTitle

    cy.get(title)
    .then((titleEl) => {
      oldTitle = titleEl.text()
      cy.get(prev).click()
      cy.get(title).should('not.have.text', oldTitle)
      cy.get(next).click()
      cy.get(title).should('have.text', oldTitle).then(() => done())
    })
  })

  it('rerenders the crossword when you go to another day', (done) => {
    cy.get(crossword).fillCrossword()
    cy.get(prev).click()
    cy.get(cells).getCrossword().should('be.empty')
    cy.get(next).click()

    cy.get(cells).getCrossword().should('be.empty').then(() => done())
  })
})
