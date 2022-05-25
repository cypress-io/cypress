require('../spec_helper')

const Promise = require('bluebird')
const plugins = require(`../../lib/plugins`)
const task = require(`../../lib/task`)

describe('lib/task', () => {
  beforeEach(function () {
    this.configFilePath = 'cypress.config.js'
    sinon.stub(plugins, 'execute').resolves('result')

    return sinon.stub(plugins, 'has').returns(true)
  })

  it('executes the \'task\' plugin', function () {
    return task.run(this.configFilePath, { task: 'some:task', arg: 'some:arg', timeout: 1000 }).then(() => {
      expect(plugins.execute).to.be.calledWith('task', 'some:task', 'some:arg')
    })
  })

  it('resolves the result of the \'task\' plugin', function () {
    return task.run(this.configFilePath, { task: 'some:task', arg: 'some:arg', timeout: 1000 }).then((result) => {
      expect(result).to.equal('result')
    })
  })

  it('throws if \'task\' event is not registered', function () {
    plugins.has.returns(false)

    return task.run(this.configFilePath, { timeout: 1000 }).catch((err) => {
      expect(err.message).to.equal(`The 'task' event has not been registered in the setupNodeEvents method. You must register it before using cy.task()\n\nFix this in your setupNodeEvents method here:\n${this.configFilePath}`)
    })
  })

  it('throws if \'task\' event resolves __cypress_unhandled__', function () {
    plugins.execute.withArgs('task').resolves('__cypress_unhandled__')
    plugins.execute.withArgs('_get:task:keys').resolves(['foo', 'bar'])

    return task.run(this.configFilePath, { task: 'some:task', arg: 'some:arg', timeout: 1000 }).catch((err) => {
      expect(err.message).to.equal(`The task 'some:task' was not handled in the setupNodeEvents method. The following tasks are registered: foo, bar\n\nFix this in your setupNodeEvents method here:\n${this.configFilePath}`)
    })
  })

  it('throws if \'task\' event resolves undefined', function () {
    plugins.execute.withArgs('task').resolves(undefined)
    plugins.execute.withArgs('_get:task:body').resolves('function () {}')

    return task.run(this.configFilePath, { task: 'some:task', arg: 'some:arg', timeout: 1000 }).catch((err) => {
      expect(err.message).to.equal(`The task 'some:task' returned undefined. You must return a value, null, or a promise that resolves to a value or null to indicate that the task was handled.\n\nThe task handler was:\n\nfunction () {}\n\nFix this in your setupNodeEvents method here:\n${this.configFilePath}`)
    })
  })

  it('throws if \'task\' event resolves undefined - without task body', function () {
    plugins.execute.withArgs('task').resolves(undefined)
    plugins.execute.withArgs('_get:task:body').resolves('')

    return task.run(this.configFilePath, { task: 'some:task', arg: 'some:arg', timeout: 1000 }).catch((err) => {
      expect(err.message).to.equal(`The task 'some:task' returned undefined. You must return a value, null, or a promise that resolves to a value or null to indicate that the task was handled.\n\nFix this in your setupNodeEvents method here:\n${this.configFilePath}`)
    })
  })

  it('throws if it times out', function () {
    plugins.execute.withArgs('task').resolves(Promise.delay(250))
    plugins.execute.withArgs('_get:task:body').resolves('function () {}')

    return task.run(this.configFilePath, { task: 'some:task', arg: 'some:arg', timeout: 10 }).catch((err) => {
      expect(err.message).to.equal(`The task handler was:\n\nfunction () {}\n\nFix this in your setupNodeEvents method here:\n${this.configFilePath}`)
    })
  })
})
