const { _, $ } = Cypress
const { shouldNotBeCalled, shouldBeCalledOnce, shouldBeCalledNth, attachKeyListeners } = require('./type_spec_utils')

export default function errors () {
  describe('errors', function () {
    beforeEach(function () {
      Cypress.config('defaultCommandTimeout', 100)

      this.logs = []

      cy.on('log:added', (attrs, log) => {
        this.lastLog = log

        return this.logs.push(log)
      })

      return null
    })

    it('throws when not a dom subject', (done) => {
      cy.on('fail', () => {
        done()
      })

      return cy.noop({}).type('foo')
    })

    it('throws when subject is not in the document', (done) => {
      let typed = 0

      const input = cy.$$('input:first').keypress(() => {
        typed += 1

        return input.remove()
      })

      cy.on('fail', (err) => {
        expect(typed).to.eq(1)
        expect(err.message).to.include('cy.type() failed because this element')

        done()
      })

      cy.get('input:first').type('a').type('b')
    })

    it('throws when not textarea or text-like', (done) => {
      cy.get('form')
      .first()
      .type('foo')

      cy.on('fail', (err) => {
        expect(err.message).to.include('cy.type() failed because it requires a valid typeable element.')
        expect(err.message).to.include('The element typed into was:')
        expect(err.message).to.include('<form id="by-id">...</form>')
        expect(err.message).to.include('Cypress considers the \'body\', \'textarea\', any \'element\' with a \'tabindex\' or \'contenteditable\' attribute, any focusable element, or any \'input\' with a \'type\' attribute of \'text\', \'password\', \'email\', \'number\', \'date\', \'week\', \'month\', \'time\', \'datetime\', \'datetime-local\', \'search\', \'url\', or \'tel\' to be valid typeable elements.')

        done()
      })
    })

    it('throws when text-like but disabled', () => {
      cy.$$('input:first').attr('disabled', true)

      const fail = cy.stub().callsFake((err) => {
        expect(err.message).to.include('element is disabled')
      })

      cy.get('input:first').type('foo')
      .then(() => {
        expect(fail).calledOnce
      })

      cy.on('fail', fail)
    })

    it('not throw when input becomes disabled during type', () => {
      const body = cy.$$('body')

      attachKeyListeners({ body })

      cy.$$('input:first').on('keydown', function () {
        $(this).attr('disabled', true)
      })
      cy.get('input:first').type('fo')//, { simulated: false })
      .should('have.value', '')

      cy.getAll('body', ['keydown', 'keypress', 'keyup']).each(shouldBeCalledNth(2))
    })

    it('move focus during type on keydown', () => {
      const input = cy.$$('input:first')
      const next = input.next('input')

      input.on('keydown', () => {
        next.focus()
      })
      attachKeyListeners({ input, next })
      cy.get('input:first').type('f')//, { simulated: false })
      .should('have.value', '')
      .next('input').should('have.value', 'f')

      cy.getAll('input', ['keypress', 'textInput', 'input', 'keyup']).each(shouldNotBeCalled)
      cy.getAll('next', ['keypress', 'textInput', 'input', 'keyup']).each(shouldBeCalledOnce)

    })

    it('move focus during type on keydown into readonly input', () => {
      const input = cy.$$('input:first')
      const next = input.next('input')

      input.on('keydown', () => {
        next.attr('readOnly', true)
        next.focus()
      })
      attachKeyListeners({ input, next })
      cy.get('input:first').type('f')//, { simulated: false })
      .should('have.value', '')
      .next('input').should('have.value', '')

      cy.getAll('input', ['keypress', 'textInput', 'input', 'keyup']).each(shouldNotBeCalled)
      cy.getAll('next', ['keypress', 'keyup']).each(shouldBeCalledOnce)
      cy.getAll('next', ['textInput', 'input']).each(shouldNotBeCalled)

    })

    it('move focus during type on keypress', () => {
      cy.$$('input:first').on('keypress', function () {
        $(this).next('input').focus()
      })
      cy.get('input:first').type('foo', { simulated: true })
      .should('have.value', 'f')
      .next('input').should('have.value', 'oo')
    })

    it('move focus during type on input', () => {
      cy.$$('input:first').on('input', function () {
        $(this).next('input').focus()
      })
      cy.get('input:first').type('foo', { simulated: true })
      .should('have.value', 'f')
      .next('input').should('have.value', 'oo')
    })

    it('move focus during type on textInput', () => {
      cy.$$('input:first').on('textInput', function () {
        $(this).next('input').focus()
      })
      cy.get('input:first').type('foo', { simulated: true })
      .should('have.value', 'f')
      .next('input').should('have.value', 'oo')
    })

    it('move focus during type on keyup', () => {
      cy.$$('input:first').on('keyup', function () {
        $(this).next('input').focus()
      })
      cy.get('input:first').type('foo', { simulated: true })
      .should('have.value', 'f')
      .next('input').should('have.value', 'oo')
    })

    it('disable during type on textInput', () => {
      cy.$$('input:first').on('textInput', function () {
        $(this).next('input').focus()
      })
      cy.get('input:first').type('foo', { simulated: true })
      .should('have.value', 'f')
      .next('input').should('have.value', 'oo')
    })

    it('throws when subject is a collection of elements', (done) => {
      cy.get('textarea,:text').then(($inputs) => {
        this.num = $inputs.length

        return $inputs
      }).type('foo')

      cy.on('fail', (err) => {
        expect(err.message).to.include(`cy.type() can only be called on a single element. Your subject contained ${this.num} elements.`)

        done()
      })
    })

    it('readonly props', () => {
      const input = cy.$$('<input/>').prependTo(cy.$$('body'))

      cy.wrap(input).should(($el) => {
        const el = $el[0]

        el.readOnly = true
        expect(el.getAttribute('readonly')).not.eq(null)
        expect($el.prop('readonly')).ok
        expect(el.readOnly).eq(true)
      })
    })

    it('throws when the subject isnt visible', function (done) {

      cy.on('fail', (err) => {
        const { lastLog } = this

        expect(this.logs.length).to.eq(2)
        expect(lastLog.get('error')).to.eq(err)
        expect(err.message).to.include('cy.type() failed because this element is not visible')

        done()
      })

      cy.get('input:text:first')
      .should(($el) => {
        return $el.show().hide()
      })
      .type('foo')
    })

    it('throws when subject is disabled', function (done) {
      cy.$$('input:text:first').prop('disabled', true)

      cy.on('fail', (err) => {
      //# get + type logs
        expect(this.logs.length).eq(2)
        expect(err.message).to.include('cy.type() failed because this element is disabled:\n')

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
        expect(err.message).to.include('cy.type() failed because this element')
        expect(err.message).to.include('is being covered by another element')

        done()
      })

      cy.get('#input-covered-in-span').type('foo')
    })

    it('throws when special characters dont exist', function (done) {

      cy.on('fail', (err) => {
      // expect(this.logs.length).to.eq(2)

        const keymap = cy.internal.keyboard.getKeymap()

        const allChars = _.keys(keymap).join(', ')

        expect(err.message).to.eq(`Special character sequence: '{bar}' is not recognized. Available sequences are: ${allChars}`)

        done()
      })

      cy.get(':text:first').type('foo{bar}')
    })

    it('throws when attemping to type tab', function (done) {
      cy.on('fail', (err) => {
        expect(this.logs.length).to.eq(2)
        expect(err.message).to.eq('{tab} isn\'t a supported character sequence. You\'ll want to use the command cy.tab(), which is not ready yet, but when it is done that\'s what you\'ll use.')

        done()
      })

      cy.get(':text:first').type('foo{tab}')
    })

    it('throws on an empty string', function (done) {
      cy.on('fail', (err) => {
        expect(this.logs.length).to.eq(2)
        expect(err.message).to.eq('cy.type() cannot accept an empty String. You need to actually type something.')

        done()
      })

      cy.get(':text:first').type('')
    })

    it('allows typing spaces', () => {
      cy
      .get(':text:first').type(' ')
      .should('have.value', ' ')
    }
    )

    it('can type into input with invalid type attribute', () => {
      cy.get(':text:first')
      .invoke('attr', 'type', 'asdf')
      .type('foobar')
      .should('have.value', 'foobar')
    }
    )

    _.each([NaN, Infinity, [], {}, null, undefined], (val) => {
      it(`throws when trying to type: ${val}`, function (done) {
        const logs = []

        cy.on('log:added', (attrs, log) => {
          logs.push(log)
        })

        cy.on('fail', (err) => {
          expect(this.logs.length).to.eq(2)
          expect(err.message).to.eq(`cy.type() can only accept a String or Number. You passed in: '${val}'`)

          done()
        })

        cy.get(':text:first').type(val)
      })
    })

    it('throws when type is cancelled by preventingDefault mousedown')

    it('throws when element animation exceeds timeout', (done) => {
    //# force the animation calculation to think we moving at a huge distance ;-)
      cy.stub(Cypress.utils, 'getDistanceBetween').returns(100000)

      let keydowns = 0

      cy.$$(':text:first').on('keydown', () => {
        return keydowns += 1
      })

      cy.on('fail', (err) => {
        expect(keydowns).to.eq(0)
        expect(err.message).to.include('cy.type() could not be issued because this element is currently animating:\n')

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

    context('[type=date]', function () {
      it('throws when chars is not a string', function (done) {
        cy.on('fail', (err) => {
          expect(this.logs.length).to.eq(2)
          expect(err.message).to.eq('Typing into a date input with cy.type() requires a valid date with the format \'yyyy-MM-dd\'. You passed: 1989')

          done()
        })

        cy.get('#date-without-value').type(1989)
      })

      it('throws when chars is invalid format', function (done) {
        cy.on('fail', (err) => {
          expect(this.logs.length).to.eq(2)
          expect(err.message).to.eq('Typing into a date input with cy.type() requires a valid date with the format \'yyyy-MM-dd\'. You passed: 01-01-1989')

          done()
        })

        cy.get('#date-without-value').type('01-01-1989')
      })

      it('throws when chars is invalid date', function (done) {
        cy.on('fail', (err) => {
          expect(this.logs.length).to.eq(2)
          expect(err.message).to.eq('Typing into a date input with cy.type() requires a valid date with the format \'yyyy-MM-dd\'. You passed: 1989-04-31')

          done()
        })

        cy.get('#date-without-value').type('1989-04-31')
      })
    })

    context('[type=month]', function () {
      it('throws when chars is not a string', function (done) {
        cy.on('fail', (err) => {
          expect(this.logs.length).to.eq(2)
          expect(err.message).to.eq('Typing into a month input with cy.type() requires a valid month with the format \'yyyy-MM\'. You passed: 6')

          done()
        })

        cy.get('#month-without-value').type(6)
      })

      it('throws when chars is invalid format', function (done) {
        cy.on('fail', (err) => {
          expect(this.logs.length).to.eq(2)
          expect(err.message).to.eq('Typing into a month input with cy.type() requires a valid month with the format \'yyyy-MM\'. You passed: 01/2000')

          done()
        })

        cy.get('#month-without-value').type('01/2000')
      })

      it('throws when chars is invalid month', function (done) {
        cy.on('fail', (err) => {
          expect(this.logs.length).to.eq(2)
          expect(err.message).to.eq('Typing into a month input with cy.type() requires a valid month with the format \'yyyy-MM\'. You passed: 1989-13')

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
      }
      )
    }
    )

    // it "throws when chars is invalid format", (done) ->
    //   cy.on "fail", (err) =>
    //     expect(@logs.length).to.eq(2)
    //     expect(err.message).to.eq("Typing into a week input with cy.type() requires a valid week with the format 'yyyy-Www', where W is the literal character 'W' and ww is the week number (00-53). You passed: 2005/W18")
    //     done()

    context('[type=week]', function () {
      it('throws when chars is not a string', function (done) {
        cy.on('fail', (err) => {
          expect(this.logs.length).to.eq(2)
          expect(err.message).to.eq('Typing into a week input with cy.type() requires a valid week with the format \'yyyy-Www\', where W is the literal character \'W\' and ww is the week number (00-53). You passed: 23')

          done()
        })

        cy.get('#week-without-value').type(23)
      })

      it('throws when chars is invalid format', function (done) {
        cy.on('fail', (err) => {
          expect(this.logs.length).to.eq(2)
          expect(err.message).to.eq('Typing into a week input with cy.type() requires a valid week with the format \'yyyy-Www\', where W is the literal character \'W\' and ww is the week number (00-53). You passed: 2005/W18')

          done()
        })

        cy.get('#week-without-value').type('2005/W18')
      })

      it('throws when chars is invalid week', function (done) {
        cy.on('fail', (err) => {
          expect(this.logs.length).to.eq(2)
          expect(err.message).to.eq('Typing into a week input with cy.type() requires a valid week with the format \'yyyy-Www\', where W is the literal character \'W\' and ww is the week number (00-53). You passed: 1995-W60')

          done()
        })

        cy.get('#week-without-value').type('1995-W60')
      })
    })

    context('[type=time]', function () {
      it('throws when chars is not a string', function (done) {
        cy.on('fail', (err) => {
          expect(this.logs.length).to.equal(2)
          expect(err.message).to.equal('Typing into a time input with cy.type() requires a valid time with the format \'HH:mm\', \'HH:mm:ss\' or \'HH:mm:ss.SSS\', where HH is 00-23, mm is 00-59, ss is 00-59, and SSS is 000-999. You passed: 9999')

          done()
        })

        cy.get('#time-without-value').type(9999)
      })

      it('throws when chars is invalid format (1:30)', function (done) {
        cy.on('fail', (err) => {
          expect(this.logs.length).to.equal(2)
          expect(err.message).to.equal('Typing into a time input with cy.type() requires a valid time with the format \'HH:mm\', \'HH:mm:ss\' or \'HH:mm:ss.SSS\', where HH is 00-23, mm is 00-59, ss is 00-59, and SSS is 000-999. You passed: 1:30')

          done()
        })

        cy.get('#time-without-value').type('1:30')
      })

      it('throws when chars is invalid format (01:30pm)', function (done) {
        cy.on('fail', (err) => {
          expect(this.logs.length).to.equal(2)
          expect(err.message).to.equal('Typing into a time input with cy.type() requires a valid time with the format \'HH:mm\', \'HH:mm:ss\' or \'HH:mm:ss.SSS\', where HH is 00-23, mm is 00-59, ss is 00-59, and SSS is 000-999. You passed: 01:30pm')

          done()
        })

        cy.get('#time-without-value').type('01:30pm')
      })

      //# TODO: says, you passed '3'
      it.skip('throws when chars is invalid format (01:30:30.3333)', function (done) {
        cy.on('fail', (err) => {
          expect(this.logs.length).to.equal(2)
          expect(err.message).to.equal('Typing into a time input with cy.type() requires a valid time with the format \'HH:mm\', \'HH:mm:ss\' or \'HH:mm:ss.SSS\', where HH is 00-23, mm is 00-59, ss is 00-59, and SSS is 000-999. You passed: 01:30:30.3333')

          done()
        })

        cy.get('#time-without-value').type('01:30:30.3333')
      })

      it('throws when chars is invalid time', function (done) {
        cy.on('fail', (err) => {
          expect(this.logs.length).to.equal(2)
          expect(err.message).to.equal('Typing into a time input with cy.type() requires a valid time with the format \'HH:mm\', \'HH:mm:ss\' or \'HH:mm:ss.SSS\', where HH is 00-23, mm is 00-59, ss is 00-59, and SSS is 000-999. You passed: 01:60')

          done()
        })

        cy.get('#time-without-value').type('01:60')
      })
    })
  })
  describe('assertion verification', function () {
    beforeEach(function () {
      cy.on('log:added', (attrs, log) => {
        if (log.get('name') === 'assert') {
          this.lastLog = log
        }
      })

      return null
    })

    it('eventually passes the assertion', function () {
      cy.$$('input:first').keyup(function () {
        return _.delay(() => {
          return $(this).addClass('cleared')
        }
        , 100)
      })

      cy.get('input:first').clear().should('have.class', 'cleared').then(function () {
        const { lastLog } = this

        expect(lastLog.get('name')).to.eq('assert')
        expect(lastLog.get('state')).to.eq('passed')

        expect(lastLog.get('ended')).to.be.true
      })
    })

    it('eventually passes the assertion on multiple inputs', function () {
      cy.$$('input').keyup(function () {
        return _.delay(() => {
          return $(this).addClass('cleared')
        }
        , 100)
      })

      cy.get('input').invoke('slice', 0, 2).clear().should('have.class', 'cleared')
    })
  })

  describe('errors', function () {
    beforeEach(function () {
      Cypress.config('defaultCommandTimeout', 100)

      this.logs = []

      cy.on('log:added', (attrs, log) => {
        this.lastLog = log

        return this.logs.push(log)
      })

      return null
    })

    it('throws when not a dom subject', (done) => {
      cy.on('fail', () => {
        done()
      })

      cy.noop({}).clear()
    })

    it('throws when subject is not in the document', (done) => {
      let cleared = 0

      const input = cy.$$('input:first').val('123').keydown(() => {
        cleared += 1

        return input.remove()
      })

      cy.on('fail', (err) => {
        expect(cleared).to.eq(1)
        expect(err.message).to.include('cy.clear() failed because this element')

        done()
      })

      cy.get('input:first').clear().clear()
    })

    it('throws if any subject isnt a textarea or text-like', function (done) {
      cy.on('fail', (err) => {
        const { lastLog } = this

        expect(this.logs.length).to.eq(3)
        expect(lastLog.get('error')).to.eq(err)
        expect(err.message).to.include('cy.clear() failed because it requires a valid clearable element.')
        expect(err.message).to.include('The element cleared was:')
        expect(err.message).to.include('<form id="checkboxes">...</form>')
        expect(err.message).to.include('Cypress considers a \'textarea\', any \'element\' with a \'contenteditable\' attribute, or any \'input\' with a \'type\' attribute of \'text\', \'password\', \'email\', \'number\', \'date\', \'week\', \'month\', \'time\', \'datetime\', \'datetime-local\', \'search\', \'url\', or \'tel\' to be valid clearable elements.')

        done()
      })

      cy.get('textarea:first,form#checkboxes').clear()
    })

    it('throws if any subject isnt a :text', (done) => {
      cy.on('fail', (err) => {
        expect(err.message).to.include('cy.clear() failed because it requires a valid clearable element.')
        expect(err.message).to.include('The element cleared was:')
        expect(err.message).to.include('<div id="dom">...</div>')
        expect(err.message).to.include('Cypress considers a \'textarea\', any \'element\' with a \'contenteditable\' attribute, or any \'input\' with a \'type\' attribute of \'text\', \'password\', \'email\', \'number\', \'date\', \'week\', \'month\', \'time\', \'datetime\', \'datetime-local\', \'search\', \'url\', or \'tel\' to be valid clearable elements.')

        done()
      })

      cy.get('div').clear()
    })

    it('throws on an input radio', (done) => {
      cy.on('fail', (err) => {
        expect(err.message).to.include('cy.clear() failed because it requires a valid clearable element.')
        expect(err.message).to.include('The element cleared was:')
        expect(err.message).to.include('<input type="radio" name="gender" value="male">')
        expect(err.message).to.include('Cypress considers a \'textarea\', any \'element\' with a \'contenteditable\' attribute, or any \'input\' with a \'type\' attribute of \'text\', \'password\', \'email\', \'number\', \'date\', \'week\', \'month\', \'time\', \'datetime\', \'datetime-local\', \'search\', \'url\', or \'tel\' to be valid clearable elements.')

        done()
      })

      cy.get(':radio').clear()
    })

    it('throws on an input checkbox', (done) => {
      cy.on('fail', (err) => {
        expect(err.message).to.include('cy.clear() failed because it requires a valid clearable element.')
        expect(err.message).to.include('The element cleared was:')
        expect(err.message).to.include('<input type="checkbox" name="colors" value="blue">')
        expect(err.message).to.include('Cypress considers a \'textarea\', any \'element\' with a \'contenteditable\' attribute, or any \'input\' with a \'type\' attribute of \'text\', \'password\', \'email\', \'number\', \'date\', \'week\', \'month\', \'time\', \'datetime\', \'datetime-local\', \'search\', \'url\', or \'tel\' to be valid clearable elements.')

        done()
      })

      cy.get(':checkbox').clear()
    })

    it('throws when the subject isnt visible', (done) => {

      cy.on('fail', (err) => {
        expect(err.message).to.include('cy.clear() failed because this element is not visible')

        done()
      })

      cy.get('input:text:first').clear()
    })

    it('throws when subject is disabled', function (done) {
      cy.$$('input:text:first').prop('disabled', true)

      cy.on('fail', (err) => {
        //# get + type logs
        expect(this.logs.length).eq(2)
        expect(err.message).to.include('cy.clear() failed because this element is disabled:\n')

        done()
      })

      cy.get('input:text:first').clear()
    })

    it('logs once when not dom subject', function (done) {
      cy.on('fail', (err) => {
        const { lastLog } = this

        expect(this.logs.length).to.eq(1)
        expect(lastLog.get('error')).to.eq(err)

        done()
      })

      cy.clear()
    })

    it('throws when input cannot be cleared', function (done) {
      $('<input />')
      .attr('id', 'input-covered-in-span')
      .prependTo(cy.$$('body'))

      cy.on('fail', (err) => {
        expect(this.logs.length).to.eq(2)
        expect(err.message).to.include('cy.clear() failed because this element')
        expect(err.message).to.include('is being covered by another element')

        done()
      })

      cy.get('#input-covered-in-span').clear()
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

      cy.get('input:first').clear().should('have.class', 'cleared')
    })

    it('does not log an additional log on failure', function (done) {
      const logs = []

      cy.on('log:added', (attrs, log) => {
        return logs.push(log)
      })

      cy.on('fail', () => {
        expect(this.logs.length).to.eq(3)

        done()
      })

      cy.get('input:first').clear().should('have.class', 'cleared')
    })
  })

  return describe('.log', function () {
    beforeEach(function () {
      cy.on('log:added', (attrs, log) => {
        this.lastLog = log
      })

      return null
    })

    it('logs immediately before resolving', () => {
      const $input = cy.$$('input:first')

      let expected = false

      cy.on('log:added', (attrs, log) => {
        if (log.get('name') === 'clear') {
          expect(log.get('state')).to.eq('pending')
          expect(log.get('$el').get(0)).to.eq($input.get(0))

          expected = true
        }
      })

      cy.get('input:first').clear().then(() => {
        expect(expected).to.be.true
      })
    })

    it.only('ends', () => {
      const logs = []

      cy.on('log:added', (attrs, log) => {
        if (log.get('name') === 'clear') {
          return logs.push(log)
        }
      })

      cy.get('input').invoke('slice', 0, 2).clear().then(() => {
        return _.each(logs, (log) => {
          expect(log.get('state')).to.eq('passed')

          expect(log.get('ended')).to.be.true
        })
      }
      )
    })

    it('snapshots after clicking', () => {
      cy.get('input:first').clear().then(function () {
        const { lastLog } = this

        expect(lastLog.get('snapshots').length).to.eq(1)

        expect(lastLog.get('snapshots')[0]).to.be.an('object')
      })
    }
    )

    it('logs deltaOptions', () => {
      cy.get('input:first').clear({ force: true, timeout: 1000 }).then(function () {
        const { lastLog } = this

        expect(lastLog.get('message')).to.eq('{force: true, timeout: 1000}')

        expect(lastLog.invoke('consoleProps').Options).to.deep.eq({ force: true, timeout: 1000 })
      })
    }
    )
  })
}
