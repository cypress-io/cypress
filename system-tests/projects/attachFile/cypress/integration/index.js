import Uppy from '@uppy/core'
import Dashboard from '@uppy/dashboard'

import Dropzone from 'dropzone'

describe('attachFile', () => {
  it('can attach files via uppy', () => {
    cy.document().then((doc) => {
      doc.body.innerHTML = `
        <link rel="stylesheet" href="/node_modules/@uppy/core/dist/style.css" />
        <link rel="stylesheet" href="/node_modules/@uppy/dashboard/dist/style.css" />
        <div id="uppy"></div>
      `
    })

    cy.get('#uppy').then((div) => {
      new Uppy().use(Dashboard, {
        inline: true,
        target: div[0],
      })
    })

    // Because Uppy triggers file input on clicking a button - via js event
    // handler - there's no way for cypress know that a button should trigger
    // the file input. We have to target the hidden input and `force` it.
    cy.get('input').first().attachFile([
      { contents: Buffer.from('foo'), fileName: 'bar.txt' },
      { contents: Buffer.from('foo2'), fileName: 'baz.txt' },
    ], { force: true })

    cy.get('#uppy')
    .should('contain', 'bar.txt')
    .should('contain', 'baz.txt')
    .should('contain', '3 B')
    .should('contain', '4 B')
  })

  it('can attach files via dropzone', () => {
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

    // Because dropzone triggers file input on clicking a button - via js event
    // handler - there's no way for cypress know that a button should trigger
    // the file input. We have to target the hidden input and `force` it.
    cy.get('input').first().attachFile([
      { contents: Buffer.from('foo'), fileName: 'bar.txt' },
      { contents: Buffer.from('foo2'), fileName: 'baz.txt' },
    ], { force: true })

    cy.get('.dz-preview')
    .should('contain', 'bar.txt')
    .should('contain', 'baz.txt')
    .should('contain', '3 b')
    .should('contain', '4 b')
  })
})
