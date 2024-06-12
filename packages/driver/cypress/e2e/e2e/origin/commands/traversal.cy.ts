import { findCrossOriginLogs } from '../../../../support/utils'

context('cy.origin traversal', { browser: '!webkit' }, () => {
  beforeEach(() => {
    cy.visit('/fixtures/primary-origin.html')
    cy.get('a[data-cy="dom-link"]').click()
  })

  it('.children()', () => {
    cy.origin('http://www.foobar.com:3500', () => {
      cy.get('#by-id').children().should('have.length', 3)
    })
  })

  it('.closest()', () => {
    cy.origin('http://www.foobar.com:3500', () => {
      cy.get('#by-id').closest('form')
    })
  })

  it('.eq()', () => {
    cy.origin('http://www.foobar.com:3500', () => {
      cy.get('#by-id>input').eq(1).should('have.id', 'name')
    })
  })

  it('.filter()', () => {
    cy.origin('http://www.foobar.com:3500', () => {
      cy.get('#by-name>input')
      .filter('[name="dogs"]').should('have.length', 4)
    })
  })

  it('.find()', () => {
    cy.origin('http://www.foobar.com:3500', () => {
      cy.get('#by-id').find('input').should('have.length', 3)
    })
  })

  it('.first()', () => {
    cy.origin('http://www.foobar.com:3500', () => {
      cy.get('#by-id>input').first().should('have.id', 'input')
    })
  })

  it('.last()', () => {
    cy.origin('http://www.foobar.com:3500', () => {
      cy.get('#by-id>input').last().should('have.id', 'age')
    })
  })

  it('.next()', () => {
    cy.origin('http://www.foobar.com:3500', () => {
      cy.get('#input').next().should('have.id', 'name')
    })
  })

  it('.nextAll()', () => {
    cy.origin('http://www.foobar.com:3500', () => {
      cy.get('#input').nextAll().should('have.length', 2)
    })
  })

  it('.nextUntil()', () => {
    cy.origin('http://www.foobar.com:3500', () => {
      cy.get('#input').nextUntil('#age').should('have.length', 1)
    })
  })

  it('.not()', () => {
    cy.origin('http://www.foobar.com:3500', () => {
      cy.get('#by-id>input').not('#age').should('have.length', 2)
    })
  })

  it('.parent()', () => {
    cy.origin('http://www.foobar.com:3500', () => {
      cy.get('#by-id').parent().should('have.id', 'dom')
    })
  })

  it('.parents()', () => {
    cy.origin('http://www.foobar.com:3500', () => {
      cy.get('#by-id').parents().should('have.length', 3)
    })
  })

  it('.parentsUntil()', () => {
    cy.origin('http://www.foobar.com:3500', () => {
      cy.get('#by-id').parentsUntil('body').should('have.length', 1)
    })
  })

  it('.prev()', () => {
    cy.origin('http://www.foobar.com:3500', () => {
      cy.get('#age').prev().should('have.id', 'name')
    })
  })

  it('.prevAll()', () => {
    cy.origin('http://www.foobar.com:3500', () => {
      cy.get('#age').prevAll().should('have.length', 2)
    })
  })

  it('.prevUntil()', () => {
    cy.origin('http://www.foobar.com:3500', () => {
      cy.get('#age').prevUntil('#input').should('have.length', 1)
    })
  })

  it('.siblings()', () => {
    cy.origin('http://www.foobar.com:3500', () => {
      cy.get('#input').siblings().should('have.length', 2)
    })
  })

  context('#consoleProps', () => {
    const { _ } = Cypress
    let logs: Map<string, any>

    beforeEach(() => {
      logs = new Map()

      cy.on('log:changed', (attrs, log) => {
        logs.set(attrs.id, log)
      })
    })

    it('.children()', () => {
      cy.origin('http://www.foobar.com:3500', () => {
        cy.get('#by-id').children()
      })

      cy.shouldWithTimeout(() => {
        // in the case of some firefox browsers, the document state is left in a cross origin context when running these assertions
        // set to  context to undefined to run the assertions
        if (Cypress.isBrowser('firefox')) {
          cy.state('document', undefined)
        }

        const { consoleProps } = findCrossOriginLogs('children', logs, 'foobar.com')

        expect(consoleProps.name).to.equal('children')
        expect(consoleProps.type).to.equal('command')
        expect(consoleProps.props['Applied To']).to.have.property('tagName').that.equals('FORM')
        expect(consoleProps.props['Applied To']).to.have.property('id').that.equals('by-id')
        expect(consoleProps.props.Elements).to.equal(3)
        expect(consoleProps.props.Selector).to.equal('')
        expect(consoleProps.props.Yielded.length).to.equal(3)
        expect(consoleProps.props.Yielded[0]).to.have.property('tagName').that.equals('INPUT')
        expect(consoleProps.props.Yielded[0]).to.have.property('id').that.equals('input')
        expect(consoleProps.props.Yielded[1]).to.have.property('tagName').that.equals('INPUT')
        expect(consoleProps.props.Yielded[1]).to.have.property('id').that.equals('name')
        expect(consoleProps.props.Yielded[2]).to.have.property('tagName').that.equals('INPUT')
        expect(consoleProps.props.Yielded[2]).to.have.property('id').that.equals('age')
      })
    })

    it('.closest()', () => {
      cy.origin('http://www.foobar.com:3500', () => {
        cy.get('#by-id').closest('form')
      })

      cy.shouldWithTimeout(() => {
        // in the case of some firefox browsers, the document state is left in a cross origin context when running these assertions
        // set to  context to undefined to run the assertions
        if (Cypress.isBrowser('firefox')) {
          cy.state('document', undefined)
        }

        const { consoleProps } = findCrossOriginLogs('closest', logs, 'foobar.com')

        expect(consoleProps.name).to.equal('closest')
        expect(consoleProps.type).to.equal('command')
        expect(consoleProps.props['Applied To']).to.have.property('tagName').that.equals('FORM')
        expect(consoleProps.props['Applied To']).to.have.property('id').that.equals('by-id')
        expect(consoleProps.props.Elements).to.equal(1)
        expect(consoleProps.props.Selector).to.equal('form')
        expect(consoleProps.props.Yielded).to.have.property('tagName').that.equals('FORM')
        expect(consoleProps.props.Yielded).to.have.property('id').that.equals('by-id')
        expect(consoleProps.props.Yielded.querySelector('input#input')).to.be.ok
        expect(consoleProps.props.Yielded.querySelector('input#name')).to.be.ok
        expect(consoleProps.props.Yielded.querySelector('input#age')).to.be.ok
      })
    })

    it('.eq()', () => {
      cy.origin('http://www.foobar.com:3500', () => {
        cy.get('#by-id>input').eq(1)
      })

      cy.shouldWithTimeout(() => {
        // in the case of some firefox browsers, the document state is left in a cross origin context when running these assertions
        // set to  context to undefined to run the assertions
        if (Cypress.isBrowser('firefox')) {
          cy.state('document', undefined)
        }

        const { consoleProps } = findCrossOriginLogs('eq', logs, 'foobar.com')

        expect(consoleProps.props['Applied To'].length).to.equal(3)
        expect(consoleProps.props['Applied To'][0]).to.have.property('tagName').that.equals('INPUT')
        expect(consoleProps.props['Applied To'][0]).to.have.property('id').that.equals('input')
        expect(consoleProps.props['Applied To'][1]).to.have.property('tagName').that.equals('INPUT')
        expect(consoleProps.props['Applied To'][1]).to.have.property('id').that.equals('name')
        expect(consoleProps.props['Applied To'][2]).to.have.property('tagName').that.equals('INPUT')
        expect(consoleProps.props['Applied To'][2]).to.have.property('id').that.equals('age')

        expect(consoleProps.name).to.equal('eq')
        expect(consoleProps.type).to.equal('command')
        expect(consoleProps.props.Elements).to.equal(1)
        expect(consoleProps.props.Selector).to.equal('1')
        expect(consoleProps.props.Yielded).to.have.property('tagName').that.equals('INPUT')
        expect(consoleProps.props.Yielded).to.have.property('id').that.equals('name')
      })
    })

    it('.filter()', () => {
      cy.origin('http://www.foobar.com:3500', () => {
        cy.get('#by-name>input')
        .filter('[name="dogs"]')
      })

      cy.shouldWithTimeout(() => {
        // in the case of some firefox browsers, the document state is left in a cross origin context when running these assertions
        // set to  context to undefined to run the assertions
        if (Cypress.isBrowser('firefox')) {
          cy.state('document', undefined)
        }

        const { consoleProps } = findCrossOriginLogs('filter', logs, 'foobar.com')

        expect(consoleProps.name).to.equal('filter')
        expect(consoleProps.type).to.equal('command')
        expect(consoleProps.props['Applied To'].length).to.equal(12)
        expect(consoleProps.props.Elements).to.equal(4)
        expect(consoleProps.props.Selector).to.equal('[name="dogs"]')

        expect(consoleProps.props.Yielded.length).to.equal(4)

        _.forEach(consoleProps.props.Yielded, (yielded) => {
          expect(yielded).to.have.property('tagName').that.equals('INPUT')
          expect(yielded).to.have.property('name').that.equals('dogs')
        })
      })
    })

    it('.find()', () => {
      cy.origin('http://www.foobar.com:3500', () => {
        cy.get('#by-id').find('input')
      })

      cy.shouldWithTimeout(() => {
        // in the case of some firefox browsers, the document state is left in a cross origin context when running these assertions
        // set to  context to undefined to run the assertions
        if (Cypress.isBrowser('firefox')) {
          cy.state('document', undefined)
        }

        const { consoleProps } = findCrossOriginLogs('find', logs, 'foobar.com')

        expect(consoleProps.props['Applied To']).to.have.property('tagName').that.equals('FORM')
        expect(consoleProps.props['Applied To']).to.have.property('id').that.equals('by-id')

        expect(consoleProps.name).to.equal('find')
        expect(consoleProps.type).to.equal('command')
        expect(consoleProps.props.Elements).to.equal(3)
        expect(consoleProps.props.Selector).to.equal('input')

        expect(consoleProps.props.Yielded.length).to.equal(3)
        expect(consoleProps.props.Yielded[0]).to.have.property('tagName').that.equals('INPUT')
        expect(consoleProps.props.Yielded[0]).to.have.property('id').that.equals('input')
        expect(consoleProps.props.Yielded[1]).to.have.property('tagName').that.equals('INPUT')
        expect(consoleProps.props.Yielded[1]).to.have.property('id').that.equals('name')
        expect(consoleProps.props.Yielded[2]).to.have.property('tagName').that.equals('INPUT')
        expect(consoleProps.props.Yielded[2]).to.have.property('id').that.equals('age')
      })
    })

    it('.first()', () => {
      cy.origin('http://www.foobar.com:3500', () => {
        cy.get('#by-id>input').first()
      })

      cy.shouldWithTimeout(() => {
        // in the case of some firefox browsers, the document state is left in a cross origin context when running these assertions
        // set to  context to undefined to run the assertions
        if (Cypress.isBrowser('firefox')) {
          cy.state('document', undefined)
        }

        const { consoleProps } = findCrossOriginLogs('first', logs, 'foobar.com')

        expect(consoleProps.props['Applied To'].length).to.equal(3)
        expect(consoleProps.props['Applied To'][0]).to.have.property('tagName').that.equals('INPUT')
        expect(consoleProps.props['Applied To'][0]).to.have.property('id').that.equals('input')
        expect(consoleProps.props['Applied To'][1]).to.have.property('tagName').that.equals('INPUT')
        expect(consoleProps.props['Applied To'][1]).to.have.property('id').that.equals('name')
        expect(consoleProps.props['Applied To'][2]).to.have.property('tagName').that.equals('INPUT')
        expect(consoleProps.props['Applied To'][2]).to.have.property('id').that.equals('age')

        expect(consoleProps.name).to.equal('first')
        expect(consoleProps.type).to.equal('command')
        expect(consoleProps.props.Elements).to.equal(1)
        expect(consoleProps.props.Selector).to.equal('')

        expect(consoleProps.props.Yielded).to.have.property('tagName').that.equals('INPUT')
        expect(consoleProps.props.Yielded).to.have.property('id').that.equals('input')
      })
    })

    it('.last()', () => {
      cy.origin('http://www.foobar.com:3500', () => {
        cy.get('#by-id>input').last()
      })

      cy.shouldWithTimeout(() => {
        // in the case of some firefox browsers, the document state is left in a cross origin context when running these assertions
        // set to  context to undefined to run the assertions
        if (Cypress.isBrowser('firefox')) {
          cy.state('document', undefined)
        }

        const { consoleProps } = findCrossOriginLogs('last', logs, 'foobar.com')

        expect(consoleProps.props['Applied To'].length).to.equal(3)
        expect(consoleProps.props['Applied To'][0]).to.have.property('tagName').that.equals('INPUT')
        expect(consoleProps.props['Applied To'][0]).to.have.property('id').that.equals('input')
        expect(consoleProps.props['Applied To'][1]).to.have.property('tagName').that.equals('INPUT')
        expect(consoleProps.props['Applied To'][1]).to.have.property('id').that.equals('name')
        expect(consoleProps.props['Applied To'][2]).to.have.property('tagName').that.equals('INPUT')
        expect(consoleProps.props['Applied To'][2]).to.have.property('id').that.equals('age')

        expect(consoleProps.name).to.equal('last')
        expect(consoleProps.type).to.equal('command')
        expect(consoleProps.props.Elements).to.equal(1)
        expect(consoleProps.props.Selector).to.equal('')

        expect(consoleProps.props.Yielded).to.have.property('tagName').that.equals('INPUT')
        expect(consoleProps.props.Yielded).to.have.property('id').that.equals('age')
      })
    })

    it('.next()', () => {
      cy.origin('http://www.foobar.com:3500', () => {
        cy.get('#input').next()
      })

      cy.shouldWithTimeout(() => {
        // in the case of some firefox browsers, the document state is left in a cross origin context when running these assertions
        // set to  context to undefined to run the assertions
        if (Cypress.isBrowser('firefox')) {
          cy.state('document', undefined)
        }

        const { consoleProps } = findCrossOriginLogs('next', logs, 'foobar.com')

        expect(consoleProps.props['Applied To']).to.have.property('tagName').that.equals('INPUT')
        expect(consoleProps.props['Applied To']).to.have.property('id').that.equals('input')

        expect(consoleProps.name).to.equal('next')
        expect(consoleProps.type).to.equal('command')
        expect(consoleProps.props.Elements).to.equal(1)
        expect(consoleProps.props.Selector).to.equal('')

        expect(consoleProps.props.Yielded).to.have.property('tagName').that.equals('INPUT')
        expect(consoleProps.props.Yielded).to.have.property('id').that.equals('name')
      })
    })

    it('.nextAll()', () => {
      cy.origin('http://www.foobar.com:3500', () => {
        cy.get('#input').nextAll()
      })

      cy.shouldWithTimeout(() => {
        // in the case of some firefox browsers, the document state is left in a cross origin context when running these assertions
        // set to  context to undefined to run the assertions
        if (Cypress.isBrowser('firefox')) {
          cy.state('document', undefined)
        }

        const { consoleProps } = findCrossOriginLogs('nextAll', logs, 'foobar.com')

        expect(consoleProps.props['Applied To']).to.have.property('tagName').that.equals('INPUT')
        expect(consoleProps.props['Applied To']).to.have.property('id').that.equals('input')

        expect(consoleProps.name).to.equal('nextAll')
        expect(consoleProps.type).to.equal('command')
        expect(consoleProps.props.Elements).to.equal(2)
        expect(consoleProps.props.Selector).to.equal('')

        expect(consoleProps.props.Yielded.length).to.equal(2)
        expect(consoleProps.props.Yielded[0]).to.have.property('tagName').that.equals('INPUT')
        expect(consoleProps.props.Yielded[0]).to.have.property('id').that.equals('name')
        expect(consoleProps.props.Yielded[1]).to.have.property('tagName').that.equals('INPUT')
        expect(consoleProps.props.Yielded[1]).to.have.property('id').that.equals('age')
      })
    })

    it('.nextUntil()', () => {
      cy.origin('http://www.foobar.com:3500', () => {
        cy.get('#input').nextUntil('#age')
      })

      cy.shouldWithTimeout(() => {
        // in the case of some firefox browsers, the document state is left in a cross origin context when running these assertions
        // set to  context to undefined to run the assertions
        if (Cypress.isBrowser('firefox')) {
          cy.state('document', undefined)
        }

        const { consoleProps } = findCrossOriginLogs('nextUntil', logs, 'foobar.com')

        expect(consoleProps.props['Applied To']).to.have.property('tagName').that.equals('INPUT')
        expect(consoleProps.props['Applied To']).to.have.property('id').that.equals('input')

        expect(consoleProps.name).to.equal('nextUntil')
        expect(consoleProps.type).to.equal('command')
        expect(consoleProps.props.Elements).to.equal(1)
        expect(consoleProps.props.Selector).to.equal('#age')

        expect(consoleProps.props.Yielded).to.have.property('tagName').that.equals('INPUT')
        expect(consoleProps.props.Yielded).to.have.property('id').that.equals('name')
      })
    })

    it('.not()', () => {
      cy.origin('http://www.foobar.com:3500', () => {
        cy.get('#by-id>input').not('#age')
      })

      cy.shouldWithTimeout(() => {
        // in the case of some firefox browsers, the document state is left in a cross origin context when running these assertions
        // set to  context to undefined to run the assertions
        if (Cypress.isBrowser('firefox')) {
          cy.state('document', undefined)
        }

        const { consoleProps } = findCrossOriginLogs('not', logs, 'foobar.com')

        expect(consoleProps.props['Applied To'].length).to.equal(3)
        expect(consoleProps.props['Applied To'][0]).to.have.property('tagName').that.equals('INPUT')
        expect(consoleProps.props['Applied To'][0]).to.have.property('id').that.equals('input')
        expect(consoleProps.props['Applied To'][1]).to.have.property('tagName').that.equals('INPUT')
        expect(consoleProps.props['Applied To'][1]).to.have.property('id').that.equals('name')
        expect(consoleProps.props['Applied To'][2]).to.have.property('tagName').that.equals('INPUT')
        expect(consoleProps.props['Applied To'][2]).to.have.property('id').that.equals('age')

        expect(consoleProps.name).to.equal('not')
        expect(consoleProps.type).to.equal('command')
        expect(consoleProps.props.Elements).to.equal(2)
        expect(consoleProps.props.Selector).to.equal('#age')

        expect(consoleProps.props.Yielded.length).to.equal(2)
        expect(consoleProps.props.Yielded[0]).to.have.property('tagName').that.equals('INPUT')
        expect(consoleProps.props.Yielded[0]).to.have.property('id').that.equals('input')
        expect(consoleProps.props.Yielded[1]).to.have.property('tagName').that.equals('INPUT')
        expect(consoleProps.props.Yielded[1]).to.have.property('id').that.equals('name')
      })
    })

    it('.parent()', () => {
      cy.origin('http://www.foobar.com:3500', () => {
        cy.get('#by-id').parent()
      })

      cy.shouldWithTimeout(() => {
        // in the case of some firefox browsers, the document state is left in a cross origin context when running these assertions
        // set to  context to undefined to run the assertions
        if (Cypress.isBrowser('firefox')) {
          cy.state('document', undefined)
        }

        const { consoleProps } = findCrossOriginLogs('parent', logs, 'foobar.com')

        expect(consoleProps.props['Applied To']).to.have.property('tagName').that.equals('FORM')
        expect(consoleProps.props['Applied To']).to.have.property('id').that.equals('by-id')

        expect(consoleProps.name).to.equal('parent')
        expect(consoleProps.type).to.equal('command')
        expect(consoleProps.props.Elements).to.equal(1)
        expect(consoleProps.props.Selector).to.equal('')

        expect(consoleProps.props.Yielded).to.have.property('tagName').that.equals('DIV')
        expect(consoleProps.props.Yielded).to.have.property('id').that.equals('dom')
      })
    })

    it('.parents()', () => {
      cy.origin('http://www.foobar.com:3500', () => {
        cy.get('#by-id').parents()
      })

      cy.shouldWithTimeout(() => {
        // in the case of some firefox browsers, the document state is left in a cross origin context when running these assertions
        // set to  context to undefined to run the assertions
        if (Cypress.isBrowser('firefox')) {
          cy.state('document', undefined)
        }

        const { consoleProps } = findCrossOriginLogs('parents', logs, 'foobar.com')

        expect(consoleProps.props['Applied To']).to.have.property('tagName').that.equals('FORM')
        expect(consoleProps.props['Applied To']).to.have.property('id').that.equals('by-id')

        expect(consoleProps.name).to.equal('parents')
        expect(consoleProps.type).to.equal('command')
        expect(consoleProps.props.Elements).to.equal(3)
        expect(consoleProps.props.Selector).to.equal('')

        expect(consoleProps.props.Yielded.length).to.equal(3)
        expect(consoleProps.props.Yielded[0]).to.have.property('tagName').that.equals('DIV')
        expect(consoleProps.props.Yielded[0]).to.have.property('id').that.equals('dom')
        expect(consoleProps.props.Yielded[1]).to.have.property('tagName').that.equals('BODY')
        expect(consoleProps.props.Yielded[2]).to.have.property('tagName').that.equals('HTML')
      })
    })

    it('.parentsUntil()', () => {
      cy.origin('http://www.foobar.com:3500', () => {
        cy.get('#by-id').parentsUntil('body')
      })

      cy.shouldWithTimeout(() => {
        // in the case of some firefox browsers, the document state is left in a cross origin context when running these assertions
        // set to  context to undefined to run the assertions
        if (Cypress.isBrowser('firefox')) {
          cy.state('document', undefined)
        }

        const { consoleProps } = findCrossOriginLogs('parentsUntil', logs, 'foobar.com')

        expect(consoleProps.props['Applied To']).to.have.property('tagName').that.equals('FORM')
        expect(consoleProps.props['Applied To']).to.have.property('id').that.equals('by-id')

        expect(consoleProps.name).to.equal('parentsUntil')
        expect(consoleProps.type).to.equal('command')
        expect(consoleProps.props.Elements).to.equal(1)
        expect(consoleProps.props.Selector).to.equal('body')

        expect(consoleProps.props.Yielded).to.have.property('tagName').that.equals('DIV')
        expect(consoleProps.props.Yielded).to.have.property('id').that.equals('dom')
      })
    })

    it('.prev()', () => {
      cy.origin('http://www.foobar.com:3500', () => {
        cy.get('#age').prev()
      })

      cy.shouldWithTimeout(() => {
        // in the case of some firefox browsers, the document state is left in a cross origin context when running these assertions
        // set to  context to undefined to run the assertions
        if (Cypress.isBrowser('firefox')) {
          cy.state('document', undefined)
        }

        const { consoleProps } = findCrossOriginLogs('prev', logs, 'foobar.com')

        expect(consoleProps.props['Applied To']).to.have.property('tagName').that.equals('INPUT')
        expect(consoleProps.props['Applied To']).to.have.property('id').that.equals('age')

        expect(consoleProps.name).to.equal('prev')
        expect(consoleProps.type).to.equal('command')
        expect(consoleProps.props.Elements).to.equal(1)
        expect(consoleProps.props.Selector).to.equal('')

        expect(consoleProps.props.Yielded).to.have.property('tagName').that.equals('INPUT')
        expect(consoleProps.props.Yielded).to.have.property('id').that.equals('name')
      })
    })

    it('.prevAll()', () => {
      cy.origin('http://www.foobar.com:3500', () => {
        cy.get('#age').prevAll()
      })

      cy.shouldWithTimeout(() => {
        // in the case of some firefox browsers, the document state is left in a cross origin context when running these assertions
        // set to  context to undefined to run the assertions
        if (Cypress.isBrowser('firefox')) {
          cy.state('document', undefined)
        }

        const { consoleProps } = findCrossOriginLogs('prevAll', logs, 'foobar.com')

        expect(consoleProps.props['Applied To']).to.have.property('tagName').that.equals('INPUT')
        expect(consoleProps.props['Applied To']).to.have.property('id').that.equals('age')

        expect(consoleProps.name).to.equal('prevAll')
        expect(consoleProps.type).to.equal('command')
        expect(consoleProps.props.Elements).to.equal(2)
        expect(consoleProps.props.Selector).to.equal('')

        expect(consoleProps.props.Yielded.length).to.equal(2)
        expect(consoleProps.props.Yielded[0]).to.have.property('tagName').that.equals('INPUT')
        expect(consoleProps.props.Yielded[0]).to.have.property('id').that.equals('name')
        expect(consoleProps.props.Yielded[1]).to.have.property('tagName').that.equals('INPUT')
        expect(consoleProps.props.Yielded[1]).to.have.property('id').that.equals('input')
      })
    })

    it('.prevUntil()', () => {
      cy.origin('http://www.foobar.com:3500', () => {
        cy.get('#age').prevUntil('#input')
      })

      cy.shouldWithTimeout(() => {
        // in the case of some firefox browsers, the document state is left in a cross origin context when running these assertions
        // set to  context to undefined to run the assertions
        if (Cypress.isBrowser('firefox')) {
          cy.state('document', undefined)
        }

        const { consoleProps } = findCrossOriginLogs('prevUntil', logs, 'foobar.com')

        expect(consoleProps.props['Applied To']).to.have.property('tagName').that.equals('INPUT')
        expect(consoleProps.props['Applied To']).to.have.property('id').that.equals('age')

        expect(consoleProps.name).to.equal('prevUntil')
        expect(consoleProps.type).to.equal('command')
        expect(consoleProps.props.Elements).to.equal(1)
        expect(consoleProps.props.Selector).to.equal('#input')

        expect(consoleProps.props.Yielded).to.have.property('tagName').that.equals('INPUT')
        expect(consoleProps.props.Yielded).to.have.property('id').that.equals('name')
      })
    })

    it('.siblings()', () => {
      cy.origin('http://www.foobar.com:3500', () => {
        cy.get('#input').siblings()
      })

      cy.shouldWithTimeout(() => {
        // in the case of some firefox browsers, the document state is left in a cross origin context when running these assertions
        // set to  context to undefined to run the assertions
        if (Cypress.isBrowser('firefox')) {
          cy.state('document', undefined)
        }

        const { consoleProps } = findCrossOriginLogs('siblings', logs, 'foobar.com')

        expect(consoleProps.props['Applied To']).to.have.property('tagName').that.equals('INPUT')
        expect(consoleProps.props['Applied To']).to.have.property('id').that.equals('input')

        expect(consoleProps.name).to.equal('siblings')
        expect(consoleProps.type).to.equal('command')
        expect(consoleProps.props.Elements).to.equal(2)
        expect(consoleProps.props.Selector).to.equal('')

        expect(consoleProps.props.Yielded.length).to.equal(2)
        expect(consoleProps.props.Yielded[0]).to.have.property('tagName').that.equals('INPUT')
        expect(consoleProps.props.Yielded[0]).to.have.property('id').that.equals('name')
        expect(consoleProps.props.Yielded[1]).to.have.property('tagName').that.equals('INPUT')
        expect(consoleProps.props.Yielded[1]).to.have.property('id').that.equals('age')
      })
    })
  })
})
