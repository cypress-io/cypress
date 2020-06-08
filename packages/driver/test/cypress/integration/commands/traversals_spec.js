const { _, $, dom } = Cypress

const helpers = require('../../support/helpers')

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
            expect(err.message).to.include(`\`cy.${name}()\` failed because this element`)

            done()
          })

          cy.get('#list')[name](arg)
        })

        it('returns no elements', (done) => {
          const errIncludes = (el, node) => {
            node = dom.stringify(cy.$$(node), 'short')

            cy.on('fail', (err) => {
              expect(err.message).to.include(`Expected to find element: \`${el}\`, but never found it. Queried from element: ${node}`)

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

          return null
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
            const obj = { Command: name }

            if (_.isFunction(arg)) {
              obj.Selector = ''
            } else {
              obj.Selector = [].concat(arg).join(', ')
            }

            const yielded = Cypress.dom.getElements($el)

            _.extend(obj, {
              'Applied To': helpers.getFirstSubjectByName('get').get(0),
              Yielded: yielded,
              Elements: $el.length,
            })

            expect(this.lastLog.invoke('consoleProps')).to.deep.eq(obj)
          })
        })

        it('can be turned off', () => {
          cy.get('#list')[name](arg, { log: false }).then(function () {
            const { lastLog } = this

            expect(lastLog.get('name')).to.eq('get')
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
        expect(err.message).to.include('Expected to find element: `span`, but never found it. Queried from element: <li.item>')

        done()
      })

      cy.get('#list li:last').find('span')
    })

    it('throws once when incorrect sizzle selector', function (done) {
      cy.on('fail', (err) => {
        expect(this.logs.length).to.eq(2)

        done()
      })

      cy.get('div:first').find('.spinner\'')
    })

    it('logs out $el when existing $el is found even on failure', function (done) {
      const button = cy.$$('#button').hide()

      cy.on('fail', (err) => {
        const log = this.logs[1]

        expect(log.get('state')).to.eq('failed')
        expect(err.message).to.include(log.get('error').message)
        expect(log.get('$el').get(0)).to.eq(button.get(0))

        const consoleProps = log.invoke('consoleProps')

        expect(consoleProps.Yielded).to.eq(button.get(0))
        expect(consoleProps.Elements).to.eq(button.length)

        done()
      })

      cy.get('#dom').find('#button').should('be.visible')
    })
  })

  describe('shadow dom', () => {
    beforeEach(() => {
      cy.visit('/fixtures/shadow-dom.html')
    })

    describe('find', () => {
      it('retrieves a matching element beyond shadow boundaries', () => {
        const el = cy.$$('#shadow-element-3')[0].shadowRoot.querySelector('p')
        const parent = cy.$$('#parent-of-shadow-container-0')

        cy
        .get(parent)
        .find('p', { includeShadowDom: true })
        .then(($element) => {
          expect($element.length).to.eq(1)
          expect($element[0]).to.eq(el)
        })
      })

      it('retrieves a matching element when no shadow roots', () => {
        const el = cy.$$('#shadow-element-3')[0]
        const parent = cy.$$('#parent-of-shadow-container-0')

        cy
        .get(parent)
        .find('#shadow-element-3', { includeShadowDom: true })
        .then(($element) => {
          expect($element.length).to.eq(1)
          expect($element[0]).to.eq(el)
        })
      })

      it('allows traversal when already within a shadow root', () => {
        const parent = cy.$$('#shadow-element-3')[0].shadowRoot
        const el = cy.$$('#shadow-element-3')[0].shadowRoot.querySelector('p')

        cy
        .get(parent)
        .find('p')
        .then(($element) => {
          expect($element.length).to.eq(1)
          expect($element[0]).to.eq(el)
        })
      })
    })

    describe('closest', () => {
      it('retrieves the closest element beyond shadow boundaries', () => {
        const el = cy.$$('#shadow-element-3')[0].shadowRoot.querySelector('p')

        cy
        .get(el)
        .closest('#parent-of-shadow-container-0')
        .then(($parent) => {
          expect($parent.length).to.eq(1)
          expect($parent[0].id).to.eq('parent-of-shadow-container-0')
        })
      })

      it('retrieves closest elements normally when no shadow roots', () => {
        const el = cy.$$('#shadow-element-3')

        cy
        .get(el)
        .closest('#parent-of-shadow-container-0')
        .then(($parent) => {
          expect($parent.length).to.eq(1)
          expect($parent[0].id).to.eq('parent-of-shadow-container-0')
        })
      })
    })

    describe('parents', () => {
      it('retrieves all parents, including those beyond shadow boundaries', () => {
        const el = cy.$$('#shadow-element-3')[0].shadowRoot.querySelector('p')

        cy
        .get(el)
        .parents()
        .then(($parents) => {
          expect($parents.length).to.eq(5)
          expect($parents[0].id).to.eq('shadow-element-3')
          expect($parents[1].id).to.eq('parent-of-shadow-container-1')
          expect($parents[2].id).to.eq('parent-of-shadow-container-0')
          expect($parents[3].nodeName).to.eq('BODY')
          expect($parents[4].nodeName).to.eq('HTML')
        })
      })

      it('retrieves parents normally when no shadow roots exist', () => {
        const el = cy.$$('#shadow-element-3')

        cy
        .get(el)
        .parents()
        .then(($parents) => {
          expect($parents.length).to.eq(4)
          expect($parents[0].id).to.eq('parent-of-shadow-container-1')
          expect($parents[1].id).to.eq('parent-of-shadow-container-0')
          expect($parents[2].nodeName).to.eq('BODY')
          expect($parents[3].nodeName).to.eq('HTML')
        })
      })
    })
  })
})
