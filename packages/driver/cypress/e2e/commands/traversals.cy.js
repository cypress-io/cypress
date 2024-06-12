const { assertLogLength } = require('../../support/utils')
const { _, $, dom } = Cypress

describe('src/cy/commands/traversals', () => {
  beforeEach(() => {
    cy.visit('/fixtures/dom.html')
  })

  const fns = [
    { find: '*' },
    { filter: ':first' },
    { filter: (i) => i === 0 },
    { not: 'div' },
    { not: (i, e) => e.tagName === 'div' },
    { eq: 0 },
    { closest: 'body' },
    'children', 'first', 'last', 'next', 'nextAll', 'nextUntil', 'parent', 'parents', 'parentsUntil', 'prev', 'prevAll', 'prevUntil', 'siblings',
  ]

  _.each(fns, (fn) => {
    // normalize string vs object
    let arg
    let name

    if (_.isObject(fn)) {
      name = _.keys(fn)[0]
      arg = fn[name]
    } else {
      name = fn
    }

    context(`#${name}`, () => {
      it('proxies through to jquery and returns new subject', () => {
        const el = cy.$$('#list')[name](arg)

        cy.get('#list')[name](arg).then(($el) => {
          expect($el).to.match(el)
        })
      })

      describe('errors', {
        defaultCommandTimeout: 100,
      }, () => {
        it('throws when options.length isnt a number', (done) => {
          cy.on('fail', (err) => {
            expect(err.message).to.include('You must provide a valid number to a `length` assertion. You passed: `asdf`')

            done()
          })

          cy.get('#list')[name](arg).should('have.length', 'asdf')
        })

        it('throws on too many elements after timing out waiting for length', (done) => {
          const el = cy.$$('#list')[name](arg)

          dom.stringify(cy.$$('#list'), 'short')

          cy.on('fail', (err) => {
            expect(err.message).to.include(`Too many elements found. Found '${el.length}', expected '${el.length - 1}'.`)

            done()
          })

          cy.get('#list')[name](arg).should('have.length', el.length - 1)
        })

        it('throws on too few elements after timing out waiting for length', (done) => {
          const el = cy.$$('#list')[name](arg)

          dom.stringify(cy.$$('#list'), 'short')

          cy.on('fail', (err) => {
            expect(err.message).to.include(`Not enough elements found. Found '${el.length}', expected '${el.length + 1}'.`)

            done()
          })

          cy.get('#list')[name](arg).should('have.length', el.length + 1)
        })

        it('without a dom element', (done) => {
          cy.on('fail', () => {
            done()
          })

          cy.noop({})[name](arg)
        })

        it('throws when subject is not in the document', (done) => {
          cy.on('command:end', () => {
            cy.$$('#list').remove()
          })

          cy.on('fail', (err) => {
            expect(err.message).to.include(`\`cy.${name}()\` failed because it requires a DOM element`)

            done()
          })

          cy.get('#list')[name](arg)
        })

        it('returns no elements', (done) => {
          const errIncludes = (el, node) => {
            node = dom.stringify(cy.$$(node), 'short')

            cy.on('fail', (err) => {
              expect(err.message).to.include(`Expected to find element: \`${el}\`, but never found it. Queried from:`)

              done()
            })
          }

          switch (name) {
            case 'not':
              errIncludes(':checkbox', ':checkbox')

              cy.get(':checkbox').not(':checkbox')

              break

            // these cannot error
            case 'first':
            case 'last':
            case 'parentsUntil':
              done()
              break

            default:
              errIncludes('.no-class-like-this-exists', 'div:first')

              cy.get('div:first')[name]('.no-class-like-this-exists')

              break
          }
        })
      })

      describe('.log', () => {
        beforeEach(function () {
          cy.on('log:added', (attrs, log) => {
            this.lastLog = log
          })
        })

        it('logs immediately before resolving', (done) => {
          cy.on('log:added', (attrs, log) => {
            if (log.get('name') === name) {
              expect(log.pick('state')).to.deep.eq({
                state: 'pending',
              })

              done()
            }
          })

          cy.get('#list')[name](arg)
        })

        it('snapshots after finding element', () => {
          cy.get('#list')[name](arg).then(function () {
            const { lastLog } = this

            expect(lastLog.get('snapshots').length).to.eq(1)
            expect(lastLog.get('snapshots')[0]).to.be.an('object')
          })
        })

        it('has the $el', () => {
          cy.get('#list')[name](arg).then(function ($el) {
            const { lastLog } = this

            expect(lastLog.get('$el').get(0)).to.eq($el.get(0))
          })
        })

        it('has a custom message', () => {
          cy.get('#list')[name](arg).then(function () {
            let message

            if (_.isUndefined(arg) || _.isFunction(arg)) {
              message = ''
            } else {
              message = arg.toString()
            }

            const { lastLog } = this

            expect(lastLog.get('message')).to.eq(message)
          })
        })

        it('#consoleProps', () => {
          cy.get('#list')[name](arg).then(function ($el) {
            const yielded = Cypress.dom.getElements($el)

            expect(this.lastLog.invoke('consoleProps')).to.deep.eq({
              name,
              type: 'command',
              props: {
                Selector: _.isFunction(arg) ? '' : [].concat(arg).join(', '),
                'Applied To': cy.$$('#list')[0],
                Yielded: yielded,
                Elements: $el.length,
              },
            })
          })
        })

        it('can turn off logging when protocol is disabled', { protocolEnabled: false }, function () {
          cy.on('_log:added', (attrs, log) => {
            this.hiddenLog = log
          })

          cy.get('#list')[name](arg, { log: false }).then(function () {
            const { lastLog, hiddenLog } = this

            expect(lastLog.get('name')).to.eq('get')
            expect(hiddenLog).to.be.undefined
          })
        })

        it('can send hidden log when protocol is enabled', { protocolEnabled: true }, function () {
          cy.on('_log:added', (attrs, log) => {
            this.hiddenLog = log
          })

          cy.get('#list')[name](arg, { log: false }).then(function () {
            const { lastLog, hiddenLog } = this

            expect(lastLog.get('name')).to.eq('get')
            expect(hiddenLog.get('name'), 'log name').to.eq(name)
            expect(hiddenLog.get('hidden'), 'log hidden').to.be.true
            expect(hiddenLog.get('snapshots').length, 'log snapshot length').to.eq(1)
          })
        })
      })
    })
  })

  it('eventually resolves', () => {
    cy.on('command:retry', _.after(2, () => {
      cy.$$('button:first').text('foo').addClass('bar')
    }))

    cy.root().find('button:first').should('have.text', 'foo').and('have.class', 'bar')
  })

  it('retries until it finds', () => {
    const li = cy.$$('#list li:last')
    const span = $('<span>foo</span>')

    const retry = _.after(3, () => {
      li.append(span)
    })

    cy.on('command:retry', retry)

    cy.get('#list li:last').find('span').then(($span) => {
      expect($span.get(0)).to.eq(span.get(0))
    })
  })

  it('retries until length equals n', () => {
    let buttons = cy.$$('button')

    const length = buttons.length - 2

    cy.on('command:retry', _.after(2, () => {
      buttons.last().remove()
      buttons = cy.$$('button')
    }))

    // should resolving after removing 2 buttons
    cy.root().find('button').should('have.length', length).then(($buttons) => {
      expect($buttons.length).to.eq(length)
    })
  })

  it('should(\'not.exist\')', () => {
    cy.on('command:retry', _.after(3, () => {
      cy.$$('#nested-div').find('span').remove()
    }))

    cy.get('#nested-div').find('span').should('not.exist')
  })

  it('should(\'exist\')', () => {
    cy.on('command:retry', _.after(3, () => {
      cy.$$('#nested-div').append($('<strong />'))
    }))

    cy.get('#nested-div').find('strong')
  })

  // https://github.com/cypress-io/cypress/issues/38
  it('works with checkboxes', () => {
    cy.on('command:retry', _.after(2, () => {
      const c = cy.$$('[name=colors]').slice(0, 2)

      c.prop('checked', true)
    }))

    cy.get('#by-name').find(':checked').should('have.length', 2)
  })

  it('does not log using first w/options', () => {
    const logs = []

    cy.on('log:added', (attrs, log) => {
      if (attrs.name !== 'assert') {
        logs.push(log)
      }
    })

    cy.get('button').first({ log: false }).then(($button) => {
      expect($button.length).to.eq(1)
      expect(logs.length).to.eq(1)
    })
  })

  describe('errors', {
    defaultCommandTimeout: 100,
  }, () => {
    beforeEach(function () {
      this.logs = []

      cy.on('log:added', (attrs, log) => {
        this.logs.push(log)
      })

      return null
    })

    it('errors after timing out not finding element', (done) => {
      cy.on('fail', (err) => {
        expect(err.message).to.include('Expected to find element: `span`, but never found it. Queried from:')

        done()
      })

      cy.get('#list li:last').find('span')
    })

    it('throws once when incorrect sizzle selector', function (done) {
      cy.on('fail', (err) => {
        assertLogLength(this.logs, 2)

        done()
      })

      cy.get('div:first').find('.spinner\'')
    })

    it('logs out $el when existing $el is found even on failure', function (done) {
      const button = cy.$$('#button').hide()

      cy.on('fail', (err) => {
        assertLogLength(this.logs, 3)

        const getLog = this.logs[0]
        const findLog = this.logs[1]
        const assertionLog = this.logs[2]

        expect(err.message).to.contain('This element `<button#button>` is not visible because it has CSS property: `display: none`')

        expect(getLog.get('state')).to.eq('passed')
        expect(getLog.get('error')).to.be.undefined

        expect(findLog.get('state')).to.eq('passed')
        expect(findLog.get('error')).to.be.undefined
        expect(findLog.get('$el').get(0)).to.eq(button.get(0))
        const consoleProps = findLog.invoke('consoleProps')

        expect(consoleProps.props.Yielded).to.eq(button.get(0))
        expect(consoleProps.props.Elements).to.eq(button.length)

        expect(assertionLog.get('state')).to.eq('failed')
        expect(err.message).to.include(assertionLog.get('error').message)

        done()
      })

      cy.get('#dom').find('#button').should('be.visible')
    })
  })
})
