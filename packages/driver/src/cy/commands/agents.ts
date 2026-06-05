import _ from 'lodash'
import sinon from 'sinon'

import Promise from 'bluebird'

import $utils from '../../cypress/utils'
import $errUtils from '../../cypress/error_utils'

type Counts = {
  spy: number
  stub: number
  children: Record<string, number>
}

let counts: Counts | null = null

sinon.setFormatter($utils.stringifyArg.bind($utils))

// When a sinon assertion fails (e.g. `expect(spy).to.be.calledWith(...)`),
// sinon builds the failure message by serializing *every* call the spy has
// received (the `%C` printf token). When a spy is attached to a frequently
// invoked method - e.g. `window.postMessage` - this call list can grow without
// bound, so each retry of a failing assertion does progressively more work and
// the command appears to hang for many minutes instead of failing once the
// assertion times out.
// https://github.com/cypress-io/cypress/issues/15005
const MAX_FORMATTED_CALLS = 100

// Cap the number of calls sinon enumerates when building assertion/log messages
// so message construction stays bounded regardless of how many times the spy ran.
const boundPrintf = (agent) => {
  const { printf } = agent

  if (!_.isFunction(printf) || (printf as any)._cyBound) {
    return
  }

  const boundFn: any = function (format, ...args) {
    const realCallCount = agent.callCount

    // only the call-listing token (`%C`) scales with the number of calls, so we
    // leave everything else untouched and only intervene when it's present and
    // there are more calls than we're willing to serialize.
    if (realCallCount <= MAX_FORMATTED_CALLS || !_.isString(format) || !format.includes('%C')) {
      return printf.apply(this, [format, ...args])
    }

    try {
      // temporarily lower callCount so sinon's `%C` token only serializes the
      // first MAX_FORMATTED_CALLS calls instead of all of them. This only affects
      // message construction - the pass/fail result is computed separately.
      agent.callCount = MAX_FORMATTED_CALLS
    } catch {
      // callCount isn't writable in this sinon version; fall back to default behavior
      return printf.apply(this, [format, ...args])
    }

    try {
      const message = printf.apply(this, [format, ...args])

      return `${message}\n    ...and ${realCallCount - MAX_FORMATTED_CALLS} more call(s)`
    } finally {
      agent.callCount = realCallCount
    }
  }

  boundFn._cyBound = true
  agent.printf = boundFn
}

const createSandbox = () => {
  return sinon.createSandbox().usingPromise(Promise)
}

const display = (name) => {
  if (name === 'spy') {
    return 'Spied Obj'
  }

  if (name === 'stub') {
    return 'Stubbed Obj'
  }

  return ''
}

const formatArgs = (args) => {
  return _.map(args, (arg) => {
    return $utils.stringifyArg(arg)
  })
}

const getMessage = (method, args) => {
  method = method ?? 'function'

  args = args.length > 3
    ? formatArgs(args.slice(0, 3)).concat('...')
    : formatArgs(args)

  return `${method}(${args.join(', ')})`
}

const onInvoke = function (Cypress, obj, args) {
  const { agent } = obj
  const agentName = agent._cyName

  // fakes are children of the agent created with `withArgs`
  const fakes = agent.matchingFakes(args)

  agent._cyLog.set('callCount', agent.callCount)
  for (let fake of fakes) {
    fake._cyLog.set('callCount', fake.callCount)
  }

  // bail if we've turned off logging this agent
  if (agent._log === false) {
    return
  }

  const logProps: Record<string, any> = {
    name: agentName,
    message: obj.message,
    state: obj.error ? 'failed' : 'passed',
    type: 'parent',
    end: true,
    snapshot: !agent._noSnapshot,
    event: true,
    consoleProps () {
      const consoleObj: Record<string, any> = {}

      consoleObj.name = `${agentName} called`
      consoleObj.error = null

      consoleObj[agent._cyType] = agent
      consoleObj['Call #'] = agent.callCount
      consoleObj.Alias = agent._cyAlias

      consoleObj[display(obj.name)] = obj.obj
      consoleObj.Arguments = obj.call.args
      consoleObj.Context = obj.call.thisValue
      consoleObj.Returned = obj.call.returnValue

      if (obj.error) {
        consoleObj.Error = obj.error.stack
      }

      for (let fake of fakes) {
        const count = fake._cyCount

        consoleObj[`Child ${fake._cyType} (${count})`] = '---'
        consoleObj[`  ${count} ${fake._cyType}`] = fake
        consoleObj[`  ${count} call #`] = fake.callCount
        consoleObj[`  ${count} alias`] = fake._cyAlias
        consoleObj[`  ${count} matching arguments`] = fake.matchingArguments
      }

      return consoleObj
    },
  }

  const aliases = _.compact([agent._cyAlias].concat(_.map(fakes, '_cyAlias')))

  if (aliases.length) {
    logProps.alias = aliases
    logProps.aliasType = 'agent'
  }

  return Cypress.log(logProps)
}

