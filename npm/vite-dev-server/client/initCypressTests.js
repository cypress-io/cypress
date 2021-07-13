// @ts-check
// This file is merged in a <script type=module> into index.html
// it will be used to load and kick start the selected spec

// @ts-ignore
const supportPath = import.meta.env.__cypress_supportPath
// @ts-ignore
const originAutUrl = import.meta.env.__cypress_originAutUrl
// @ts-ignore
const projectRoot = import.meta.env.__cypress_projectRoot

const specPath = window.location.pathname.replace(originAutUrl, '')

const importsToLoad = [() => import(/* @vite-ignore */ specPath)]

if (supportPath) {
  importsToLoad.unshift(() => import(/* @vite-ignore */ supportPath))
}

const CypressInstance = window.Cypress = parent.Cypress

if (!CypressInstance) {
  throw new Error('Tests cannot run without a reference to Cypress!')
}

// cypress internal files start with cypress:///
const cypressRE = / \(cypress:\/\/\/[^\)]+\)/
// stack line start with a space or a tab
const stackLineRE = /^[ \t]+/
// sometimes stack contains parens and the only content we care about is within
const lineParensRE = / \(([^\)]+)\)$/
// thsis how we extract filename, column and line num
const lineInfoRE = /([^\?]+)\?import\:(\d+)\:(\d+)$/

CypressInstance.getMochaHookInvocationDetails = function (stack) {
  const lines = stack.split('\n')

  const stackLines = lines.filter((line) => stackLineRE.test(line))

  const relevantLines = stackLines.filter((line) => !cypressRE.test(line))

  if (!relevantLines.length) {
    return {}
  }

  const firstLine = relevantLines[0]
  .replace(/ at /, '')
  .replace(`${window.location.protocol }//${ window.location.host}`, '')
  .trim()
  .replace(/^\/@fs\//, '')

  const firstLineNoParensObj = lineParensRE.exec(firstLine)

  const firstLineNoParens = firstLineNoParensObj ? firstLineNoParensObj[1] : firstLine

  const firstLineObj = lineInfoRE.exec(firstLineNoParens)

  if (!firstLineObj) {
    return {}
  }

  const [, filePath, lineStr, columnStr] = firstLineObj

  const line = parseInt(lineStr, 10)
  const column = parseInt(columnStr, 10)

  const absoluteFile = filePath.startsWith(projectRoot) ? filePath : `${projectRoot}${filePath}`
  const relativeFile = filePath.startsWith(projectRoot) ? filePath.slice(projectRoot.length) : filePath

  const details = {
    absoluteFile,
    relativeFile,
    line,
    column,
  }

  return {
    stack: stackLines.join('\n'),
    details,
  }
}

// load the support and spec
CypressInstance.onSpecWindow(window, importsToLoad)

// then start the test process
CypressInstance.action('app:window:before:load', window)

// Before all tests we are mounting the root element,
// Cleaning up platform between tests is the responsibility of the specific adapter
// because unmounting react/vue component should be done using specific framework API
// (for devtools and to get rid of global event listeners from previous tests.)
CypressInstance.on('test:before:run', () => {
  // leave the error overlay alone if it exists
  if (document.body.querySelectorAll('vite-error-overlay').length) {
    // make the error more readable by giving it more space
    Cypress.action('cy:viewport:changed', { viewportWidth: 1000, viewportHeight: 500 })

    return
  }

  // reset the viewport to default when in normal mode
  Cypress.action('cy:viewport:changed', {
    viewportWidth: Cypress.config('viewportWidth'),
    viewportHeight: Cypress.config('viewportHeight'),
  })
})

// Make usage of node test plugins possible
window.global = window
