import Dropzone from 'dropzone'

describe('selectFile', () => {
  describe('uppy', () => {
    beforeEach(() => {
      cy.visit('cypress/fixtures/uppy.html')
    })

    it('can input files', () => {
      // Because Uppy triggers file input on clicking a button - via js event
      // handler - there's no way for cypress know that a button should trigger
      // the file input. We have to target the hidden input and `force` it.
      cy.get('input').first().selectFile([
        { contents: Cypress.Buffer.from('foo'), fileName: 'bar.txt' },
        { contents: Cypress.Buffer.from('foo2'), fileName: 'baz.txt' },
      ], { force: true })

      cy.get('#uppy')
      .should('contain', 'bar.txt')
      .should('contain', 'baz.txt')
      .should('contain', '3 B')
      .should('contain', '4 B')
    })

    it('can drop files', () => {
      cy.get('.uppy-Dashboard-AddFiles').first().selectFile([
        { contents: Cypress.Buffer.from('foo'), fileName: 'bar.txt' },
        { contents: Cypress.Buffer.from('foo2'), fileName: 'baz.txt' },
      ], { action: 'drag-drop' })

      cy.get('#uppy')
      .should('contain', 'bar.txt')
      .should('contain', 'baz.txt')
      .should('contain', '3 B')
      .should('contain', '4 B')
    })
  })

  describe('dropzone', () => {
    beforeEach(() => {
      cy.document().then((doc) => {
        doc.body.innerHTML = `
          <link rel="stylesheet" href="/node_modules/dropzone/dist/basic.css" />
          <form class="dropzone"></form>
        `
      })

      cy.get('.dropzone').then((div) => {
        new Dropzone(div[0], {
          url: 'example.com',
          hiddenInputContainer: div[0],
          autoProcessQueue: false,
        })
      })
    })

    it('can input files via dropzone', () => {
      // Because dropzone triggers file input on clicking a button - via js event
      // handler - there's no way for cypress know that a button should trigger
      // the file input. We have to target the hidden input and `force` it.
      cy.get('input').first().selectFile([
        { contents: Cypress.Buffer.from('foo'), fileName: 'bar.txt' },
        { contents: Cypress.Buffer.from('foo2'), fileName: 'baz.txt' },
      ], { force: true })

      cy.get('.dz-preview')
      .should('contain', 'bar.txt')
      .should('contain', 'baz.txt')
      .should('contain', '3 b')
      .should('contain', '4 b')
    })

    it('can drop files via dropzone', () => {
      // Because dropzone triggers file input on clicking a button - via js event
      // handler - there's no way for cypress know that a button should trigger
      // the file input. We have to target the hidden input and `force` it.
      cy.get('.dropzone').first().selectFile([
        { contents: Cypress.Buffer.from('foo'), fileName: 'bar.txt' },
        { contents: Cypress.Buffer.from('foo2'), fileName: 'baz.txt' },
      ], { action: 'drag-drop' })

      cy.get('.dz-preview')
      .should('contain', 'bar.txt')
      .should('contain', 'baz.txt')
      .should('contain', '3 b')
      .should('contain', '4 b')
    })
  })
})
