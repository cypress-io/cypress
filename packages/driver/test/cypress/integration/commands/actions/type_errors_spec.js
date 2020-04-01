const $ = Cypress.$.bind(Cypress)
const { _ } = Cypress

describe('src/cy/commands/actions/type - #type errors', () => {
  beforeEach(() => {
    cy.visit('/fixtures/dom.html')
  })

  describe('errors', () => {
    beforeEach(() => {
      Cypress.config('defaultCommandTimeout', 100)

      this.logs = []

      cy.on('log:added', (attrs, log) => {
        this.lastLog = log

        this.logs.push(log)
      })

      null
    })

    it('throws when not a dom subject', (done) => {
      cy.on('fail', () => {
        done()
      })

      cy.noop({}).type('foo')
    })

    it('throws when subject is not in the document', (done) => {
      const typed = cy.stub()

      const input = cy.$$('input:first').keypress((e) => {
        typed()

        input.remove()
      })

      cy.on('fail', (err) => {
        expect(typed).to.be.calledOnce
        expect(err.message).to.include('`cy.type()` failed because this element')

        done()
      })

      cy.get('input:first').type('a').type('b')
    })

    _.each([
      { id: 'readonly-attr', val: '' },
      { id: 'readonly-empty-str', val: '' },
      { id: 'readonly-readonly', val: 'readonly' },
      { id: 'readonly-str', val: 'abc' },
    ], (attrs) => {
      it(`throws when readonly ${attrs.val} attr (${attrs.id})`, (done) => {
        cy.get(`#${attrs.id}`).type('foo')

        cy.on('fail', (err) => {
          expect(err.message).to.include('`cy.type()` failed because this element is readonly:')
          expect(err.message).to.include(`\`<input id="${attrs.id}" readonly="${attrs.val}">\``)
          expect(err.message).to.include('Fix this problem, or use `{force: true}` to disable error checking.')
          expect(err.docsUrl).to.eq('https://on.cypress.io/element-cannot-be-interacted-with')
          done()
        })
      })
    })

    it('throws when not textarea or text-like', (done) => {
      cy.timeout(300)
      cy.get('div#nested-find').type('foo')

      cy.on('fail', (err) => {
        expect(err.message).to.include('`cy.type()` failed because it requires a valid typeable element.')
        expect(err.message).to.include('The element typed into was:')
        expect(err.message).to.include('<div id="nested-find">Nested ...</div>')
        expect(err.message).to.include(`A typeable element matches one of the following selectors:`)
        expect(err.docsUrl).to.eq('https://on.cypress.io/type')
        done()
      })
    })

    it('throws when subject is a collection of elements', function (done) {
      cy.get('textarea,:text').then(function ($inputs) {
        this.num = $inputs.length

        $inputs
      }).type('foo')

      cy.on('fail', (err) => {
        expect(err.message).to.include(`\`cy.type()\` can only be called on a single element. Your subject contained ${this.num} elements.`)
        expect(err.docsUrl).to.include('https://on.cypress.io/type')
        done()
      })
    })

    it('throws when the subject isnt visible', function (done) {
      cy.$$('input:text:first').show().hide()

      cy.on('fail', (err) => {
        const { lastLog } = this

        expect(this.logs.length).to.eq(2)
        expect(lastLog.get('error')).to.eq(err)
        expect(err.message).to.include('`cy.type()` failed because this element is not visible')

        done()
      })

      cy.get('input:text:first').type('foo')
    })

    it('throws when subject is disabled', function (done) {
      cy.$$('input:text:first').prop('disabled', true)

      cy.on('fail', (err) => {
        // get + type logs
        expect(this.logs.length).eq(2)
        expect(err.message).to.include('`cy.type()` failed because this element is `disabled`:\n')

        done()
      })

      cy.get('input:text:first').type('foo')
    })

    it('throws when submitting within nested forms')

    it('logs once when not dom subject', function (done) {
      cy.on('fail', (err) => {
        const { lastLog } = this

        expect(this.logs.length).to.eq(1)
        expect(lastLog.get('error')).to.eq(err)

        done()
      })

      cy.type('foobar')
    })

    it('throws when input cannot be clicked', function (done) {
      const $input = $('<input />')
      .attr('id', 'input-covered-in-span')
      .prependTo(cy.$$('body'))

      $('<span>span on button</span>')
      .css({
        position: 'absolute',
        left: $input.offset().left,
        top: $input.offset().top,
        padding: 5,
        display: 'inline-block',
        backgroundColor: 'yellow',
      })
      .prependTo(cy.$$('body'))

      cy.on('fail', (err) => {
        expect(this.logs.length).to.eq(2)
        expect(err.message).to.include('`cy.type()` failed because this element')
        expect(err.message).to.include('is being covered by another element')

        done()
      })

      cy.get('#input-covered-in-span').type('foo')
    })

    it('throws when special characters dont exist', function (done) {
      cy.on('fail', (err) => {
        expect(this.logs.length).to.eq(2)

        const allChars = _.keys(Cypress.Keyboard.getKeymap()).join(', ')

        expect(err.message).to.eq(`Special character sequence: \`{bar}\` is not recognized. Available sequences are: \`${allChars}\`

If you want to skip parsing special character sequences and type the text exactly as written, pass the option: \`{ parseSpecialCharSequences: false }\``)

        expect(err.docsUrl).to.eq('https://on.cypress.io/type')

        done()
      })

      cy.get(':text:first').type('foo{bar}')
    })

    it('throws when attempting to type tab', function (done) {
      cy.on('fail', (err) => {
        expect(this.logs.length).to.eq(2)
        expect(err.message).to.eq('`{tab}` isn\'t a supported character sequence.')

        done()
      })

      cy.get(':text:first').type('foo{tab}')
    })

    it('throws on an empty string', function (done) {
      cy.on('fail', (err) => {
        expect(this.logs.length).to.eq(2)
        expect(err.message).to.eq('`cy.type()` cannot accept an empty string. You need to actually type something.')
        expect(err.docsUrl).to.eq('https://on.cypress.io/type')
        done()
      })

      cy.get(':text:first').type('')
    })

    it('allows typing spaces', () => {
      cy
      .get(':text:first').type(' ')
      .should('have.value', ' ')
    })

    it('allows typing special characters', () => {
      cy
      .get(':text:first').type('{esc}')
      .should('have.value', '')
    })

    _.each(['toString', 'toLocaleString', 'hasOwnProperty', 'valueOf',
      'undefined', 'null', 'true', 'false', 'True', 'False'], (val) => {
      it(`allows typing reserved Javscript word (${val})`, () => {
        cy
        .get(':text:first').type(val)
        .should('have.value', val)
      })
    })

    describe('naughty strings', () => {
      _.each(['Ω≈ç√∫˜µ≤≥÷', '2.2250738585072011e-308', '田中さんにあげて下さい',
        '<foo val=`bar\' />', '⁰⁴⁵₀₁₂', '🐵 🙈 🙉 🙊',
        '<script>alert(123)</script>', '$USER'], (val) => {
        it(`allows typing some naughty strings (${val})`, () => {
          cy
          .get(':text:first').type(val)
          .should('have.value', val)
        })
      })
    })

    it('allows typing special characters', () => {
      cy
      .get(':text:first').type('{esc}')
      .should('have.value', '')
    })

    it('can type into input with invalid type attribute', () => {
      cy.get(':text:first')
      .invoke('attr', 'type', 'asdf')
      .type('foobar')
      .should('have.value', 'foobar')
    })

    describe('throws when trying to type', () => {
      _.each([NaN, Infinity, [], {}, null, undefined], (val) => {
        it(`throws when trying to type: ${val}`, function (done) {
          const logs = []

          cy.on('log:added', (attrs, log) => {
            return logs.push(log)
          })

          cy.on('fail', (err) => {
            expect(this.logs.length).to.eq(2)
            expect(err.message).to.eq(`\`cy.type()\` can only accept a string or number. You passed in: \`${val}\``)
            expect(err.docsUrl).to.eq('https://on.cypress.io/type')
            done()
          })

          cy.get(':text:first').type(val)
        })
      })
    })

    it('throws when type is canceled by preventingDefault mousedown')

    it('throws when element animation exceeds timeout', (done) => {
      // force the animation calculation to think we moving at a huge distance ;-)
      cy.stub(Cypress.utils, 'getDistanceBetween').returns(100000)

      const keydown = cy.stub()

      cy.$$(':text:first').on('keydown', keydown)

      cy.on('fail', (err) => {
        expect(keydown).not.to.be.called
        expect(err.message).to.include('`cy.type()` could not be issued because this element is currently animating:\n')
        expect(err.docsUrl).to.eq('https://on.cypress.io/element-is-animating')

        done()
      })

      cy.get(':text:first').type('foo')
    })

    it('eventually fails the assertion', function (done) {
      cy.on('fail', (err) => {
        const { lastLog } = this

        expect(err.message).to.include(lastLog.get('error').message)
        expect(err.message).not.to.include('undefined')
        expect(lastLog.get('name')).to.eq('assert')
        expect(lastLog.get('state')).to.eq('failed')
        expect(lastLog.get('error')).to.be.an.instanceof(chai.AssertionError)

        done()
      })

      cy.get('input:first').type('f').should('have.class', 'typed')
    })

    it('does not log an additional log on failure', function (done) {
      cy.on('fail', () => {
        expect(this.logs.length).to.eq(3)

        done()
      })

      cy.get('input:first').type('f').should('have.class', 'typed')
    })

    context('[type=date]', () => {
      it('throws when chars is not a string', function (done) {
        cy.on('fail', (err) => {
          expect(this.logs.length).to.eq(2)
          expect(err.message).to.eq('Typing into a `date` input with `cy.type()` requires a valid date with the format `yyyy-MM-dd`. You passed: `1989`')
          expect(err.docsUrl).to.eq('https://on.cypress.io/type')
          done()
        })

        cy.get('#date-without-value').type(1989)
      })

      it('throws when chars is invalid format', function (done) {
        cy.on('fail', (err) => {
          expect(this.logs.length).to.eq(2)
          expect(err.message).to.eq('Typing into a `date` input with `cy.type()` requires a valid date with the format `yyyy-MM-dd`. You passed: `01-01-1989`')
          expect(err.docsUrl).to.eq('https://on.cypress.io/type')
          done()
        })

        cy.get('#date-without-value').type('01-01-1989')
      })

      it('throws when chars is invalid date', function (done) {
        cy.on('fail', (err) => {
          expect(this.logs.length).to.eq(2)
          expect(err.message).to.eq('Typing into a `date` input with `cy.type()` requires a valid date with the format `yyyy-MM-dd`. You passed: `1989-04-31`')
          expect(err.docsUrl).to.eq('https://on.cypress.io/type')
          done()
        })

        cy.get('#date-without-value').type('1989-04-31')
      })
    })

    context('[type=month]', () => {
      it('throws when chars is not a string', function (done) {
        cy.on('fail', (err) => {
          expect(this.logs.length).to.eq(2)
          expect(err.message).to.eq('Typing into a `month` input with `cy.type()` requires a valid month with the format `yyyy-MM`. You passed: `6`')
          expect(err.docsUrl).to.eq('https://on.cypress.io/type')
          done()
        })

        cy.get('#month-without-value').type(6)
      })

      it('throws when chars is invalid format', function (done) {
        cy.on('fail', (err) => {
          expect(this.logs.length).to.eq(2)
          expect(err.message).to.eq('Typing into a `month` input with `cy.type()` requires a valid month with the format `yyyy-MM`. You passed: `01/2000`')
          expect(err.docsUrl).to.eq('https://on.cypress.io/type')
          done()
        })

        cy.get('#month-without-value').type('01/2000')
      })

      it('throws when chars is invalid month', function (done) {
        cy.on('fail', (err) => {
          expect(this.logs.length).to.eq(2)
          expect(err.message).to.eq('Typing into a `month` input with `cy.type()` requires a valid month with the format `yyyy-MM`. You passed: `1989-13`')
          expect(err.docsUrl).to.eq('https://on.cypress.io/type')
          done()
        })

        cy.get('#month-without-value').type('1989-13')
      })
    })

    context('[type=tel]', () => {
      it('can edit tel', () => {
        cy.get('#by-name > input[type="tel"]')
        .type('1234567890')
        .should('have.prop', 'value', '1234567890')
      })
    })

    // it "throws when chars is invalid format", (done) ->
    //   cy.on "fail", (err) =>
    //     expect(@logs.length).to.eq(2)
    //     expect(err.message).to.eq("Typing into a week input with cy.type() requires a valid week with the format 'yyyy-Www', where W is the literal character 'W' and ww is the week number (00-53). You passed: 2005/W18")
    //     done()

    context('[type=week]', () => {
      it('throws when chars is not a string', function (done) {
        cy.on('fail', (err) => {
          expect(this.logs.length).to.eq(2)
          expect(err.message).to.eq('Typing into a `week` input with `cy.type()` requires a valid week with the format `yyyy-Www`, where `W` is the literal character `W` and `ww` is the week number (00-53). You passed: `23`')
          expect(err.docsUrl).to.eq('https://on.cypress.io/type')
          done()
        })

        cy.get('#week-without-value').type(23)
      })

      it('throws when chars is invalid format', function (done) {
        cy.on('fail', (err) => {
          expect(this.logs.length).to.eq(2)
          expect(err.message).to.eq('Typing into a `week` input with `cy.type()` requires a valid week with the format `yyyy-Www`, where `W` is the literal character `W` and `ww` is the week number (00-53). You passed: `2005/W18`')
          expect(err.docsUrl).to.eq('https://on.cypress.io/type')
          done()
        })

        cy.get('#week-without-value').type('2005/W18')
      })

      it('throws when chars is invalid week', function (done) {
        cy.on('fail', (err) => {
          expect(this.logs.length).to.eq(2)
          expect(err.message).to.eq('Typing into a `week` input with `cy.type()` requires a valid week with the format `yyyy-Www`, where `W` is the literal character `W` and `ww` is the week number (00-53). You passed: `1995-W60`')
          expect(err.docsUrl).to.eq('https://on.cypress.io/type')
          done()
        })

        cy.get('#week-without-value').type('1995-W60')
      })
    })

    context('[type=time]', () => {
      it('throws when chars is not a string', function (done) {
        cy.on('fail', (err) => {
          expect(this.logs.length).to.equal(2)
          expect(err.message).to.equal('Typing into a `time` input with `cy.type()` requires a valid time with the format `HH:mm`, `HH:mm:ss` or `HH:mm:ss.SSS`, where `HH` is 00-23, `mm` is 00-59, `ss` is 00-59, and `SSS` is 000-999. You passed: `9999`')
          expect(err.docsUrl).to.eq('https://on.cypress.io/type')
          done()
        })

        cy.get('#time-without-value').type(9999)
      })

      it('throws when chars is invalid format (1:30)', function (done) {
        cy.on('fail', (err) => {
          expect(this.logs.length).to.equal(2)
          expect(err.message).to.equal('Typing into a `time` input with `cy.type()` requires a valid time with the format `HH:mm`, `HH:mm:ss` or `HH:mm:ss.SSS`, where `HH` is 00-23, `mm` is 00-59, `ss` is 00-59, and `SSS` is 000-999. You passed: `1:30`')
          expect(err.docsUrl).to.eq('https://on.cypress.io/type')
          done()
        })

        cy.get('#time-without-value').type('1:30')
      })

      it('throws when chars is invalid format (01:30pm)', function (done) {
        cy.on('fail', (err) => {
          expect(this.logs.length).to.equal(2)
          expect(err.message).to.equal('Typing into a `time` input with `cy.type()` requires a valid time with the format `HH:mm`, `HH:mm:ss` or `HH:mm:ss.SSS`, where `HH` is 00-23, `mm` is 00-59, `ss` is 00-59, and `SSS` is 000-999. You passed: `01:30pm`')
          expect(err.docsUrl).to.eq('https://on.cypress.io/type')
          done()
        })

        cy.get('#time-without-value').type('01:30pm')
      })

      it('throws when chars is invalid format (01:30:30.3333)', function (done) {
        cy.on('fail', (err) => {
          expect(this.logs.length).to.equal(2)
          expect(err.message).to.equal('Typing into a `time` input with `cy.type()` requires a valid time with the format `HH:mm`, `HH:mm:ss` or `HH:mm:ss.SSS`, where `HH` is 00-23, `mm` is 00-59, `ss` is 00-59, and `SSS` is 000-999. You passed: `01:30:30.3333`')
          expect(err.docsUrl).to.eq('https://on.cypress.io/type')
          done()
        })

        cy.get('#time-without-value').type('01:30:30.3333')
      })

      it('throws when chars is invalid time', function (done) {
        cy.on('fail', (err) => {
          expect(this.logs.length).to.equal(2)
          expect(err.message).to.equal('Typing into a `time` input with `cy.type()` requires a valid time with the format `HH:mm`, `HH:mm:ss` or `HH:mm:ss.SSS`, where `HH` is 00-23, `mm` is 00-59, `ss` is 00-59, and `SSS` is 000-999. You passed: `01:60`')
          expect(err.docsUrl).to.eq('https://on.cypress.io/type')
          done()
        })

        cy.get('#time-without-value').type('01:60')
      })
    })
  })
})
