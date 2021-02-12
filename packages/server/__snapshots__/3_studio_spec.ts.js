exports['e2e studio / extends test'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:      1.2.3                                                                            │
  │ Browser:      FooBrowser 88                                                                    │
  │ Specs:        1 found (extend.spec.js)                                                         │
  │ Searched:     cypress/integration/extend.spec.js                                               │
  │ Experiments:  experimentalStudio=true                                                          │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  extend.spec.js                                                                  (1 of 1)


  extends test


  extends test
    ✓ tracks each type of event and appends to existing test


  1 passing


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        1                                                                                │
  │ Passing:      1                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     extend.spec.js                                                                   │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Video)

  -  Started processing:  Compressing to 32 CRF                                                     
  -  Finished processing: /XXX/XXX/XXX/cypress/videos/extend.spec.js.mp4                  (X second)


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  extend.spec.js                           XX:XX        1        1        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        1        1        -        -        -  


`

exports['extend.spec.js'] = `
import { openStudio, saveStudio, verifyCommandLog } from '../support'

const isTextTerminal = Cypress.config('isTextTerminal')

describe('extends test', () => {
  openStudio()

  it('tracks each type of event and appends to existing test', () => {
    Cypress.config('isTextTerminal', isTextTerminal)

    cy.visit('/index.html').then(() => {
      Cypress.emit('run:end')
    })

    cy.get('.link', { log: false }).click({ log: false })
    cy.get('.input-text', { log: false }).type('testing', { log: false })
    cy.get('.input-radio', { log: false }).click({ log: false })
    cy.get('.input-checkbox', { log: false }).click({ log: false })
    cy.get('.input-checkbox', { log: false }).click({ log: false })
    cy.get('.select', { log: false }).select('1', { log: false })
    cy.get('.multiple', { log: false }).select(['0', '2'], { log: false })

    verifyCommandLog(1, {
      selector: '.link',
      name: 'click',
    })

    verifyCommandLog(2, {
      selector: '.input-text',
      name: 'type',
      message: 'testing',
    })

    verifyCommandLog(3, {
      selector: '.input-radio',
      name: 'check',
    })

    verifyCommandLog(4, {
      selector: '.input-checkbox',
      name: 'check',
    })

    verifyCommandLog(5, {
      selector: '.input-checkbox',
      name: 'uncheck',
    })

    verifyCommandLog(6, {
      selector: '.select',
      name: 'select',
      message: '1',
    })

    verifyCommandLog(7, {
      selector: '.multiple',
      name: 'select',
      message: '[0, 2]',
    })

    saveStudio()
    /* ==== Generated with Cypress Studio ==== */
    cy.get('.link').click();
    cy.get('.input-text').type('testing');
    cy.get('.input-radio').check();
    cy.get('.input-checkbox').check();
    cy.get('.input-checkbox').uncheck();
    cy.get('.select').select('1');
    cy.get('.multiple').select(['0', '2']);
    /* ==== End Cypress Studio ==== */
  })
})

`

exports['e2e studio / creates new test'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:      1.2.3                                                                            │
  │ Browser:      FooBrowser 88                                                                    │
  │ Specs:        1 found (new.spec.js)                                                            │
  │ Searched:     cypress/integration/new.spec.js                                                  │
  │ Experiments:  experimentalStudio=true                                                          │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  new.spec.js                                                                     (1 of 1)


  creates new test


  creates new test
    test suite
      ✓ New Test


  1 passing


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        1                                                                                │
  │ Passing:      1                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     new.spec.js                                                                      │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Video)

  -  Started processing:  Compressing to 32 CRF                                                     
  -  Finished processing: /XXX/XXX/XXX/cypress/videos/new.spec.js.mp4                     (X second)


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  new.spec.js                              XX:XX        1        1        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        1        1        -        -        -  


`

exports['new.spec.js'] = `
import { openStudio, saveStudio, verifyCommandLog, verifyVisit } from '../support'

const isTextTerminal = Cypress.config('isTextTerminal')

describe('creates new test', () => {
  openStudio()

  describe('test suite', () => {
    before(() => {
      Cypress.config('isTextTerminal', isTextTerminal)

      Cypress.emit('run:end')

      cy.wrap(Cypress.$(window.top.document.body), { log: false })
      .find('.runner', { log: false })
      .find('.input-active', { log: false })
      .type('new.html', { log: false }).then(() => {
        // we have to send a jquery click here since Cypress throws an error
        // as the click triggers a cy.visit() in the runner
        Cypress.$(window.top.document.body).find('.btn-submit').click()
      })

      cy.get('.btn', { log: false }).click({ log: false })

      verifyVisit('new.html')

      verifyCommandLog(2, {
        selector: '.btn',
        name: 'click',
      })

      saveStudio('My New Test')
    })

    /* === Test Created with Cypress Studio === */
    it('My New Test', function() {
      /* ==== Generated with Cypress Studio ==== */
      cy.visit('new.html');
      cy.get('.btn').click();
      /* ==== End Cypress Studio ==== */
    });
  })
})

`

exports['e2e studio / can write to imported files'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:      1.2.3                                                                            │
  │ Browser:      FooBrowser 88                                                                    │
  │ Specs:        1 found (external.spec.js)                                                       │
  │ Searched:     cypress/integration/external.spec.js                                             │
  │ Experiments:  experimentalStudio=true                                                          │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  external.spec.js                                                                (1 of 1)


  extends external test


  extends external test
    ✓ can write to an imported test


  1 passing


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        1                                                                                │
  │ Passing:      1                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     external.spec.js                                                                 │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Video)

  -  Started processing:  Compressing to 32 CRF                                                     
  -  Finished processing: /XXX/XXX/XXX/cypress/videos/external.spec.js.mp4                (X second)


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  external.spec.js                         XX:XX        1        1        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        1        1        -        -        -  


`

exports['external.spec.js'] = `
import { openStudio } from '../support'
import { externalTest } from '../support/external'

describe('extends external test', () => {
  openStudio()

  externalTest()
})

`

exports['external.js'] = `
import { saveStudio, verifyCommandLog } from './index'

const isTextTerminal = Cypress.config('isTextTerminal')

export const externalTest = () => {
  it('can write to an imported test', () => {
    Cypress.config('isTextTerminal', isTextTerminal)

    cy.visit('/index.html').then(() => {
      Cypress.emit('run:end')
    })

    cy.get('.link', { log: false }).click({ log: false })

    verifyCommandLog(1, {
      selector: '.link',
      name: 'click',
    })

    saveStudio()
    /* ==== Generated with Cypress Studio ==== */
    cy.get('.link').click();
    /* ==== End Cypress Studio ==== */
  })
}

`
