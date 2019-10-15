require("../../../spec_helper")

validate_event = require("../../../../lib/plugins/child/validate_event")

describe "lib/plugins/child/validate_event", ->
  it "returns error when called with no event name", ->
    { isValid, error } = validate_event()
    expect(isValid).to.be.false
    expect(error.message).to.eq('Plugin event name is undefined')

  it "returns error when called with no event handler", ->
    eventName = 'file:preprocessor'
    { isValid, error } = validate_event(eventName)
    expect(isValid).to.be.false
    expect(error.message).to.eq("Plugin event handler is undefined (event - #{eventName})")

  it "returns error when called with unsupported event name", ->
    eventName = 'invalid:event:name'
    { isValid, error } = validate_event(eventName, {})
    expect(isValid).to.be.false
    expect(error.message).to.eq("#{eventName} event is not supported")

  describe "invalid event handlers", ->
    it "returns error when event handler of file:preprocessor is not a function", ->
      eventName = 'file:preprocessor'
      { isValid, error } = validate_event(eventName, {})
      expect(isValid).to.be.false
      expect(error.message).to.eq("#{eventName} event handler should be a function")

    it "returns error when event handler of before:browser:launch is not a function", ->
      eventName = 'before:browser:launch'
      { isValid, error } = validate_event(eventName, {})
      expect(isValid).to.be.false
      expect(error.message).to.eq("#{eventName} event handler should be a function")

    it "returns error when event handler of after:screenshot is not a function", ->
      eventName = 'after:screenshot'
      { isValid, error } = validate_event(eventName, {})
      expect(isValid).to.be.false
      expect(error.message).to.eq("#{eventName} event handler should be a function")

    it "returns error when event handler of task is not an object", ->
      eventName = 'task'
      { isValid, error } = validate_event(eventName, () =>)
      expect(isValid).to.be.false
      expect(error.message).to.eq("#{eventName} event handler should be an object")

  describe "valid event handlers", ->
    it "returns success when event handler of file:preprocessor is a function", ->
      eventName = 'file:preprocessor'
      { isValid } = validate_event(eventName, () =>)
      expect(isValid).to.be.true

    it "returns success when event handler of before:browser:launch is a function", ->
      eventName = 'before:browser:launch'
      { isValid } = validate_event(eventName, () =>)
      expect(isValid).to.be.true

    it "returns success when event handler of after:screenshot is a function", ->
      eventName = 'after:screenshot'
      { isValid } = validate_event(eventName, () =>)
      expect(isValid).to.be.true

    it "returns success when event handler of task is an object", ->
      eventName = 'task'
      { isValid } = validate_event(eventName, {})
      expect(isValid).to.be.true