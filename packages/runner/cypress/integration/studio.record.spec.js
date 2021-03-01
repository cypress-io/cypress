const helpers = require('../support/helpers')

const { createCypress } = helpers
const { runIsolatedCypress } = createCypress({ config: { experimentalStudio: true } })

const runCypressStudio = (visitUrl = 'http://localhost:3500/fixtures/studio.html') => {
  return runIsolatedCypress('cypress/fixtures/studio/basic_spec.js', {
    config: {
      env: {
        INTERNAL_E2E_TESTS: 1,
      },
    },
    state: {
      studioTestId: 'r3',
    },
    visitUrl,
  })
}

const getFrame = () => {
  return cy.get('.aut-iframe').its('0.contentDocument').its('body').should('not.be.undefined').then(cy.wrap)
}

const getParentCommand = (index) => {
  return cy.get('.reporter').find('.hook-studio').find('.command-number').contains(index).closest('.command')
}

const getChildCommand = (index) => {
  return getParentCommand(index).next('.command')
}

const verifyCommandLog = (index, { selector, name, message }) => {
  getParentCommand(index).find('.command-message').should('have.text', selector)

  getChildCommand(index).find('.command-method').should('have.text', name)

  if (message) {
    getChildCommand(index).find('.command-message').should('have.text', message)
  }
}

