import { launchStudio } from './helper'

describe('Cypress Studio Interactions', () => {
  beforeEach(() => {
    launchStudio({ specName: 'dom-interactions.cy.js' })
  })

  it('supprts interactions with radio buttons', () => {
    cy.getAutIframe().within(() => {
      cy.get('#radio-1').realClick()
    })

    cy.get('.cm-line').should('contain.text', `cy.get('#radio-1').check();`)
  })

  it('supprts interactions with checkboxes', () => {
    cy.getAutIframe().within(() => {
      cy.get('#check-target').realClick()
    })

    cy.get('.cm-line').should('contain.text', `cy.get('[name="check"]').check();`)
  })

  it('supprts interactions with select elements', () => {
    cy.getAutIframe().within(() => {
      cy.get('#select-target').select('2')
    })
  })

  it('supprts interactions with multiple select elements', () => {
    cy.getAutIframe().within(() => {
      cy.get('#select-target-multi').select(['1', '2'])
    })
  })

  it('supprts interactions with text elements', () => {
    cy.getAutIframe().within(() => {
      cy.get('#text-target').type('hello world!')
    })
  })

  it('supprts interactions with content editable elements', () => {
    cy.getAutIframe().within(() => {
      cy.get('#content-editable-input').type('hello world!')
    })
  })

  it('supprts interactions with textarea elements', () => {
    cy.getAutIframe().within(() => {
      cy.get('#area-target').type('hello world!')
    })
  })
})
