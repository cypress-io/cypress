/// <reference types="cypress" />
import { mount, initEnv, getCypressTestBed } from '@cypress/angular'
import { AppComponent } from './app.component'
import { HeroService } from './hero.service'

describe('Basics', () => {
  beforeEach(() => {
    initEnv(AppComponent, { providers: [HeroService] })
  })

  it('shows inputs', () => {
    mount(AppComponent, { title: 'World' })

    cy.contains('World app is running!')
    cy.contains('toto,titi')
    cy.get('#twitter-logo').should(
      'have.css',
      'background-color',
      'rgb(255, 0, 0)',
    )
  })

  it('stub service', () => {
    const componentService = getCypressTestBed().inject(HeroService)

    cy.stub(componentService, 'getHeroes').returns(['tutu', 'tata'])

    mount(AppComponent, { title: 'World' })

    cy.contains('World app is running!')
    cy.contains('tutu,tata')
    cy.get('#twitter-logo').should(
      'have.css',
      'background-color',
      'rgb(255, 0, 0)',
    )
  })
})

describe('Trying to use cy.visit in component spec', () => {
  it('throws an error', (done) => {
    Cypress.on('fail', (err) => {
      expect(err.message).equals(
        'cy.visit from a component spec is not allowed',
      )

      done()

      return false
    })

    cy.visit('https://google.com')
  })
})