describe('studio record', () => {
  context('click', () => {
    it('records click event', () => {
      runCypressStudio()
      .then(() => {
        getFrame().find('.btn').click()

        verifyCommandLog(1, {
          selector: '.btn',
          name: 'click',
        })
      })
    })

    // https://github.com/cypress-io/cypress/issues/14658
    it('uses the selector for an element before it changes from mouse events', () => {
      runCypressStudio()
      .then(() => {
        getFrame().find('.interactive').eq(0).click().should('have.class', 'mouseover')
        getFrame().find('.interactive').eq(1).click().should('have.class', 'mouseenter')
        getFrame().find('.interactive').eq(2).click().should('have.class', 'mousedown')

        verifyCommandLog(1, {
          selector: ':nth-child(7)',
          name: 'click',
        })

        verifyCommandLog(2, {
          selector: ':nth-child(8)',
          name: 'click',
        })

        verifyCommandLog(3, {
          selector: ':nth-child(9)',
          name: 'click',
        })
      })
    })

    // https://github.com/cypress-io/cypress/issues/14658
    it('uses the original selector for an element with both mouseover and mousedown handlers', () => {
      runCypressStudio()
      .then(() => {
        getFrame().find('.both').first().click().should('have.class', 'mouseover').should('have.class', 'mousedown')

        verifyCommandLog(1, {
          selector: ':nth-child(10)',
          name: 'click',
        })
      })
    })

    // https://github.com/cypress-io/cypress/issues/14658
    it('uses the selector for an element before it changes from mousedown', () => {
      // this is a very unique example to illustrate why we must
      // track mousedown and not only mouseover
      runCypressStudio()
      .then(() => {
        getFrame().find('.mdown').first().click().should('have.class', 'clicked')
        getFrame().find('.mdown').first().click()

        verifyCommandLog(1, {
          selector: ':nth-child(12)',
          name: 'click',
        })

        verifyCommandLog(2, {
          selector: '.clicked',
          name: 'click',
        })
      })
    })
  })

  context('type', () => {
    it('records type event and inserts a clear command', () => {
      runCypressStudio()
      .then(() => {
        getFrame().find('#input-text').type('this was typed')

        verifyCommandLog(1, {
          selector: '#input-text',
          name: 'clear',
        })

        verifyCommandLog(2, {
          selector: '#input-text',
          name: 'type',
          message: 'this was typed',
        })
      })
    })

    it('records when the user presses enter', () => {
      runCypressStudio()
      .then(() => {
        getFrame().find('#input-text').type('this was typed{enter}')

        verifyCommandLog(2, {
          selector: '#input-text',
          name: 'type',
          message: 'this was typed{enter}',
        })
      })
    })

    it('always records enter at the end of input regardless of cursor location', () => {
      runCypressStudio()
      .then(() => {
        getFrame().find('#input-text').type('this was typed{movetostart}{enter}')

        verifyCommandLog(2, {
          selector: '#input-text',
          name: 'type',
          message: 'this was typed{enter}',
        })
      })
    })

    it('records input value and excludes special keys that were typed', () => {
      runCypressStudio()
      .then(() => {
        getFrame().find('#input-text').type('this was tyed{leftarrow}{leftarrow}p')

        verifyCommandLog(2, {
          selector: '#input-text',
          name: 'type',
          message: 'this was typed',
        })
      })
    })

    it('records input value and clears when same input is typed into multiple times', () => {
      runCypressStudio()
      .then(() => {
        getFrame().find('#input-text').type('first typing')
        getFrame().find('.btn').click()
        getFrame().find('#input-text').type('{backspace}{backspace}{backspace}{backspace}{backspace}{backspace}second')
        getFrame().find('.btn').click()
        getFrame().find('#input-text').type('{movetostart}start ')
        getFrame().find('.btn').click()
        getFrame().find('#input-text').type('{selectall}{backspace}my input')

        verifyCommandLog(1, {
          selector: '#input-text',
          name: 'clear',
        })

        verifyCommandLog(2, {
          selector: '#input-text',
          name: 'type',
          message: 'first typing',
        })

        verifyCommandLog(4, {
          selector: '#input-text',
          name: 'clear',
        })

        verifyCommandLog(5, {
          selector: '#input-text',
          name: 'type',
          message: 'first second',
        })

        verifyCommandLog(7, {
          selector: '#input-text',
          name: 'clear',
        })

        verifyCommandLog(8, {
          selector: '#input-text',
          name: 'type',
          message: 'start first second',
        })

        verifyCommandLog(10, {
          selector: '#input-text',
          name: 'clear',
        })

        verifyCommandLog(11, {
          selector: '#input-text',
          name: 'type',
          message: 'my input',
        })
      })
    })

    it('records input value when typing over placeholder', () => {
      runCypressStudio()
      .then(() => {
        getFrame().find('#input-placeholder').type('{backspace}{backspace}{leftarrow}{leftarrow}{leftarrow}{leftarrow}ment ')

        verifyCommandLog(1, {
          selector: '#input-placeholder',
          name: 'clear',
        })

        verifyCommandLog(2, {
          selector: '#input-placeholder',
          name: 'type',
          message: 'placement hold',
        })
      })
    })
  })

  context('check and uncheck', () => {
    it('records checks for radio buttons', () => {
      runCypressStudio()
      .then(() => {
        getFrame().find('#input-radio').click()

        verifyCommandLog(1, {
          selector: '#input-radio',
          name: 'check',
        })
      })
    })

    it('records checks and unchecks for checkboxes', () => {
      runCypressStudio()
      .then(() => {
        getFrame().find('#input-checkbox').click()

        verifyCommandLog(1, {
          selector: '#input-checkbox',
          name: 'check',
        })

        getFrame().find('#input-checkbox').click()

        verifyCommandLog(2, {
          selector: '#input-checkbox',
          name: 'uncheck',
        })
      })
    })
  })

  context('select', () => {
    it('records select events', () => {
      runCypressStudio()
      .then(() => {
        getFrame().find('#select').select('1')

        verifyCommandLog(1, {
          selector: '#select',
          name: 'select',
          message: '1',
        })
      })
    })

    it('records multi select events', () => {
      runCypressStudio()
      .then(() => {
        getFrame().find('#multiple').select(['0', '2'])

        verifyCommandLog(1, {
          selector: '#multiple',
          name: 'select',
          message: '[0, 2]',
        })
      })
    })
  })

  context('selectors', () => {
    it('generates unique selectors for each element with priority', () => {
      runCypressStudio('http://localhost:3500/fixtures/studio-selectors.html')
      .then(() => {
        getFrame().find('button').click({ multiple: true })
        getFrame().find('p').click()

        verifyCommandLog(1, {
          selector: '[data-cy=btn1]',
          name: 'click',
        })

        verifyCommandLog(2, {
          selector: '[data-test=btn2]',
          name: 'click',
        })

        verifyCommandLog(3, {
          selector: '[data-testid=btn3]',
          name: 'click',
        })

        verifyCommandLog(4, {
          selector: '#btn4',
          name: 'click',
        })

        verifyCommandLog(5, {
          selector: '.btn5',
          name: 'click',
        })

        verifyCommandLog(6, {
          selector: '[type="submit"]',
          name: 'click',
        })

        verifyCommandLog(7, {
          selector: ':nth-child(7)',
          name: 'click',
        })

        verifyCommandLog(8, {
          selector: 'p',
          name: 'click',
        })
      })
    })
  })

  context('command log', () => {
    it('will remove command on button click', () => {
      runCypressStudio()
      .then(() => {
        getFrame().find('.btn').click().click()

        verifyCommandLog(1, {
          selector: '.btn',
          name: 'click',
        })

        verifyCommandLog(2, {
          selector: '.btn',
          name: 'click',
        })

        getParentCommand(2).find('.studio-command-remove').click()

        verifyCommandLog(1, {
          selector: '.btn',
          name: 'click',
        })

        cy.get('.reporter').find('.hook-studio').find('.command-number').contains('2').should('not.exist')
      })
    })
  })
})
