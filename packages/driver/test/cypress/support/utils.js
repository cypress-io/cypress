const { $, _ } = Cypress

export const getCommandLogWithText = (text) => {
  return cy
  .$$(`.runnable-active .command-wrapper:contains(${text}):visible`, top.document)
  .parentsUntil('li')
  .last()
  .parent()
}

export const findReactInstance = function (dom) {
  let key = Object.keys(dom).find((key) => key.startsWith('__reactInternalInstance$'))
  let internalInstance = dom[key]

  if (internalInstance == null) return null

  return internalInstance._debugOwner
    ? internalInstance._debugOwner.stateNode
    : internalInstance.return.stateNode
}

export const clickCommandLog = (sel) => {
  return cy.wait(10)
  .then(() => {
    withMutableReporterState(() => {
      const commandLogEl = getCommandLogWithText(sel)

      const reactCommandInstance = findReactInstance(commandLogEl[0])

      if (!reactCommandInstance) {
        assert(false, 'failed to get command log React instance')
      }

      reactCommandInstance.props.appState.isRunning = false

      $(commandLogEl).find('.command-wrapper').click()

      // make sure command was pinned, otherwise throw a better error message
      expect(cy.$$('.command-pin:visible', top.document).length, 'command should be pinned').ok
    })
  })
}

export const withMutableReporterState = (fn) => {
  top.Runner.configureMobx({ enforceActions: 'never' })

  const currentTestLog = findReactInstance(cy.$$('.runnable-active', top.document)[0])

  currentTestLog.props.model.isOpen = true

  return Cypress.Promise.try(fn)
  .then(() => {
    top.Runner.configureMobx({ enforceActions: 'strict' })
  })
}

const wrapped = (obj) => cy.wrap(obj, { log: false })

export const shouldBeCalled = (stub) => wrapped(stub).should('be.called')

export const shouldBeCalledOnce = (stub) => wrapped(stub).should('be.calledOnce')

export const shouldBeCalledWithCount = (num) => (stub) => wrapped(stub).should('have.callCount', num)

export const shouldNotBeCalled = (stub) => wrapped(stub).should('not.be.called')

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

  return Cypress.Promise.all(
    aliases[0].split(' ').map((alias) => {
      return cy.now('get', alias)
    })
  )
}

Cypress.Commands.add('getAll', getAllFn)

const chaiSubset = require('chai-subset')

chai.use(chaiSubset)
