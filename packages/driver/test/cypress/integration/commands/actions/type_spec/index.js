/* eslint arrow-body-style: "off" */
import './hooks'
import { trimInnerText, attachKeyListeners, shouldNotBeCalled } from './utils'
import errors from './errors'
import clear from './clear'
import valueChanging from './value-changing'
const $ = Cypress.$.bind(Cypress)
const { _ } = Cypress

require('debug').enable('driver:*')

const chaiSubset = require('chai-subset')

chai.use(chaiSubset)

Cypress.config('simulatedOnly', true)

describe('src/cy/commands/actions/type', function () {

  context('#type', function () {

    // it('can moveToStart', () => {
    //   const input = cy.$$('input:first')

    //   input.val('foo')

    //   cy.get('input:first').type('{moveToStart}bar')
    //   .should('have.value', 'barfoo')
    // })

    // it('can moveToEnd', () => {
    //   const input = cy.$$('input:first')

    //   input.val('foo')
    //   input[0].focus()
    //   input[0].setSelectionRange(0, 0)

    //   cy.get('input:first').type('{moveToEnd}bar')
    //   .invoke('val').should('eq', 'foobar')
    // })

    // it('can moveToEnd from middle', () => {
    //   const input = cy.$$('input:first')

    //   input.val('foo')

    //   input.get(0).setSelectionRange(1, 1)

    //   cy.get('input:first').type('{moveToEnd}bar')
    //   .invoke('val').should('eq', 'foobar')
    // })

    // it('does not change the subject', () => {
    //   const input = cy.$$('input:first')

    //   cy.get('input:first').type('foo').then(($input) => {
    //     expect($input).to.match(input)
    //   })
    // })

    // it('changes the value', () => {
    //   const input = cy.$$('input:text:first')

    //   input.val('')

    //   //# make sure we are starting from a
    //   //# clean state
    //   expect(input).to.have.value('')

    //   cy.get('input:text:first').type('foo').then(($input) => {
    //     expect($input).to.have.value('foo')
    //   })
    // })

    // it('appends subsequent type commands', () => {
    //   return cy
    //   .get('input:first').type('123').type('456')
    //   .should('have.value', '123456')
    // }
    // )

    // it('appends subsequent commands when value is changed in between', () => {
    //   return cy
    //   .get('input:first')
    //   .type('123')
    //   .then(($input) => {
    //     $input[0].value += '-'

    //     return $input
    //   }).type('456')
    //   .should('have.value', '123-456')
    // }
    // )

    // it('can type numbers', () => {
    //   cy.get(':text:first').type(123).then(($text) => {
    //     expect($text).to.have.value('123')
    //   })
    // }
    // )

    // it('triggers focus event on the input', (done) => {
    //   cy.$$('input:text:first').focus(() => {
    //     done()
    //   })

    //   cy.get('input:text:first').type('bar')
    // })

    // it('lists the input as the focused element', () => {
    //   const $input = cy.$$('input:text:first')

    //   cy.get('input:text:first').type('bar').focused().then(($focused) => {
    //     expect($focused.get(0)).to.eq($input.get(0))
    //   })
    // })

    // it('causes previous input to receive blur', () => {
    //   let blurred = false

    //   cy.$$('input:text:first').blur(() => {
    //     return blurred = true
    //   })

    //   return cy
    //   .get('input:text:first').type('foo')
    //   .get('input:text:last').type('bar')
    //   .then(() => {
    //     expect(blurred).to.be.true
    //   })
    // })

    // it('can type into contenteditable', () => {
    //   const oldText = cy.$$('#contenteditable').get(0).innerText

    //   cy.get('#contenteditable')
    //   .type(' foo')
    //   .then(($div) => {
    //     expect($div.get(0).innerText).to.eq((`${oldText} foo`))
    //   })
    // })

    // it('delays 50ms before resolving', () => {
    //   cy.$$(':text:first').on('change', () => {
    //     return cy.spy(Promise, 'delay')
    //   })

    //   cy.get(':text:first').type('foo{enter}').then(() => {
    //     expect(Promise.delay).to.be.calledWith(50, 'type')
    //   })
    // })

    // it.skip('does not delay on simulated type with no delay option', () => {
    //   cy.$$(':text:first').on('change', () => {
    //     return cy.spy(Promise, 'delay')
    //   })

    //   cy.get(':text:first').type('foo{enter}', { simulated: true }).then(() => {
    //     expect(Promise.delay).not.to.be.called
    //   })
    // })

    // it('increases the timeout delta', () => {
    //   cy.spy(cy, 'timeout')

    //   cy.get(':text:first').type('foo{enter}').then(() => {
    //     expect(cy.timeout).to.be.calledWith(40, true, 'type')

    //     expect(cy.timeout).to.be.calledWith(50, true, 'type')
    //   })
    // })

    // it('accepts body as subject', () => {
    //   cy.get('body').type('foo')
    // })

    // it('does not focus when body is subject', () => {
    //   const bodyClicked = false

    //   cy.$$('body').on('selection')

    //   cy.get('body').type('foo').then(() => {
    //     expect(bodyClicked).to.be.false
    //   })
    // })

    // describe('actionability', () => {
    //   it.skip('can forcibly click even when element is invisible', () => {
    //     const $txt = cy.$$(':text:first').hide()

    //     expect($txt).not.to.have.value('foo')

    //     let clicked = false

    //     $txt.on('click', () => {
    //       return clicked = true
    //     })

    //     cy.get(':text:first').type('foo', { force: true }).then(($input) => {
    //       expect(clicked).to.be.true

    //       expect($input).to.have.value('foo')
    //     })
    //   })

    //   it('can force type on element', () => {
    //     cy.get('input:first').should((input) => {
    //       attachKeyListeners({ input })
    //     })
    //     .type('f', { force: true })

    //     cy.getAll('input', 'textInput', 'keypress').each(shouldBeCalledWithMatch({ data: 'f' }))
    //   })

    //   it('can forcibly type even when element is invisible', () => {
    //     const $txt = cy.$$(':text:first').hide()

    //     expect($txt).not.to.have.value('foo')

    //     const click = cy.stub().as('click')
    //     const keydown = cy.stub().as('keydown')
    //     const textInput = cy.stub().as('textInput')

    //     $txt.on('click', click)
    //     $txt.on('textInput', textInput)
    //     $txt.on('keydown', keydown)

    //     cy.get(':text:first').type('foo', { force: true }).then(($input) => {
    //       expect($input).to.have.value('foo')

    //       expect(click).to.be.calledOnce
    //       expect(keydown).callCount(3)
    //     })
    //   })

    //   it.skip('can forcibly click even when being covered by another element', () => {
    //     const $input = $('<input />')
    //     .attr('id', 'input-covered-in-span')
    //     .css({
    //       width: 50,
    //     })
    //     .prependTo(cy.$$('body'))

    //     let clicked = false

    //     $input.on('click', () => {
    //       return clicked = true
    //     })

    //     cy.get('#input-covered-in-span').type('foo', { force: true }).then(($input) => {
    //       expect(clicked).to.be.true

    //       expect($input).to.have.value('foo')
    //     })
    //   })

    //   it('can forcibly type even when being covered by another element', () => {
    //     $('<input />')
    //     .attr('id', 'input-covered-in-span')
    //     .css({
    //       width: 50,
    //     })
    //     .prependTo(cy.$$('body'))

    //     cy.get('#input-covered-in-span').type('foo', { force: true }).then(($input) => {
    //       expect($input).to.have.value('foo')
    //     })
    //   })

    //   it('waits until element becomes visible', () => {
    //     const $txt = cy.$$(':text:first').hide()

    //     let retried = false

    //     cy.on('command:retry', _.after(3, () => {
    //       $txt.show()
    //       retried = true
    //     })
    //     )

    //     cy.get(':text:first').type('foo').then(() => {
    //       expect(retried).to.be.true
    //     })
    //   })

    //   it.skip('waits until element is no longer disabled', () => {
    //     const $txt = cy.$$(':text:first').prop('disabled', true)

    //     let retried = false
    //     let clicks = 0

    //     $txt.on('click', () => {
    //       return clicks += 1
    //     })

    //     cy.on('command:retry', _.after(3, () => {
    //       $txt.prop('disabled', false)
    //       retried = true
    //     })
    //     )

    //     cy.get(':text:first').type('foo').then(() => {
    //       expect(clicks).to.eq(1)

    //       expect(retried).to.be.true
    //     })
    //   })

    //   it('waits until element is no longer disabled', () => {
    //     const $txt = cy.$$(':text:first').prop('disabled', true)

    //     let retried = false

    //     cy.on('command:retry', _.after(3, () => {
    //       $txt.prop('disabled', false)
    //       retried = true
    //     })
    //     )

    //     cy.get(':text:first').type('foo').then(() => {
    //       expect(retried).to.be.true
    //     })
    //   })

    //   it('waits until element stops animating', () => {
    //     let retries = 0

    //     cy.on('command:retry', () => {
    //       return retries += 1
    //     })

    //     cy.stub(cy, 'ensureElementIsNotAnimating')
    //     .throws(new Error('animating!'))
    //     .onThirdCall().returns()

    //     cy.get(':text:first').type('foo').then(() => {
    //       //# - retry animation coords
    //       //# - retry animation
    //       //# - retry animation
    //       expect(retries).to.eq(3)

    //       expect(cy.ensureElementIsNotAnimating).to.be.calledThrice
    //     })
    //   })

    //   it('does not throw when waiting for animations is disabled', () => {
    //     cy.stub(cy, 'ensureElementIsNotAnimating').throws(new Error('animating!'))
    //     Cypress.config('waitForAnimations', false)

    //     cy.get(':text:first').type('foo').then(() => {
    //       expect(cy.ensureElementIsNotAnimating).not.to.be.called
    //     })
    //   })

    //   it('does not throw when turning off waitForAnimations in options', () => {
    //     cy.stub(cy, 'ensureElementIsNotAnimating').throws(new Error('animating!'))

    //     cy.get(':text:first').type('foo', { waitForAnimations: false }).then(() => {
    //       expect(cy.ensureElementIsNotAnimating).not.to.be.called
    //     })
    //   })

    //   it('passes options.animationDistanceThreshold to cy.ensureElementIsNotAnimating', () => {
    //     const $txt = cy.$$(':text:first')

    //     const { fromWindow } = Cypress.dom.getElementCoordinatesByPosition($txt)

    //     cy.spy(cy, 'ensureElementIsNotAnimating')

    //     cy.get(':text:first').type('foo', { animationDistanceThreshold: 1000 }).then(() => {
    //       const { args } = cy.ensureElementIsNotAnimating.firstCall

    //       expect(args[1]).to.deep.eq([fromWindow, fromWindow])

    //       expect(args[2]).to.eq(1000)
    //     })
    //   })

    //   it('passes config.animationDistanceThreshold to cy.ensureElementIsNotAnimating', () => {
    //     const animationDistanceThreshold = Cypress.config('animationDistanceThreshold')

    //     const $txt = cy.$$(':text:first')

    //     const { fromWindow } = Cypress.dom.getElementCoordinatesByPosition($txt)

    //     cy.spy(cy, 'ensureElementIsNotAnimating')

    //     cy.get(':text:first').type('foo').then(() => {
    //       const { args } = cy.ensureElementIsNotAnimating.firstCall

    //       expect(args[1]).to.deep.eq([fromWindow, fromWindow])

    //       expect(args[2]).to.eq(animationDistanceThreshold)
    //     })
    //   })
    // })

    // describe('input types where no extra formatting required', () => {
    //   return _.each([
    //     'password',
    //     'email',
    //     'number',
    //     'search',
    //     'url',
    //     'tel',
    //   ], (type) => {
    //     it(`accepts input [type=${type}]`, () => {
    //       const input = cy.$$(`<input type='${type}' id='input-type-${type}' />`)

    //       cy.$$('body').append(input)

    //       cy.get(`#input-type-${type}`).type('1234').then(($input) => {
    //         expect($input).to.have.value('1234')

    //         expect($input.get(0)).to.eq($input.get(0))
    //       })
    //     })

    //     it(`accepts type [type=${type}], regardless of capitalization`, () => {
    //       const input = cy.$$(`<input type='${type.toUpperCase()}' id='input-type-${type}' />`)

    //       cy.$$('body').append(input)

    //       cy.get(`#input-type-${type}`).type('1234')
    //     })
    //   })
    // }
    // )

    // describe('tabindex', function () {

    //   it('receives keydown, keyup, keypress', function () {
    //     const div = cy.$$('#tabindex')

    //     attachKeyListeners({ div })

    //     cy.get('#tabindex').type('a')
    //     cy.getAll('div', ['keydown', 'keypress', 'keyup']).each(shouldBeCalled)
    //   })

    //   it('does not receive textInput', function () {
    //     const $div = cy.$$('#tabindex')

    //     let textInput = false

    //     $div.on('textInput', () => {
    //       return textInput = true
    //     })

    //     cy.get('#tabindex').type('f').then(() => {
    //       expect(textInput).to.be.false
    //     })
    //   })

    //   it('does not receive input', function () {
    //     const $div = cy.$$('#tabindex')

    //     let input = false

    //     $div.on('input', () => {
    //       return input = true
    //     })

    //     cy.get('#tabindex').type('f').then(() => {
    //       expect(input).to.be.false
    //     })
    //   })

    //   it('does not receive change event', function () {
    //     const $div = cy.$$('#tabindex')

    //     const innerText = $div.text()

    //     let change = false

    //     $div.on('change', () => {
    //       return change = true
    //     })

    //     cy.get('#tabindex').type('foo{enter}').then(($el) => {
    //       expect(change).to.be.false

    //       expect($el.text()).to.eq(innerText)
    //     })
    //   })

    //   it('does not change inner text', function () {
    //     const $div = cy.$$('#tabindex')

    //     const innerText = $div.text()

    //     cy.get('#tabindex').type('foo{leftarrow}{del}{rightarrow}{enter}').should('have.text', innerText)
    //   })

    //   it('receives focus', function () {
    //     const $div = cy.$$('#tabindex')

    //     let focus = false

    //     $div.focus(() => {
    //       return focus = true
    //     })

    //     cy.get('#tabindex').type('f').then(() => {
    //       expect(focus).to.be.true
    //     })
    //   })

    //   it('receives blur', function () {
    //     const $div = cy.$$('#tabindex')

    //     let blur = false

    //     $div.blur(() => {
    //       return blur = true
    //     })

    //     cy
    //     .get('#tabindex').type('f')
    //     .get('input:first').focus().then(() => {
    //       expect(blur).to.be.true
    //     })
    //   })

    //   it('receives keydown and keyup for other special characters and keypress for enter and regular characters', function () {
    //     const $div = cy.$$('#tabindex')

    //     const keydowns = []
    //     const keyups = []
    //     const keypresses = []

    //     $div.keydown((e) => {
    //       return keydowns.push(e)
    //     })

    //     $div.keypress((e) => {
    //       return keypresses.push(e)
    //     })

    //     $div.keyup((e) => {
    //       return keyups.push(e)
    //     })

    //     cy
    //     .get('#tabindex').type('f{leftarrow}{rightarrow}{enter}')
    //     .then(() => {
    //       expect(keydowns).to.have.length(4)
    //       expect(keypresses).to.have.length(2)

    //       expect(keyups).to.have.length(4)
    //     })
    //   })
    // })

    // describe('delay', () => {
    //   it('adds delay to delta for each key sequence', () => {
    //     cy.spy(cy, 'timeout')

    //     cy
    //     .get(':text:first')
    //     .type('foo{enter}bar{leftarrow}', { delay: 5 })
    //     .then(() => {
    //       expect(cy.timeout).to.be.calledWith(5 * 8, true, 'type')
    //     })
    //   })

    //   it('can cancel additional keystrokes', (done) => {
    //     cy.stub(Cypress.runner, 'stop')

    //     const text = cy.$$(':text:first').keydown(_.after(3, () => {
    //       return Cypress.stop()
    //     })
    //     )

    //     cy.on('stop', () => {
    //       return _.delay(() => {
    //         expect(text).to.have.value('foo')

    //         done()
    //       }
    //       , 50)
    //     })

    //     cy.get(':text:first').type('foo{enter}bar{leftarrow}')
    //   })
    // })

    // describe('maxlength', () => {
    //   it('limits text entered to the maxlength attribute of a text input', () => {
    //     const $input = cy.$$(':text:first')

    //     $input.attr('maxlength', 5)

    //     cy.get(':text:first')
    //     .type('1234567890')
    //     .then((input) => {
    //       expect(input).to.have.value('12345')
    //     })
    //   })

    //   it('ignores an invalid maxlength attribute', () => {
    //     const $input = cy.$$(':text:first')

    //     $input.attr('maxlength', 'five')

    //     cy.get(':text:first')
    //     .type('1234567890')
    //     .then((input) => {
    //       expect(input).to.have.value('1234567890')
    //     })
    //   })

    //   it('handles special characters', () => {
    //     const $input = cy.$$(':text:first')

    //     $input.attr('maxlength', 5)

    //     cy.get(':text:first')
    //     .type('12{selectall}')
    //     .then((input) => {
    //       expect(input).to.have.value('12')
    //     })
    //   })

    //   it('maxlength=0 events', () => {
    //     const events = []

    //     const push = (evt) => {
    //       return () => {
    //         events.push(evt)
    //       }
    //     }

    //     cy
    //     .$$(':text:first')
    //     .attr('maxlength', 0)
    //     .on('keydown', push('keydown'))
    //     .on('keypress', push('keypress'))
    //     .on('textInput', push('textInput'))
    //     .on('input', push('input'))
    //     .on('keyup', push('keyup'))

    //     cy.get(':text:first')
    //     .type('1') //, { simulated: false })
    //     .then(() => {
    //       expect(events).to.deep.eq(['keydown', 'keypress', 'textInput', 'keyup'])
    //     }
    //     )
    //   })

    //   it('maxlength=1 events', () => {
    //     const events = []

    //     const push = (evt) => {
    //       return () => {
    //         events.push(evt)
    //       }
    //     }

    //     cy
    //     .$$(':text:first')
    //     .attr('maxlength', 1)
    //     .on('keydown', push('keydown'))
    //     .on('keypress', push('keypress'))
    //     .on('textInput', push('textInput'))
    //     .on('input', push('input'))
    //     .on('keyup', push('keyup'))

    //     cy.get(':text:first')
    //     .type('12')
    //     .then(() => {
    //       expect(events).to.deep.eq([
    //         'keydown', 'keypress', 'textInput', 'input', 'keyup',
    //         'keydown', 'keypress', 'textInput', 'keyup',
    //       ])
    //     }
    //     )
    //   })
    // })

    valueChanging()

    // specialChars()

    describe('modifiers', function () {

      describe('activating modifiers', () => {

        it('sends keydown event for modifiers in order', (done) => {
          const $input = cy.$$('input:text:first')
          const events = []

          $input.on('keydown', (e) => {
            events.push(e)
          })

          const handleKeyup = cy.stub().as('keyup')

          $input.on('keyup', handleKeyup)

          cy.get('input:text:first').type('{shift}{ctrl}')
          .then(() => {
            expect(events[0].shiftKey).to.be.true
            expect(events[0].which).to.equal(16)
            expect(handleKeyup.firstCall.args[0].shiftKey).eq(false)

            expect(events[1].ctrlKey).to.be.true
            expect(events[1].which).to.equal(17)
            expect(handleKeyup.lastCall.args[0].ctrlKey).eq(false)

            $input.off('keydown')

            done()
          })
        })

        it('maintains modifiers for subsequent characters', (done) => {
          const $input = cy.$$('input:text:first')
          const events = []

          $input.on('keydown', (e) => {
            events.push(e)
          })

          cy.get('input:text:first').type('{command}{control}ok').then(() => {
            expect(events[2].metaKey).to.be.true
            expect(events[2].ctrlKey).to.be.true
            expect(events[2].which).to.equal(79)

            expect(events[3].metaKey).to.be.true
            expect(events[3].ctrlKey).to.be.true
            expect(events[3].which).to.equal(75)

            $input.off('keydown')

            done()
          })
        })

        it('does not maintain modifiers for subsequent type commands', (done) => {
          const $input = cy.$$('input:text:first')
          const events = []

          $input.on('keydown', (e) => {
            events.push(e)
          })

          cy
          .get('input:text:first')
          .type('{command}{control}')
          .type('ok')
          .then(() => {
            expect(events[2].metaKey).to.be.false
            expect(events[2].ctrlKey).to.be.false
            expect(events[2].which).to.equal(79)

            expect(events[3].metaKey).to.be.false
            expect(events[3].ctrlKey).to.be.false
            expect(events[3].which).to.equal(75)

            $input.off('keydown')

            done()
          })

        })
        it('does not type characters when any modifier besides Shift is active', () => {
          const $input = cy.$$('input:first')

          attachKeyListeners({ $input })

          cy.get('input:first').focus()
          .type('{alt}m{enter}', { simulated: true })

          cy.getAll('$input', ['input', 'textInput', 'change', 'keypress']).each(shouldNotBeCalled)

        })
        it('does not fire change when modifier + enter', () => {
          const $input = cy.$$('input:first')

          attachKeyListeners({ $input })

          cy.get('input:first').focus()
          .type('m{alt}{enter}')//, { simulated: false })

          cy.getAll('$input', ['change']).each(shouldNotBeCalled)

        })
        it('does not fire textInput when modifier', () => {
          const $input = cy.$$('input:first')

          attachKeyListeners({ $input })

          cy.get('input:first').focus()
          .type('{alt}', { simulated: true })

          cy.getAll('$input', ['textInput']).each(shouldNotBeCalled)

        })

        it('can use document.execCommand(\'copy\') on native keydown event', function () {
          if (Cypress.config('simulatedOnly')) this.skip()

          cy.$$('input:first')[0].addEventListener('keydown', () => {
            const worked = cy.state('document').execCommand('copy')

            expect(worked).to.be.true
          })

          cy.get('input:first').type('f')
        })

        it('cannot use document.execCommand(\'copy\') on simulated(forced) keydown event', () => {
          if (!Cypress.config('simulatedOnly')) this.skip()

          cy.$$('input:first')[0].addEventListener('keydown', () => {
            const worked = cy.state('document').execCommand('copy')

            expect(worked).to.be.false
          })

          cy.get('input:first').type('f')
        })

        it('does not maintain modifiers for subsequent click commands', (done) => {
          const $button = cy.$$('button:first')
          let mouseDownEvent = null
          let mouseUpEvent = null
          let clickEvent = null

          $button.on('mousedown', (e) => {
            return mouseDownEvent = e
          })
          $button.on('mouseup', (e) => {
            return mouseUpEvent = e
          })
          $button.on('click', (e) => {
            return clickEvent = e
          })

          cy
          .get('input:text:first')
          .type('{cmd}{option}')
          .get('button:first').click().then(() => {
            expect(mouseDownEvent.metaKey).to.be.false
            expect(mouseDownEvent.altKey).to.be.false

            expect(mouseUpEvent.metaKey).to.be.false
            expect(mouseUpEvent.altKey).to.be.false

            expect(clickEvent.metaKey).to.be.false
            expect(clickEvent.altKey).to.be.false

            $button.off('mousedown')
            $button.off('mouseup')
            $button.off('click')

            done()
          })
        })

        it('sends keyup event for activated modifiers when typing is finished', (done) => {
          const $input = cy.$$('input:text:first')
          const events = []

          $input.on('keyup', cy.stub().callsFake((e) => {
            events.push(e)

          }))

          cy
          .get('input:text:first')
          .type('{alt}{ctrl}{meta}{shift}ok', { force: true })
          .then(() => {
            // first keyups should be for the chars typed, "ok"
            expect(events[0].which).to.equal(79)
            expect(events[1].which).to.equal(75)

            expect(events[2].which).to.equal(18)
            expect(events[3].which).to.equal(17)
            expect(events[4].which).to.equal(91)
            expect(events[5].which).to.equal(16)

            $input.off('keyup')

            done()
          })
        })

      })

      describe('release: false', () => {

        it('maintains modifiers for subsequent type commands', (done) => {
          const $input = cy.$$('input:text:first')
          const events = []

          $input.on('keydown', (e) => {
            events.push(e)
          })

          cy
          .get('input:text:first')
          .type('{command}{control}', { release: false })
          .type('ok')
          .then(() => {
            expect(events[2].metaKey).to.be.true
            expect(events[2].ctrlKey).to.be.true
            expect(events[2].which).to.equal(79)

            expect(events[3].metaKey).to.be.true
            expect(events[3].ctrlKey).to.be.true
            expect(events[3].which).to.equal(75)

            done()
          })
        })

        it('maintains modifiers for subsequent click commands', (done) => {
          const $button = cy.$$('button:first')
          let mouseDownEvent = null
          let mouseUpEvent = null
          let clickEvent = null

          $button.on('mousedown', (e) => {
            return mouseDownEvent = e
          })
          $button.on('mouseup', (e) => {
            return mouseUpEvent = e
          })
          $button.on('click', (e) => {
            return clickEvent = e
          })

          cy
          .get('input:text:first')
          .type('{meta}{alt}', { release: false })
          .get('button:first').click().then(() => {
            expect(mouseDownEvent.metaKey).to.be.true
            expect(mouseDownEvent.altKey).to.be.true

            expect(mouseUpEvent.metaKey).to.be.true
            expect(mouseUpEvent.altKey).to.be.true

            expect(clickEvent.metaKey).to.be.true
            expect(clickEvent.altKey).to.be.true

            done()
          })
        })

        it('resets modifiers before next test', () => {
          //# this test will fail if you comment out
          //# $Keyboard.resetModifiers

          const $input = cy.$$('input:text:first')
          const events = []

          $input.on('keyup', (e) => {
            events.push(e)
          })

          cy
          .get('input:text:first')
          .type('a', { release: false })
          .then(() => {
            expect(events[0].metaKey).to.be.false
            expect(events[0].ctrlKey).to.be.false

            expect(events[0].altKey).to.be.false
          })
        })
      })

      return describe('changing modifiers', function () {
        beforeEach(function () {
          this.$input = cy.$$('input:text:first')

          cy.get('input:text:first').type('{command}{option}', { release: false })
        })

        afterEach(function () {
          return this.$input.off('keydown')
        })

        it('sends keydown event for new modifiers', function () {
          const spy = cy.spy().as('keydown')

          this.$input.on('keydown', spy)

          cy.get('input:text:first').type('{shift}').then(() => {
            expect(spy).to.be.calledWithMatch({ which: 16 })
          })
        })

        it('does not send keydown event for already activated modifiers', function () {
          const spy = cy.spy().as('keydown')

          this.$input.on('keydown', spy)

          cy.get('input:text:first').type('{cmd}{alt}')//, {simulated:false})
          .then(() => {
            expect(spy).to.not.be.called
          })
        })
      })
    })

    describe('case-insensitivity', () => {

      it('special chars are case-insensitive', () => {
        cy.get(':text:first').invoke('val', 'bar').type('{leftarrow}{DeL}').then(($input) => {
          expect($input).to.have.value('ba')
        })
      })

      it('modifiers are case-insensitive', (done) => {
        const $input = cy.$$('input:text:first')
        let alt = false

        $input.on('keydown', (e) => {
          if (e.altKey) {
            alt = true
          }
        })

        cy.get('input:text:first').type('{aLt}').then(() => {
          expect(alt).to.be.true

          $input.off('keydown')

          done()
        })
      })

      it('letters are case-sensitive', () => {
        cy.get('input:text:first').type('FoO').then(($input) => {
          expect($input).to.have.value('FoO')
        })
      })
    })

    describe('caret position', function () {

      it('respects being formatted by input event handlers')

      it('accurately returns host contenteditable attr', () => {
        const hostEl = cy.$$('<div contenteditable><div id="ce-inner1">foo</div></div>').appendTo(cy.$$('body'))

        cy.get('#ce-inner1').then(($el) => {
          expect(Cypress.dom.getHostContenteditable($el[0])).to.eq(hostEl[0])
        })
      })

      it('accurately returns host contenteditable=true attr', () => {
        const hostEl = cy.$$('<div contenteditable="true"><div id="ce-inner1">foo</div></div>').appendTo(cy.$$('body'))

        cy.get('#ce-inner1').then(($el) => {
          expect(Cypress.dom.getHostContenteditable($el[0])).to.eq(hostEl[0])
        })
      })

      it('accurately returns host contenteditable="" attr', () => {
        const hostEl = cy.$$('<div contenteditable=""><div id="ce-inner1">foo</div></div>').appendTo(cy.$$('body'))

        cy.get('#ce-inner1').then(($el) => {
          expect(Cypress.dom.getHostContenteditable($el[0])).to.eq(hostEl[0])
        })
      })

      it('accurately returns host contenteditable="foo" attr', () => {
        const hostEl = cy.$$('<div contenteditable="foo"><div id="ce-inner1">foo</div></div>').appendTo(cy.$$('body'))

        cy.get('#ce-inner1').then(($el) => {
          expect(Cypress.dom.getHostContenteditable($el[0])).to.eq(hostEl[0])
        })
      })
      it('accurately returns same el with no falsey contenteditable="false" attr', () => {
        cy.$$('<div contenteditable="false"><div id="ce-inner1">foo</div></div>').appendTo(cy.$$('body'))

        cy.get('#ce-inner1').then(($el) => {
          expect(Cypress.dom.getHostContenteditable($el[0])).to.eq($el[0])
        })
      })

      it('can arrow from maxlength', () => {
        cy.get('input:first').invoke('attr', 'maxlength', '5').type('foobar{leftarrow}')

        cy.window().then(() => {
          expect(Cypress.dom.getSelectionBounds(Cypress.$('input:first').get(0)))
          .to.deep.eq({ start: 4, end: 4 })
        })
      })

      it('won\'t arrowright past length', () => {
        cy.get('input:first').type('foo{rightarrow}{rightarrow}{rightarrow}bar{rightarrow}')

        cy.window().then(() => {
          expect(Cypress.dom.getSelectionBounds(Cypress.$('input:first').get(0)))
          .to.deep.eq({ start: 6, end: 6 })
        })
      })

      it('won\'t arrowleft before word', () => {
        cy.get('input:first').type(`oo{leftarrow}{leftarrow}{leftarrow}f${'{leftarrow}'.repeat(5)}`)

        cy.window().then(() => {
          expect(Cypress.dom.getSelectionBounds(Cypress.$('input:first').get(0)))
          .to.deep.eq({ start: 0, end: 0 })
        })
      })

      it('leaves caret at the end of contenteditable', () => {
        cy.get('[contenteditable]:first').type('foobar')

        cy.window().then(() => {
          expect(Cypress.dom.getSelectionBounds(Cypress.$('[contenteditable]:first').get(0)))
          .to.deep.eq({ start: 6, end: 6 })
        })
      })

      it('leaves caret at the end of contenteditable when prefilled', () => {
        const $el = cy.$$('[contenteditable]:first')
        const el = $el.get(0)

        el.innerHTML = 'foo'
        cy.get('[contenteditable]:first').type('bar')

        cy.window().then(() => {
          expect(Cypress.dom.getSelectionBounds(Cypress.$('[contenteditable]:first').get(0)))
          .to.deep.eq({ start: 6, end: 6 })
        })
      })

      it('can move the caret left on contenteditable', () => {
        cy.get('[contenteditable]:first').type('foo{leftarrow}{leftarrow}')

        cy.window().then(() => {
          expect(Cypress.dom.getSelectionBounds(Cypress.$('[contenteditable]:first').get(0)))
          .to.deep.eq({ start: 1, end: 1 })
        })
      })

      //#make sure caret is correct
      //# type left left
      //# make sure caret correct
      //# text is fboo
      //# fix input-mask issue

      it('leaves caret at the end of input', () => {
        cy.get(':text:first').type('foobar')

        cy.window().then(() => {
          expect(Cypress.dom.getSelectionBounds(Cypress.$(':text:first').get(0)))
          .to.deep.eq({ start: 6, end: 6 })
        })
      })

      it('leaves caret at the end of textarea', () => {
        cy.get('#comments').type('foobar')

        cy.window().then(() => {
          expect(Cypress.dom.getSelectionBounds(Cypress.$('#comments').get(0)))
          .to.deep.eq({ start: 6, end: 6 })
        })
      })

      it('can wrap cursor to next line in [contenteditable] with {rightarrow}', () => {
        const $el = cy.$$('[contenteditable]:first')
        const el = $el.get(0)

        el.innerHTML = 'start' +
          '<div>middle</div>' +
          '<div>end</div>'

        cy.get('[contenteditable]:first')
        //# move cursor to beginning of div
        .type('{selectall}{leftarrow}')
        .type(`${'{rightarrow}'.repeat(14)}[_I_]`).then(($el) => {
          expect(trimInnerText($el)).to.eql('start\nmiddle\ne[_I_]nd')
        })
      })

      it('can wrap cursor to prev line in [contenteditable] with {leftarrow}', () => {
        const $el = cy.$$('[contenteditable]:first')
        const el = $el.get(0)

        el.innerHTML = 'start' +
          '<div>middle</div>' +
          '<div>end</div>'

        cy.get('[contenteditable]:first').type(`${'{leftarrow}'.repeat(12)}[_I_]`).then(($el) => {
          expect(trimInnerText($el)).to.eql('star[_I_]t\nmiddle\nend')
        })
      })

      it('can wrap cursor to next line in [contenteditable] with {rightarrow} and empty lines', function () {
        const $el = cy.$$('[contenteditable]:first')
        const el = $el.get(0)

        el.innerHTML = `${'<div><br></div>'.repeat(4)}<div>end</div>`

        const newLines = '\n\n\n'.repeat(this.multiplierNumNewLines)

        cy.get('[contenteditable]:first')
        .type('{selectall}{leftarrow}')
        .type(`foobar${'{rightarrow}'.repeat(6)}[_I_]`).then(() => {
          expect(trimInnerText($el)).to.eql(`foobar${newLines}\nen[_I_]d`)
        })
      })

      it('can use {rightarrow} and nested elements', () => {
        const $el = cy.$$('[contenteditable]:first')
        const el = $el.get(0)

        el.innerHTML = '<div><b>s</b>ta<b>rt</b></div>'

        cy.get('[contenteditable]:first')
        .type('{selectall}{leftarrow}')
        .type(`${'{rightarrow}'.repeat(3)}[_I_]`).then(() => {
          expect(trimInnerText($el)).to.eql('sta[_I_]rt')
        })
      })

      it('enter and \\n should act the same for [contenteditable]', () => {
        //# non breaking white space
        const cleanseText = (text) => {
          return text.split('\u00a0').join(' ')
        }

        const expectMatchInnerText = ($el, innerText) => {
          expect(cleanseText(trimInnerText($el))).to.eql(innerText)
        }

        //# NOTE: this may only pass in Chrome since the whitespace may be different in other browsers
        //#  even if actual and expected appear the same.
        const expected = '{\n  foo:   1\n  bar:   2\n  baz:   3\n}'

        cy.get('[contenteditable]:first')
        .invoke('html', '<div><br></div>')
        .type('{{}{enter}  foo:   1{enter}  bar:   2{enter}  baz:   3{enter}}')
        .should(($el) => {
          expectMatchInnerText($el, expected)
        }).clear()
        .type('{{}\n  foo:   1\n  bar:   2\n  baz:   3\n}')
        .should(($el) => {
          expectMatchInnerText($el, expected)
        })
      })

      it('enter and \\n should act the same for textarea', () => {
        const expected = '{\n  foo:   1\n  bar:   2\n  baz:   3\n}'

        cy.get('textarea:first')
        .clear()
        .type('{{}{enter}  foo:   1{enter}  bar:   2{enter}  baz:   3{enter}}')
        .should('have.prop', 'value', expected)
        .clear()
        .type('{{}\n  foo:   1\n  bar:   2\n  baz:   3\n}')
        .should('have.prop', 'value', expected)
      })
    })

    //# TODO: no issues ask for features such as {spacebar} in checkbox
    //# context "native interactable elements"

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
            return $(this).addClass('typed')
          }
          , 100)
        })

        cy.get('input:first').type('f').should('have.class', 'typed').then(function () {
          const { lastLog } = this

          expect(lastLog.get('name')).to.eq('assert')
          expect(lastLog.get('state')).to.eq('passed')

          expect(lastLog.get('ended')).to.be.true
        })
      })
    })

    describe('.log', function () {
      beforeEach(function () {
        cy.on('log:added', (attrs, log) => {
          this.lastLog = log
        })

        return null
      })

      it('passes in $el', () => {
        cy.get('input:first').type('foobar').then(function ($input) {
          const { lastLog } = this

          expect(lastLog.get('$el')).to.eq($input)
        })
      })

      it('logs message', () => {
        cy.get(':text:first').type('foobar').then(function () {
          const { lastLog } = this

          expect(lastLog.get('message')).to.eq('foobar')
        })
      })

      it('logs delay arguments', () => {
        cy.get(':text:first').type('foo', { delay: 20 }).then(function () {
          const { lastLog } = this

          expect(lastLog.get('message')).to.eq('foo, {delay: 20}')
        })
      })

      it('clones textarea value after the type happens', () => {
        const expectToHaveValueAndCoords = () => {
          const cmd = cy.queue.find({ name: 'type' })
          const log = cmd.get('logs')[0]
          const txt = log.get('snapshots')[1].body.find('#comments')

          expect(txt).to.have.value('foobarbaz')

          expect(log.get('coords')).to.be.ok
        }

        cy
        .get('#comments').type('foobarbaz').then(() => {
          expectToHaveValueAndCoords()
        }).get('#comments').clear().type('onetwothree').then(() => {
          expectToHaveValueAndCoords()
        })
      })

      it('clones textarea value when textarea is focused first', () => {
        const expectToHaveValueAndNoCoords = () => {
          const cmd = cy.queue.find({ name: 'type' })
          const log = cmd.get('logs')[0]
          const txt = log.get('snapshots')[1].body.find('#comments')

          expect(txt).to.have.value('foobarbaz')

          expect(log.get('coords')).not.to.be.ok
        }

        cy
        .get('#comments').focus().type('foobarbaz').then(() => {
          expectToHaveValueAndNoCoords()
        }).get('#comments').clear().type('onetwothree').then(() => {
          expectToHaveValueAndNoCoords()
        })
      })

      it('logs only one type event', () => {
        const logs = []
        const types = []

        cy.on('log:added', (attrs, log) => {
          logs.push(log)
          if (log.get('name') === 'type') {
            return types.push(log)
          }
        })

        cy.get(':text:first').type('foo').then(() => {
          expect(logs.length).to.eq(2)

          expect(types.length).to.eq(1)
        })
      })

      it('logs immediately before resolving', () => {
        const $txt = cy.$$(':text:first')

        cy.on('log:added', (attrs, log) => {
          if (log.get('name') === 'type') {
            expect(log.get('state')).to.eq('pending')
            expect(log.get('$el').get(0)).to.eq($txt.get(0))

          }
        })

        cy.get(':text:first').type('foo').then(() => { })

        cy.get(':text:first').type('foo')
      })

      it('snapshots before typing', function () {
        let expected = false

        cy.$$(':text:first').one('keydown', () => {
          const { lastLog } = this

          expect(lastLog.get('snapshots').length).to.eq(1)
          expect(lastLog.get('snapshots')[0].name).to.eq('before')
          expect(lastLog.get('snapshots')[0].body).to.be.an('object')

          expected = true
        })

        cy.get(':text:first').type('foo').then(() => {
          expect(expected).to.be.true
        })
      })

      it('snapshots after typing', () => {
        cy.get(':text:first').type('foo').then(function () {
          const { lastLog } = this

          expect(lastLog.get('snapshots').length).to.eq(2)
          expect(lastLog.get('snapshots')[1].name).to.eq('after')

          expect(lastLog.get('snapshots')[1].body).to.be.an('object')
        })
      })

      it('logs deltaOptions', () => {
        cy.get(':text:first').type('foo', { force: true, timeout: 1000 }).then(function () {
          const { lastLog } = this

          expect(lastLog.get('message')).to.eq('foo, {force: true, timeout: 1000}')

          expect(lastLog.invoke('consoleProps').Options).to.deep.eq({ force: true, timeout: 1000 })
        })
      })

      context('#consoleProps', function () {
        it('has all of the regular options', () => {
          cy.get('input:first').type('foobar').then(function ($input) {
            const { fromWindow } = Cypress.dom.getElementCoordinatesByPosition($input)
            const console = this.lastLog.invoke('consoleProps')

            expect(console.Command).to.eq('type')
            expect(console.Typed).to.eq('foobar')
            expect(console['Applied To']).to.eq($input.get(0))
            expect(console.Coords.x).to.be.closeTo(fromWindow.x, 1)

            expect(console.Coords.y).to.be.closeTo(fromWindow.y, 1)
          })
        })

        it('has a table of keys', () => {
          // cy.get(':text:first').type('foooooo', {simulated: true})

          cy.get(':text:first').type('{cmd}{option}foo{enter}b{leftarrow}{del}{enter}', { simulated: true })
          .then(function () {
            const table = this.lastLog.invoke('consoleProps').table[3]()

            expect(table.columns).to.deep.eq(['typed', 'which', 'keydown', 'keypress', 'textInput', 'input', 'keyup', 'change', 'modifiers'])
            expect(table.name).to.eq('Keyboard Events')
            const expectedTable = {
              1: { typed: 'Meta', which: 91, keydown: true, modifiers: 'meta' },
              2: { typed: 'Alt', which: 18, keydown: true, modifiers: 'alt, meta' },
              3: { typed: 'f', which: 70, keydown: true, keyup: true, modifiers: 'alt, meta' },
              4: { typed: 'o', which: 79, keydown: true, keyup: true, modifiers: 'alt, meta' },
              5: { typed: 'o', which: 79, keydown: true, keyup: true, modifiers: 'alt, meta' },
              6: { typed: 'Enter', which: 13, keydown: true, keyup: true, modifiers: 'alt, meta' },
              7: { typed: 'b', which: 66, keydown: true, keyup: true, modifiers: 'alt, meta' },
              8: { typed: 'ArrowLeft', which: 37, keydown: true, keyup: true, modifiers: 'alt, meta' },
              9: { typed: 'Delete', which: 46, keydown: true, keyup: true, modifiers: 'alt, meta' },
              10: { typed: 'Enter', which: 13, keydown: true, keyup: true, modifiers: 'alt, meta' },
            }

            expect(table.data).to.deep.eq(expectedTable)
          })
        })

        // table.data.forEach (item, i) ->
        //   expect(item).to.deep.eq(expectedTable[i])

        // expect(table.data).to.deep.eq(expectedTable)

        it('has no modifiers when there are none activated', () => {
          cy.get(':text:first').type('f', { simulated: true }).then(function () {
            const table = this.lastLog.invoke('consoleProps').table[3]()

            expect(table.data).to.deep.eq({
              1: { typed: 'f', which: 70, keydown: true, keypress: true, textInput: true, input: true, keyup: true },
            })
          })
        })

        it('has a table of keys with preventedDefault', function () {
          cy.$$(':text:first').keydown(() => {
            return false
          })

          cy.get(':text:first').type('f', { simulated: true }).then(function () {
            const table = this.lastLog.invoke('consoleProps').table[3]()

            expect(table.data).to.deep.eq({
              1: { typed: 'f', which: 70, keydown: 'preventedDefault', keyup: true },
            })
          })
        })
      })
    })

    errors()
  })
  clear()
})

/*
copy(cy.$$('.test.runnable-failed .runnable-title', window.top.document).contents().filter((i,e)=>e.nodeType===3).map((i,e)=>e.nodeValue).toArray().join('\n'))

*/
