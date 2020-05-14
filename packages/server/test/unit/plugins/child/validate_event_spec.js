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
- file:preprocessor
- before:browser:launch
- task
- after:screenshot
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
- file:preprocessor
- before:browser:launch
- task
- after:screenshot
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
})
