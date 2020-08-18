const testToRun = window.testToRun
const originalIt = window.it

const failInOuterCypress = (err) => {
  top.cy.state('reject')(err)
  throw err
}

// if no tests are run, assume user error
Cypress.mocha.getRunner().on('end',() => {
  if (!foundTest) {
    failInOuterCypress(new Error(`No test found with title **${testToRun}**\nYour test title must match a test title from the isolated spec`))
  }
})

let foundTest = false
window.it = (title, ...args) => {
  let itFn = () => {}
  if (title === testToRun) {
    itFn = originalIt
    foundTest = true
  }
  return itFn(title, ...args)
}

window.it.only = () => {
  failInOuterCypress(new Error('Instead of putting .only in the spec-under-test, put it in the corresponding test in the parent spec (reporter.error.spec.js, etc)'))
}

// eslint-disable-next-line
export const sendXhr = (route) => (win) => {
  const xhr = new win.XMLHttpRequest()

  xhr.open('GET', route)
  xhr.send()

  return xhr
}

// eslint-disable-next-line
export const abortXhr = (route) => (win) => {
  const xhr = sendXhr(route)(win)

  xhr.abort()
}
