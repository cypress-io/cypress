const { assertLogLength } = require('../../../support/utils')

// Every chai-jQuery assertion routes a non-DOM subject through the same guard in
// `assertDom` (packages/driver/src/cypress/assertions/assert.ts), which fails the
// assertion and names both the method and the subject it was handed.
const nonDomCases = [
  {
    name: 'data',
    subject: {},
    assertion: (obj) => expect(obj).to.have.data('foo'),
    method: 'data',
    inspected: '{}',
    // the one assertion whose message this suite doesn't pin down
    logMessage: null,
  },
  {
    name: 'class',
    subject: 'foo',
    assertion: (obj) => expect(obj).to.have.class('bar'),
    method: 'class',
    inspected: 'foo',
    logMessage: `expected 'foo' to have class 'bar'`,
  },
  {
    name: 'id',
    subject: [],
    assertion: (obj) => expect(obj).to.have.id('foo'),
    method: 'id',
    inspected: '[]',
    logMessage: `expected [] to have id 'foo'`,
  },
  {
    name: 'html',
    subject: null,
    assertion: (obj) => expect(obj).to.have.html('foo'),
    method: 'html',
    inspected: 'null',
    logMessage: `expected null to have HTML 'foo'`,
  },
  {
    name: 'text',
    subject: undefined,
    assertion: (obj) => expect(obj).to.have.text('foo'),
    method: 'text',
    inspected: 'undefined',
    logMessage: `expected undefined to have text 'foo'`,
  },
  {
    name: 'value',
    subject: {},
    assertion: (obj) => expect(obj).to.have.value('foo'),
    method: 'value',
    inspected: '{}',
    logMessage: `expected {} to have value 'foo'`,
  },
  {
    name: 'descendants',
    subject: {},
    assertion: (obj) => expect(obj).to.have.descendants('foo'),
    method: 'descendants',
    inspected: '{}',
    logMessage: `expected {} to have descendants 'foo'`,
  },
  {
    name: 'visible',
    subject: {},
    assertion: (obj) => expect(obj).to.be.visible,
    method: 'visible',
    inspected: '{}',
    logMessage: `expected {} to be 'visible'`,
  },
  {
    name: 'hidden',
    subject: {},
    assertion: (obj) => expect(obj).to.be.hidden,
    method: 'hidden',
    inspected: '{}',
    logMessage: `expected {} to be 'hidden'`,
  },
  {
    name: 'selected',
    subject: {},
    assertion: (obj) => expect(obj).to.be.selected,
    method: 'selected',
    inspected: '{}',
    logMessage: `expected {} to be 'selected'`,
  },
  {
    name: 'checked',
    subject: {},
    assertion: (obj) => expect(obj).to.be.checked,
    method: 'checked',
    inspected: '{}',
    logMessage: `expected {} to be 'checked'`,
  },
  {
    name: 'enabled',
    subject: {},
    assertion: (obj) => expect(obj).to.be.enabled,
    method: 'enabled',
    inspected: '{}',
    logMessage: `expected {} to be 'enabled'`,
  },
  {
    name: 'disabled',
    subject: {},
    assertion: (obj) => expect(obj).to.be.disabled,
    method: 'disabled',
    inspected: '{}',
    logMessage: `expected {} to be 'disabled'`,
  },
  {
    name: 'focused',
    subject: {},
    assertion: (obj) => expect(obj).to.have.focus,
    // `focus` and `focused` are separate chainers onto the same assertion, and
    // the error names the one that was called
    method: 'focus',
    inspected: '{}',
    logMessage: `expected {} to be 'focused'`,
    partialLogMessage: true,
  },
  {
    name: 'attr',
    subject: {},
    assertion: (obj) => expect(obj).to.have.attr('foo'),
    method: 'attr',
    inspected: '{}',
    logMessage: `expected {} to have attribute 'foo'`,
  },
  {
    name: 'prop',
    subject: {},
    assertion: (obj) => expect(obj).to.have.prop('foo'),
    method: 'prop',
    inspected: '{}',
    logMessage: `expected {} to have property 'foo'`,
  },
  {
    name: 'css',
    subject: {},
    assertion: (obj) => expect(obj).to.have.css('foo'),
    method: 'css',
    inspected: '{}',
    logMessage: `expected {} to have CSS property 'foo'`,
  },
]

describe('src/cy/commands/assertions', () => {
  beforeEach(function () {
    cy.visit('/fixtures/jquery.html')
  })

  context('chai plugins', () => {
    beforeEach(function () {
      this.logs = []

      cy.on('log:added', (attrs, log) => {
        this.logs?.push(log)
      })

      return null
    })

    context('non-DOM subjects', () => {
      nonDomCases.forEach(({ name, subject, assertion, method, inspected, logMessage, partialLogMessage }) => {
        it(`throws when obj is not DOM: ${name}`, function (done) {
          cy.on('fail', (err) => {
            assertLogLength(this.logs, 1)

            const message = this.logs[0].get('error').message

            if (logMessage === null) {
              expect(message).to.be.ok
            } else if (partialLogMessage) {
              expect(message).to.contain(logMessage)
            } else {
              expect(message).to.eq(logMessage)
            }

            expect(err.message).to.include(`> ${method}`)
            expect(err.message).to.include(`> ${inspected}`)

            done()
          })

          assertion(subject)
        })
      })
    })
  })
})
