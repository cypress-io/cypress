require('../../../spec_helper')

const _ = require('lodash')
const validateEvent = require('../../../../lib/plugins/child/validate_event')

const events = [
  ['file:preprocessor', 'a function', () => {}],
  ['before:browser:launch', 'a function', () => {}],
  ['after:screenshot', 'a function', () => {}],
  ['task', 'an object', {}],
]

describe('lib/plugins/child/validate_event', () => {
  it('returns error when called with no event name', () => {
    const { isValid, error } = validateEvent()

    expect(isValid).to.be.false
    expect(error.message).to.equal(`You must pass a valid event name when registering a plugin.

You passed: \`undefined\`

The following are valid events:
- after:screenshot
- before:browser:launch
- file:preprocessor
- task
`)
  })

  it('returns error when called with no event handler', () => {
    const { isValid, error } = validateEvent('file:preprocessor')

    expect(isValid).to.be.false
    expect(error.message).to.equal('The handler for the event `file:preprocessor` must be a function')
  })

  it('returns error when called with unsupported event name', () => {
    const { isValid, error } = validateEvent('invalid:event:name', {})

    expect(isValid).to.be.false
    expect(error.message).to.equal(`You must pass a valid event name when registering a plugin.

You passed: \`invalid:event:name\`

The following are valid events:
- after:screenshot
- before:browser:launch
- file:preprocessor
- task
`)
  })

  _.each(events, ([event, type]) => {
    it(`returns error when event handler of ${event} is not ${type}`, () => {
      const { isValid, error } = validateEvent(event, 'invalid type')

      expect(isValid).to.be.false
      expect(error.message).to.equal(`The handler for the event \`${event}\` must be ${type}`)
    })
  })

  _.each(events, ([event, type, validValue]) => {
    it(`returns success when event handler of ${event} is ${type}`, () => {
      const { isValid } = validateEvent(event, validValue)

      expect(isValid).to.be.true
    })
  })

  describe('run events', () => {
    const runEvents = [
      'after:run',
      'before:run',
      'before:spec',
      'after:spec',
    ]

    _.each(runEvents, (event) => {
      it(`returns error when ${event} event is registed without experimentalRunEvents flag enabled`, () => {
        const { isValid, error } = validateEvent(event, {}, { experimentalRunEvents: false })

        expect(isValid).to.be.false
        expect(error.message).to.equal(`The \`${event}\` event requires the experimentalRunEvents flag to be enabled.

To enable it, set \`"experimentalRunEvents": true\` in your cypress.json`)
      })

      it(`returns error when event handler of ${event} is not a function`, () => {
        const { isValid, error } = validateEvent(event, 'invalid type', { experimentalRunEvents: true })

        expect(isValid).to.be.false
        expect(error.message).to.equal(`The handler for the event \`${event}\` must be a function`)
      })

      it(`returns success when event handler of ${event} is a function`, () => {
        const { isValid } = validateEvent(event, () => {}, { experimentalRunEvents: true })

        expect(isValid).to.be.true
      })
    })
  })
})
