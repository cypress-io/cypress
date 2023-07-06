(() => {
  const urlParams = new URLSearchParams(window.__search || window.location.search)
  const appendToSpecFrame = !!urlParams.get('appendToSpecFrame')
  const strategy = urlParams.get('strategy')
  const command = urlParams.get('command')
  const cy = window.Cypress.cy

  if (cy.state('current')) {
    cy.state('current').attributes.args = [() => {}]
  }

  const TOP = 'top' // prevents frame-busting
  // recursively tries sibling frames until finding the spec frame, which
  // should be the first same-origin one we come across
  const specFrame = window.__isSpecFrame ? window : (() => {
    const tryFrame = (index) => {
      try {
        // will throw if cross-origin
        window[TOP].frames[index].location.href

        return window[TOP].frames[index]
      } catch (err) {
        return tryFrame(index + 1)
      }
    }

    return tryFrame(1)
  })()

  const run = () => {
    switch (command) {
      case 'exec':
        cy.exec('echo "Goodbye"')
        break
      case 'readFile':
        cy.readFile('cypress/fixtures/example.json')
        break
      case 'writeFile':
        cy.writeFile('cypress/_test-output/written.json', 'other contents')
        break
      case 'task':
        cy.task('return:arg', 'other arg')
        break
      case 'selectFile':
        cy.get('input').selectFile('cypress/fixtures/example.json')
        break
      case 'origin':
        cy.origin('http://barbaz.com:3500', () => {})
        break
      default:
        throw new Error(`Command not supported: ${command}`)
    }
  }
  const runString = run.toString()

  // instead of running this script in the AUT, this appends it to the
  // spec frame to run it there
  if (appendToSpecFrame) {
    cy.wait(500) // gives the script time to run without the queue ending

    const beforeScript = specFrame.document.createElement('script')

    beforeScript.textContent = `
      window.__search = '${window.location.search.replace('appendToSpecFrame=true&', '')}'
      window.__isSpecFrame = true
    `

    specFrame.document.body.appendChild(beforeScript)

    const scriptEl = specFrame.document.createElement('script')

    scriptEl.src = '/fixtures/aut-commands.js'
    specFrame.document.body.appendChild(scriptEl)

    return
  }

  switch (strategy) {
    case 'inline':
      run()
      break
    case 'then':
      cy.then(run)
      break
    case 'eval':
      specFrame.eval(`(command) => { (${runString})() }`)(command)
      break
    case 'function': {
      const fn = new specFrame.Function('command', `(${runString})()`)

      fn.call(specFrame, command)
      break
    }
    default:
      throw new Error(`Strategy not supported: ${strategy}`)
  }
})()
