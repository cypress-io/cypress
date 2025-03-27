const { $, _, Promise } = Cypress

export const getCommandLogWithText = (command, type?) => {
  if (!type) {
    type = 'method'
  }

  // Open current test if not already open, so we can find the command log
  cy.$$('.runnable-active .collapsible:not(.is-open) .collapsible-header', top?.document).click()

  return cy
  .$$(`.runnable-active .command-${type}:contains(${command})`, top?.document)
  .closest('.command')
}

export const findReactInstance = function (dom) {
  let key = _.keys(dom).find((key) => key.startsWith('__reactFiber')) as string
  let internalInstance = dom[key]

  if (internalInstance == null) return null

  return internalInstance._debugOwner
    ? internalInstance._debugOwner.stateNode
    : internalInstance.return.stateNode
}

export const clickCommandLog = (sel, type?) => {
  // trigger the LONG_RUNNING_THRESHOLD to display the command line
  // this adds time to test but makes a more accurate test as React 18+ does not rerender when setting internals
  return cy.wait(2000)
  .then(() => {
    const commandLogEl = getCommandLogWithText(sel, type)

    const reactCommandInstance = findReactInstance(commandLogEl[0])

    if (!reactCommandInstance) {
      assert(false, 'failed to get command log React instance')
    }

    reactCommandInstance.props.appState.isRunning = false
    const inner = $(commandLogEl).find('.command-wrapper-text')

    inner.get(0).click()

    // wait slightly for a repaint of the reporter
    cy.wait(10).then(() => {
      // make sure command was pinned, otherwise throw a better error message
      expect(cy.$$('.runnable-active .command-pin', top?.document).length, 'command should be pinned').ok
    })
  })
}

const wrapped = (obj) => cy.wrap(obj, { log: false })

export const shouldBeCalled = (stub) => wrapped(stub).should('be.called')

export const shouldBeCalledOnce = (stub) => wrapped(stub).should('be.calledOnce')

export const shouldBeCalledWithCount = (num) => (stub) => wrapped(stub).should('have.callCount', num)

export const shouldNotBeCalled = (stub) => wrapped(stub).should('not.be.called')

export const assertLogLength = (logs, expectedLength) => {
  const receivedLogs = logs.map((x, index) => `\n\n${index} - ${x.get('name')}: ${x.get('message')}`).join('\n')

  expect(logs.length).to.eq(expectedLength, `received ${logs.length} logs when we expected ${expectedLength}: [${receivedLogs}]`)
}

export const findCrossOriginLogs = (consolePropCommand, logMap, matchingOrigin) => {
  const matchedLogs = Array.from(logMap.values()).filter((log: any) => {
    const props = log.get()

    return props.name === consolePropCommand && props.id.includes(matchingOrigin)
  })

  // While we'd expect the incoming log order to be deterministic, in practice we've found it fairly
  // flakey. Sorting here eliminates this, resulting in far more reliable tests.
  const logAttrs = matchedLogs.map((log: any) => log.get()).sort()

  return logAttrs.length === 1 ? logAttrs[0] : logAttrs
}

export const attachListeners = (listenerArr) => {
  return (els) => {
    _.each(els, (el, elName) => {
      return listenerArr.forEach((evtName) => {
        el.on(evtName, cy.stub().as(`${elName}:${evtName}`))
      })
    })
  }
}

const getAllFn = (...aliases) => {
  let getFns

  if (aliases.length > 1) {
    const aliasArray = _.isArray(aliases[1]) ? aliases[1] : aliases[1].split(' ')

    getFns = aliasArray.map((alias) => cy.now('get', `@${aliases[0]}:${alias}`))
  } else {
    getFns = aliases[0].split(' ').map((alias) => cy.now('get', `@${aliases[0]}:${alias}`))
  }

  return () => getFns.map((fn) => fn())
}

const shouldWithTimeout = (cb, timeout = 250) => {
  cy.wrap({}, { timeout }).should(cb)
}

export const keyEvents = [
  'keydown',
  'keyup',
  'keypress',
  'input',
  'textInput',
]

export const attachKeyListeners = attachListeners(keyEvents)

// trim new lines at the end of innerText
// due to changing browser versions implementing
// this differently
export const trimInnerText = ($el) => {
  return _.trimEnd($el.get(0).innerText, '\n')
}

export const expectCaret = (start: number) => {
  return ($el) => {
    const end = start

    expect(Cypress.dom.getSelectionBounds($el.get(0))).to.deep.eq({ start, end })
  }
}

export const makeRequestForCookieBehaviorTests = (
  win: Cypress.AUTWindow,
  url: string,
  client: 'fetch' | 'xmlHttpRequest' = 'xmlHttpRequest',
  credentials: 'same-origin' | 'include' | 'omit' | boolean = false,
) => {
  if (client === 'fetch') {
    // if a boolean is specified, make sure the default is applied
    credentials = Cypress._.isBoolean(credentials) ? 'same-origin' : credentials

    return win.fetch(url, { credentials })
  }

  return new Promise<void>((resolve, reject) => {
    let xhr = new XMLHttpRequest()

    xhr.open('GET', url)
    xhr.withCredentials = Cypress._.isBoolean(credentials) ? credentials : false
    xhr.onload = function () {
      resolve(xhr.response)
    }

    xhr.onerror = function () {
      reject(xhr.response)
    }

    xhr.send()
  })
}

function runCommands () {
  cy.exec('echo "hello"')
  cy.readFile('cypress/fixtures/app.json')
  cy.writeFile('cypress/_test-output/written.json', 'contents')
  cy.task('return:arg', 'arg')
  cy.get('#basic').selectFile('cypress/fixtures/valid.json')
  if (!Cypress.isBrowser({ family: 'webkit' })) {
    cy.origin('http://foobar.com:3500', () => {})
  }
}

export const runImportedPrivilegedCommands = runCommands

declare global {
  interface Window {
    runGlobalPrivilegedCommands: () => void
  }
}

window.runGlobalPrivilegedCommands = runCommands

Cypress.Commands.add('runSupportFileCustomPrivilegedCommands', runCommands)

Cypress.Commands.addQuery('getAll', getAllFn)

Cypress.Commands.add('shouldWithTimeout', shouldWithTimeout)

const chaiSubset = require('chai-subset')

chai.use(chaiSubset)
