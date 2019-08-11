export const getCommandLogWithText = (text) => cy.$$(`.command-wrapper:contains(${text}):visible`, top.document).parentsUntil('li').last().parent()[0]

export const findReactInstance = function (dom) {
  let key = Object.keys(dom).find((key) => key.startsWith('__reactInternalInstance$'))
  let internalInstance = dom[key]

  if (internalInstance == null) return null

  return internalInstance._debugOwner
    ? internalInstance._debugOwner.stateNode
    : internalInstance.return.stateNode

}

export const withMutableReporterState = (fn) => {
  top.Runner.configureMobx({ enforceActions: 'never' })

  return Cypress.Promise.try(() => {
    return fn()
  }).then(() => {
    top.Runner.configureMobx({ enforceActions: 'strict' })
  })

}