const onError = (err) => {
  return $errUtils.throwErr(err)
}

// create a global sandbox
// to be used through all the tests
const sandbox = createSandbox()

const reset = () => {
  counts = {
    spy: 0,
    stub: 0,
    children: {},
  }

  sandbox.restore()

  return null
}

export default function (Commands, Cypress, cy, state) {
  // reset initially on a new run because we could be
  // re-running from the UI or from a spec file change
  reset()

  const resetAndSetSandbox = () => {
    reset()

    // attach the sandbox to state
    return state('sandbox', sandbox)
  }

  // before each of our tests we always want
  // to reset the counts + the sandbox
  Cypress.on('test:before:run', resetAndSetSandbox)

  const wrap = function (ctx, type, agent, obj, method, count?) {
    if (!count) {
      count = (counts![type] += 1)
    }

    const name = `${type}-${count}`

    if (!agent.parent) {
      counts!.children[name] = 0
    }

    const log = Cypress.log({
      instrument: 'agent',
      name,
      functionName: method,
      count,
      callCount: 0,
    })

    agent._cyCount = count
    agent._cyLog = log
    agent._cyName = name
    agent._cyType = type

    const { invoke } = agent

    agent.invoke = function (func, thisValue, args) {
      let error = null
      let returned = null

      // because our spy could potentially fail here
      // we need to wrap this in a try / catch
      // so we still emit the command that failed
      // and the user can easily find the error
      try {
        returned = invoke.call(this, func, thisValue, args)
      } catch (e: any) {
        error = e
      }

      const props = {
        count,
        name: type,
        message: getMessage(method, args),
        obj,
        agent,
        call: agent.lastCall,
        callCount: agent.callCount,
        error,
        log,
      }

      onInvoke(Cypress, props, args)

      // if an error did exist then we need
      // to bubble it up
      if (error) {
        onError(error)
      }

      // make sure we return the invoked return value
      // of the spy
      return returned
    }

    // enable not logging this agent
    agent.log = (bool = true) => {
      agent._log = bool

      return agent
    }

    // disable DOM snapshots during log for this agent
    agent.snapshot = (bool = true) => {
      agent._noSnapshot = !bool

      return agent
    }

    agent.as = (alias) => {
      cy.validateAlias(alias)
      cy.addAlias(ctx, {
        subjectChain: [agent],
        command: log,
        alias,
      })

      agent._cyAlias = alias
      log.set({
        alias,
        aliasType: 'agent',
      })

      agent.named(alias)

      return agent
    }

    const { withArgs } = agent

    agent.withArgs = function (...args) {
      const childCount = (counts!.children[name] += 1)

      return wrap(ctx, type, withArgs.apply(this, args), obj, method, `${count}.${childCount}`)
    }

    // keep sinon's failure-message construction bounded for spies with very
    // large call histories (https://github.com/cypress-io/cypress/issues/15005)
    boundPrintf(agent)

    return agent
  }

  const spy = function (obj, method) {
    const theSpy = sandbox.spy(obj, method)

    return wrap(this, 'spy', theSpy, obj, method)
  }

  const stub = function (obj, method: string) {
    // TODO: make the code below work with `packages/runner` type check without casting to `never`.
    let theStub = sandbox.stub.call(sandbox, obj, method as never)

    return wrap(this, 'stub', theStub, obj, method)
  }

  return Commands.addAllSync({
    spy,
    stub,
  })
}
