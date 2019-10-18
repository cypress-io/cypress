require('../../../spec_helper')

const validateEvent = require('../../../../lib/plugins/child/validate_event')

describe('lib/plugins/child/validate_event', () => {
  it('returns error when called with no event name', () => {
    const { isValid, error } = validateEvent()

    expect(isValid).to.be.false
    expect(error.message).to.eq('Plugin event name is undefined')
  })

  it('returns error when called with no event handler', () => {
    const eventName = 'file:preprocessor'
    const { isValid, error } = validateEvent(eventName)

    expect(isValid).to.be.false
    expect(error.message).to.eq(`Plugin event handler is undefined (event - ${eventName})`)
  })

  it('returns error when called with unsupported event name', () => {
    const eventName = 'invalid:event:name'
    const { isValid, error } = validateEvent(eventName, {})

    expect(isValid).to.be.false
    expect(error.message).to.eq(`${eventName} event is not supported`)
  })

  describe('invalid event handlers', () => {
    it('returns error when event handler of file:preprocessor is not a function', () => {
      const eventName = 'file:preprocessor'
      const { isValid, error } = validateEvent(eventName, {})

      expect(isValid).to.be.false
      expect(error.message).to.eq(`${eventName} event handler should be a function`)
    })

    it('returns error when event handler of before:browser:launch is not a function', () => {
      const eventName = 'before:browser:launch'
      const { isValid, error } = validateEvent(eventName, {})

      expect(isValid).to.be.false
      expect(error.message).to.eq(`${eventName} event handler should be a function`)
    })

    it('returns error when event handler of after:screenshot is not a function', () => {
      const eventName = 'after:screenshot'
      const { isValid, error } = validateEvent(eventName, {})

      expect(isValid).to.be.false
      expect(error.message).to.eq(`${eventName} event handler should be a function`)
    })

    it('returns error when event handler of task is not an object', () => {
      const eventName = 'task'
      const { isValid, error } = validateEvent(eventName, () => {})

      expect(isValid).to.be.false
      expect(error.message).to.eq(`${eventName} event handler should be an object`)
    })
  })

  describe('valid event handlers', () => {
    it('returns success when event handler of file:preprocessor is a function', () => {
      const eventName = 'file:preprocessor'
      const { isValid } = validateEvent(eventName, () => {})

      expect(isValid).to.be.true
    })

    it('returns success when event handler of before:browser:launch is a function', () => {
      const eventName = 'before:browser:launch'
      const { isValid } = validateEvent(eventName, () => {})

      expect(isValid).to.be.true
    })

    it('returns success when event handler of after:screenshot is a function', () => {
      const eventName = 'after:screenshot'
      const { isValid } = validateEvent(eventName, () => {})

      expect(isValid).to.be.true
    })

    it('returns success when event handler of task is an object', () => {
      const eventName = 'task'
      const { isValid } = validateEvent(eventName, {})

      expect(isValid).to.be.true
    })
  })
})
