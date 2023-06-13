exports['e2e studio / extends test'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:      1.2.3                                                                            │
  │ Browser:      FooBrowser 88                                                                    │
  │ Specs:        1 found (extend.spec.js)                                                         │
  │ Searched:     cypress/e2e/extend.spec.js                                               │
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

  -  Started compressing:  Compressing to 32 CRF                                                     
  -  Finished compressing: /XXX/XXX/XXX/cypress/videos/extend.spec.js.mp4                  (X second)


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  extend.spec.js                           XX:XX        1        1        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        1        1        -        -        -  


`

exports['studio extend.spec.js'] = `
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
    cy.get('.input-radio', { log: false }).rightclick({ log: false })
    cy.get('.__cypress-studio-assertions-menu', { log: false }).shadow({ log: false }).contains('not be checked', { log: false }).click({ log: false })
    cy.get('.input-radio', { log: false }).click({ log: false })
    cy.get('.input-radio', { log: false }).rightclick({ log: false })
    cy.get('.__cypress-studio-assertions-menu', { log: false }).shadow({ log: false }).contains('be checked', { log: false }).click({ log: false })
    cy.get('.input-checkbox', { log: false }).click({ log: false })
    cy.get('.input-checkbox', { log: false }).click({ log: false })
    cy.get('.select', { log: false }).select('1', { log: false })
    cy.get('.multiple', { log: false }).select(['0', '2'], { log: false })
    cy.get('.link', { log: false }).rightclick({ log: false })
    cy.get('.__cypress-studio-assertions-menu', { log: false })
    .shadow({ log: false })
    .contains('have class', { log: false })
    .parents('.assertion-type', { log: false })
    .trigger('mouseover', { log: false })
    .find('.assertion-options', { log: false })
    .contains('link', { log: false })
    .click({ log: false })

    verifyCommandLog(1, {
      selector: '.link',
      name: 'click',
    })

    verifyCommandLog(2, {
      selector: '.input-text',
      name: 'clear',
    })

    verifyCommandLog(3, {
      selector: '.input-text',
      name: 'type',
      message: 'testing',
    })

    verifyCommandLog(4, {
      selector: '.input-radio',
      name: 'assert',
      message: 'expect <input.input-radio> to not be checked',
    })

    verifyCommandLog(5, {
      selector: '.input-radio',
      name: 'check',
    })

    verifyCommandLog(6, {
      selector: '.input-radio',
      name: 'assert',
      message: 'expect <input.input-radio> to be checked',
    })

    verifyCommandLog(7, {
      selector: '.input-checkbox',
      name: 'check',
    })

    verifyCommandLog(8, {
      selector: '.input-checkbox',
      name: 'uncheck',
    })

    verifyCommandLog(9, {
      selector: '.select',
      name: 'select',
      message: '1',
    })

    verifyCommandLog(10, {
      selector: '.multiple',
      name: 'select',
      message: '[0, 2]',
    })

    verifyCommandLog(11, {
      selector: '.link',
      name: 'assert',
      message: 'expect <a.link> to have class link',
    })

    saveStudio()
    /* ==== Generated with Cypress Studio ==== */
    cy.get('.link').click();
    cy.get('.input-text').clear();
    cy.get('.input-text').type('testing');
    cy.get('.input-radio').should('not.be.checked');
    cy.get('.input-radio').check();
    cy.get('.input-radio').should('be.checked');
    cy.get('.input-checkbox').check();
    cy.get('.input-checkbox').uncheck();
    cy.get('.select').select('1');
    cy.get('.multiple').select(['0', '2']);
    cy.get('.link').should('have.class', 'link');
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
  │ Searched:     cypress/e2e/new.spec.js                                                  │
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

  -  Started compressing:  Compressing to 32 CRF                                                     
  -  Finished compressing: /XXX/XXX/XXX/cypress/videos/new.spec.js.mp4                     (X second)


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  new.spec.js                              XX:XX        1        1        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        1        1        -        -        -  


`

exports['studio new.spec.js'] = `
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

    /* ==== Test Created with Cypress Studio ==== */
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
  │ Searched:     cypress/e2e/external.spec.js                                             │
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

  -  Started compressing:  Compressing to 32 CRF                                                     
  -  Finished compressing: /XXX/XXX/XXX/cypress/videos/external.spec.js.mp4                (X second)


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  external.spec.js                         XX:XX        1        1        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        1        1        -        -        -  


`

exports['studio external.spec.js'] = `
import { openStudio } from '../support'
import { externalTest } from '../support/external'

describe('extends external test', () => {
  openStudio()

  externalTest()
})

`

exports['studio external.js'] = `
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

exports['e2e studio / extends test without source maps'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:      1.2.3                                                                            │
  │ Browser:      FooBrowser 88                                                                    │
  │ Specs:        1 found (extend.spec.js)                                                         │
  │ Searched:     cypress/e2e/extend.spec.js                                               │
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

  -  Started compressing:  Compressing to 32 CRF                                                     
  -  Finished compressing: /XXX/XXX/XXX/cypress/videos/extend.spec.js.mp4                  (X second)


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  extend.spec.js                           XX:XX        1        1        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        1        1        -        -        -  


`

exports['studio-no-source-maps extend.spec.js'] = `
import { openStudio, saveStudio, verifyCommandLog } from '../../../studio/cypress/support'

const isTextTerminal = Cypress.config('isTextTerminal')

describe('extends test', () => {
  openStudio()

  it('tracks each type of event and appends to existing test', () => {
    Cypress.config('isTextTerminal', isTextTerminal)

    cy.visit('/index.html').then(() => {
      Cypress.emit('run:end')
    })

    cy.get('.btn', { log: false }).click({ log: false })

    verifyCommandLog(1, {
      selector: '.btn',
      name: 'click',
    })

    saveStudio()
    /* ==== Generated with Cypress Studio ==== */
    cy.get('.btn').click();
    /* ==== End Cypress Studio ==== */
  })
})

`

exports['e2e studio / creates new test without source maps'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:      1.2.3                                                                            │
  │ Browser:      FooBrowser 88                                                                    │
  │ Specs:        1 found (new.spec.js)                                                            │
  │ Searched:     cypress/e2e/new.spec.js                                                  │
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

  -  Started compressing:  Compressing to 32 CRF                                                     
  -  Finished compressing: /XXX/XXX/XXX/cypress/videos/new.spec.js.mp4                     (X second)


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  new.spec.js                              XX:XX        1        1        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        1        1        -        -        -  


`

exports['studio-no-source-maps new.spec.js'] = `
import { openStudio, saveStudio, verifyCommandLog, verifyVisit } from '../../../studio/cypress/support'

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
      .type('index.html', { log: false }).then(() => {
        // we have to send a jquery click here since Cypress throws an error
        // as the click triggers a cy.visit() in the runner
        Cypress.$(window.top.document.body).find('.btn-submit').click()
      })

      cy.get('.btn', { log: false }).click({ log: false })

      verifyVisit('index.html')

      verifyCommandLog(2, {
        selector: '.btn',
        name: 'click',
      })

      saveStudio('My New Test')
    })

    /* ==== Test Created with Cypress Studio ==== */
    it('My New Test', function() {
      /* ==== Generated with Cypress Studio ==== */
      cy.visit('index.html');
      cy.get('.btn').click();
      /* ==== End Cypress Studio ==== */
    });
  })
})

`
