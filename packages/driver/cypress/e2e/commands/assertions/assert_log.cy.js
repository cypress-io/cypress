const { $ } = Cypress

describe('src/cy/commands/assertions', () => {
  beforeEach(function () {
    cy.visit('/fixtures/jquery.html')
  })

  context('#assert', () => {
    beforeEach(function () {
      this.logs = []

      cy.on('log:added', (attrs, log) => {
        this.logs?.push(log)

        if (attrs.name === 'assert') {
          this.lastLog = log
        }
      })

      return null
    })

    it('does not output should logs on failures', { defaultCommandTimeout: 50 }, function (done) {
      cy.on('fail', () => {
        const { length } = this.logs

        expect(length).to.eq(1)

        done()
      })

      cy.noop({}).should('have.property', 'foo')
    })

    it('snapshots immediately and sets child', (done) => {
      cy.on('log:added', (attrs, log) => {
        if (attrs.name !== 'assert') {
          return
        }

        cy.removeAllListeners('log:added')
        expect(log.get('snapshots').length).to.eq(1)
        expect(log.get('snapshots')[0]).to.be.an('object')
        expect(log.get('type')).to.eq('child')

        done()
      })

      cy.get('body').then((subject) => {
        expect(subject).to.match('body')
      })
    })

    it('sets type to child current command had arguments but does not match subject', (done) => {
      cy.on('log:added', (attrs, log) => {
        if (attrs.name === 'assert') {
          cy.removeAllListeners('log:added')
          expect(log.get('type')).to.eq('child')

          done()
        }
      })

      cy.get('body').then(($body) => {
        expect($body.length).to.eq(1)
      })
    })

    it('sets type to parent when assertion did not involve current subject and didnt have arguments', (done) => {
      cy.on('log:added', (attrs, log) => {
        if (attrs.name === 'assert') {
          cy.removeAllListeners('log:added')
          expect(log.get('type')).to.eq('parent')

          done()
        }
      })

      cy.get('body').then(() => {
        expect(true).to.be.true
      })
    })

    it('removes rest of line when passing assertion includes \', but\' for jQuery subjects', (done) => {
      cy.on('log:added', (attrs, log) => {
        if (attrs.name === 'assert') {
          cy.removeAllListeners('log:added')
          expect(log.get('message')).to.eq('expected **<a>** to have attribute **href** with the value **#**')

          done()
        }
      })

      cy.get('a:first').then(($a) => {
        expect($a).to.have.attr('href', '#')
      })
    })

    it('does not replaces instances of word \'but\' with \'and\' for failing assertion', (done) => {
      cy.on('log:added', (attrs, log) => {
        if (attrs.name === 'assert') {
          cy.removeAllListeners('log:added')

          expect(log.get('message')).to.eq('expected **<a>** to have attribute **href** with the value **asdf**, but the value was **#**')

          done()
        }
      })

      cy.get('a:first').then(($a) => {
        try {
          expect($a).to.have.attr('href', 'asdf')
        } catch (error) {} // eslint-disable-line no-empty
      })
    })

    it('does not replace \'button\' with \'andton\'', (done) => {
      cy.on('log:added', (attrs, log) => {
        if (attrs.name === 'assert') {
          cy.removeAllListeners('log:added')

          expect(log.get('message')).to.eq('expected **<button>** to be **visible**')

          done()
        }
      })

      cy.get('button:first').then(($button) => {
        expect($button).to.be.visible
      })
    })

    // https://github.com/cypress-io/cypress/issues/16570
    it('handles BigInt correctly', (done) => {
      cy.on('log:added', (attrs, log) => {
        if (attrs.name === 'assert') {
          cy.removeAllListeners('log:added')
          expect(log.get('message')).to.eq('expected **2n** to equal **2n**')

          done()
        }
      })

      expect(2n).to.equal(2n)
    })

    it('handles non-HTMLElement(s) (e.g. Element)', () => {
      const xml = '<?xml version="1.0" encoding="UTF-8"?><foo><bar>Bar</bar></foo>'
      const parser = new DOMParser()
      const doc = parser.parseFromString(xml, 'application/xml')
      const foo = doc.getElementsByTagName('foo')[0]

      expect(foo).not.to.be.undefined
      expect(foo).to.be.instanceOf(Element)
      expect(foo).not.to.be.instanceOf(HTMLElement)
    })

    it('#consoleProps for regular objects', (done) => {
      cy.on('log:added', (attrs, log) => {
        if (attrs.name === 'assert') {
          cy.removeAllListeners('log:added')

          expect(log.invoke('consoleProps')).to.deep.eq({
            name: 'assert',
            type: 'command',
            props: {
              expected: 1,
              actual: 1,
              Message: 'expected 1 to equal 1',
            },
          })

          done()
        }
      })

      cy.then(() => {
        expect(1).to.eq(1)
      })
    })

    it('#consoleProps for DOM objects', (done) => {
      cy.on('log:added', (attrs, log) => {
        if (attrs.name === 'assert') {
          cy.removeAllListeners('log:added')

          expect(log.invoke('consoleProps')).to.deep.eq({
            name: 'assert',
            type: 'command',
            props: {
              subject: log.get('subject'),
              Message: 'expected <body> to have property length',
            },
          })

          done()
        }
      })

      cy
      .get('body').then(($body) => {
        expect($body).to.have.property('length')
      })
    })

    it('#consoleProps for errors', (done) => {
      cy.on('log:added', (attrs, log) => {
        if (attrs.name === 'assert') {
          cy.removeAllListeners('log:added')
          let err

          try {
            expect(log.invoke('consoleProps')).to.deep.contain({
              name: 'assert',
              type: 'command',
              error: log.get('error').stack,
              props: {
                expected: false,
                actual: true,
                Message: 'expected true to be false',
              },
            })
          } catch (e) {
            err = e
          }

          done(err)
        }
      })

      cy.then(() => {
        try {
          expect(true).to.be.false
        } catch (err) {} // eslint-disable-line no-empty
      })
    })

    describe('#patchAssert', () => {
      it('wraps \#{this} and \#{exp} in \#{b}', (done) => {
        cy.on('log:added', (attrs, log) => {
          if (attrs.name === 'assert') {
            cy.removeAllListeners('log:added')

            expect(log.get('message')).to.eq('expected **foo** to equal **foo**')

            done()
          }
        })

        cy.then(() => {
          expect('foo').to.eq('foo')
        })
      })

      it('doesnt mutate error message', () => {
        cy.then(() => {
          try {
            expect(true).to.eq(false)
          } catch (e) {
            expect(e.message).to.eq('expected true to equal false')
          }
        })
      })

      describe('jQuery elements', () => {
        it('sets _obj to selector', (done) => {
          cy.on('log:added', (attrs, log) => {
            if (attrs.name === 'assert') {
              cy.removeAllListeners('log:added')

              expect(log.get('message')).to.eq('expected **<body>** to exist in the DOM')

              done()
            }
          })

          cy.get('body').then(($body) => {
            expect($body).to.exist
          })
        })

        it('matches empty string attributes', (done) => {
          cy.on('log:added', (attrs, log) => {
            if (attrs.name === 'assert') {
              cy.removeAllListeners('log:added')

              expect(log.get('message')).to.eq('expected **<input>** to have attribute **value** with the value **\'\'**')

              done()
            }
          })

          cy.$$('body').prepend($('<input value=\'\' />'))

          cy.get('input').eq(0).then(($input) => {
            expect($input).to.have.attr('value', '')
          })
        })

        it('can chain off of chai-jquery assertions', () => {
          const $el = cy.$$('ul#list')

          expect($el).to.be.visible.and.have.id('list')
        })

        describe('without selector', () => {
          it('exists', (done) => {
            cy.on('log:added', (attrs, log) => {
              if (attrs.name === 'assert') {
                cy.removeAllListeners('log:added')

                expect(log.get('message')).to.eq('expected **<div>** to exist in the DOM')

                done()
              }
            })

            // prepend an empty div so it has no id or class
            cy.$$('body').prepend($('<div />'))

            // expect($div).to.match("div")
            cy.get('div').eq(0).then(($div) => {
              expect($div).to.exist
            })
          })

          it('uses element name', (done) => {
            cy.on('log:added', (attrs, log) => {
              if (attrs.name === 'assert') {
                cy.removeAllListeners('log:added')

                expect(log.get('message')).to.eq('expected **<input>** to match **input**')

                done()
              }
            })

            // prepend an empty div so it has no id or class
            cy.$$('body').prepend($('<input />'))

            cy.get('input').eq(0).then(($div) => {
              expect($div).to.match('input')
            })
          })
        })

        describe('property assertions', () => {
          it('has property', (done) => {
            cy.on('log:added', (attrs, log) => {
              if (attrs.name === 'assert') {
                cy.removeAllListeners('log:added')

                expect(log.get('message')).to.eq('expected **<button>** to have property **length**')

                done()
              }
            })

            cy.get('button:first').should('have.property', 'length')
          })

          it('passes on expected subjects without changing them', () => {
            cy.state('window').$.fn.foo = 'bar'

            cy
            .get('input:first').then(($input) => {
              expect($input).to.have.property('foo', 'bar')
            })
          })
        })
      })
    })
  })

  context('chai assert', () => {
    beforeEach(function () {
      this.logs = []

      cy.on('log:added', (attrs, log) => {
        this.logs?.push(log)
      })

      return null
    })

    it('equal', function () {
      assert.equal(1, 1, 'one is one')

      expect(this.logs[0].get('message')).to.eq('one is one: expected **1** to equal **1**')
    })

    it('isOk', function () {
      assert.isOk({}, 'is okay')

      expect(this.logs[0].get('message')).to.eq('is okay: expected **{}** to be truthy')
    })

    it('isFalse', function () {
      assert.isFalse(false, 'is false')

      expect(this.logs[0].get('message')).to.eq('is false: expected **false** to be false')
    })
  })

  describe('message formatting', () => {
    const expectMarkdown = (test, message, done) => {
      cy.then(() => {
        test()
      })

      cy.on('log:added', (attrs, log) => {
        if (attrs.name === 'assert') {
          cy.removeAllListeners('log:added')

          expect(log.get('message')).to.eq(message)

          done()
        }
      })
    }

    // https://github.com/cypress-io/cypress/issues/19116
    it('text with backslashes', (done) => {
      const text = '"<OE_D]dQ\\'

      expectMarkdown(
        () => expect(text).to.equal(text),
        `expected **"<OE_D]dQ\\\\** to equal **"<OE_D]dQ\\\\**`,
        done,
      )
    })

    describe('messages with quotation marks', () => {
      it('preserves quotation marks in number strings', (done) => {
        expectMarkdown(() => {
          try {
            expect(25).to.eq('25')
          } catch (error) {} /* eslint-disable-line no-empty */
        },
        `expected **25** to equal **'25'**`,
        done)
      })

      it('preserves quotation marks in empty string', (done) => {
        expectMarkdown(() => {
          try {
            expect(42).to.eq('')
          } catch (error) {} /* eslint-disable-line no-empty */
        },
        `expected **42** to equal **''**`,
        done)
      })

      it('preserves quotation marks if escaped', (done) => {
        expectMarkdown(
          () => expect(`\'cypress\'`).to.eq(`\'cypress\'`),
          // ****'cypress'**** -> ** for emphasizing result string  + ** for emphasizing the entire result.
          `expected **'cypress'** to equal ****'cypress'****`,
          done,
        )
      })

      it('removes quotation marks in DOM elements', (done) => {
        expectMarkdown(
          () => {
            cy.get('body').then(($body) => {
              expect($body).to.contain('div')
            })
          },
          `expected **<body>** to contain **div**`,
          done,
        )
      })

      it('removes quotation marks in strings', (done) => {
        expectMarkdown(() => expect('cypress').to.eq('cypress'), `expected **cypress** to equal **cypress**`, done)
      })

      it('removes quotation marks in objects', (done) => {
        expectMarkdown(
          () => expect({ foo: 'bar' }).to.deep.eq({ foo: 'bar' }),
          `expected **{ foo: bar }** to deeply equal **{ foo: bar }**`,
          done,
        )
      })

      it('formats keys properly for "have.all.keys"', (done) => {
        const person = {
          name: 'Joe',
          age: 20,
        }

        expectMarkdown(
          () => expect(person).to.have.all.keys('name', 'age'),
          `expected **{ name: Joe, age: 20 }** to have keys **name**, and **age**`,
          done,
        )
      })
    })

    describe('formats strings with spaces', (done) => {
      const tester = (message, done) => {
        const nbspedMsg = message
        .replace(/^\s+/, (match) => {
          return match.replace(/\s/g, '&nbsp;')
        })
        .replace(/\s+$/, (match) => {
          return match.replace(/\s/g, '&nbsp;')
        })

        expectMarkdown(() => expect(message).to.eq(message), `expected **'${nbspedMsg}'** to equal **'${nbspedMsg}'**`, done)
      }

      [' 37:46 ', '   test      ', '  love'].forEach((v) => {
        it(v, (done) => {
          tester(v, done)
        })
      })
    })

    describe('escape markdown', () => {
      // https://github.com/cypress-io/cypress/issues/17357
      it('images', (done) => {
        const text = 'hello world ![JSDoc example](/slides/img/jsdoc.png)'
        const result = 'hello world ``![JSDoc example](/slides/img/jsdoc.png)``'

        expectMarkdown(
          () => expect(text).to.equal(text),
          `expected **${result}** to equal **${result}**`,
          done,
        )
      })
    })

    // Cypress renders and truncates values in assertion messages with its own
    // inspector rather than chai's built-in one. These render differently under
    // chai's inspector (e.g. `[Function foo]`, ISO-8601 dates, and
    // `{ name: 'Joe', …(1) }` instead of `{ Object (name, ...) }` once past the
    // truncateThreshold), so these assertions catch a regression that would
    // change failure messages.
    describe('uses Cypress value inspection', () => {
      const getAssertionError = (test) => {
        try {
          test()
        } catch (err) {
          return err
        }

        throw new Error('expected the assertion to throw, but it did not')
      }

      it('renders functions as [Function: name]', () => {
        const foo = function foo () {}
        const bar = function bar () {}

        const err = getAssertionError(() => expect(foo).to.equal(bar))

        expect(err.message).to.eq('expected [Function: foo] to equal [Function: bar]')
      })

      it('renders dates with toUTCString', () => {
        const err = getAssertionError(() => expect(new Date(0)).to.equal(new Date(1)))

        expect(err.message).to.eq('expected Thu, 01 Jan 1970 00:00:00 GMT to equal Thu, 01 Jan 1970 00:00:00 GMT')
      })

      it('truncates long objects past the truncateThreshold', () => {
        const err = getAssertionError(() => expect({ name: 'Joe', age: 20, email: 'joe@example.com' }).to.equal(null))

        expect(err.message).to.eq('expected { Object (name, age, ...) } to equal null')
      })

      it('truncates long arrays past the truncateThreshold', () => {
        const err = getAssertionError(() => expect([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]).to.equal(null))

        expect(err.message).to.eq('expected [ Array(15) ] to equal null')
      })
    })
  })
})
