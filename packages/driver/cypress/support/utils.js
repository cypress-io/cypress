const { _, Promise } = Cypress

export const findReactInstance = function (dom) {
  let key = _.keys(dom).find((key) => key.startsWith('__reactInternalInstance$'))
  let internalInstance = dom[key]

  if (internalInstance == null) return null

  return internalInstance._debugOwner
    ? internalInstance._debugOwner.stateNode
    : internalInstance.return.stateNode
}

export const clickCommandLog = (sel, type) => {
  return cy.wait(10)
  .then(() => {
    return withMutableReporterState(() => {
      // Open current test if not already open, so we can find the command log
      const currTestName = Cypress.state('test').title

      cy.log(`Open "${currTestName}" test`)

      cy.get(`.runnable-active .command-${type}:contains(${sel})`, {
        withinSubject: top.document,
      })
      .closest('.command')
      .eq(0)
      .should('exist')
      .find('.command-wrapper')
      .click()
      .scrollIntoView()
    })
  })
}

export const withMutableReporterState = (fn) => {
  top.UnifiedRunner.MobX.configure({ enforceActions: 'never' })

  const currentTestLog = findReactInstance(cy.$$('.runnable-active', top.document)[0])

  currentTestLog.props.model._isOpen = true
  currentTestLog.props.appState.isRunning = false

  return Promise.try(fn)
  .then(() => {
    top.UnifiedRunner.MobX.configure({ enforceActions: 'always' })
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
  if (aliases.length > 1) {
    return getAllFn((_.isArray(aliases[1]) ? aliases[1] : aliases[1].split(' ')).map((alias) => `@${aliases[0]}:${alias}`).join(' '))
  }

  return Promise.all(
    aliases[0].split(' ').map((alias) => {
      return cy.now('get', alias)
    }),
  )
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

export const expectCaret = (start, end) => {
  return ($el) => {
    end = end == null ? start : end
    expect(Cypress.dom.getSelectionBounds($el.get(0))).to.deep.eq({ start, end })
  }
}

Cypress.Commands.add('getAll', getAllFn)

const chaiSubset = require('chai-subset')

chai.use(chaiSubset)
