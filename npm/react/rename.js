const arr = [
"./cypress/component/advanced/set-timeout-example/app-cy.js",
"./cypress/component/advanced/set-timeout-example/loading-indicator-cy.js",
"./cypress/component/advanced/lazy-loaded/app-cy.js",
"./cypress/component/advanced/lazy-loaded/other-cy.js",
"./cypress/component/advanced/lazy-loaded/lazy-load-cy.js",
"./cypress/component/advanced/testing-lib-example/testing-lib-cy.js",
"./cypress/component/advanced/radioactive-state/counters/counters-cy.js",
"./cypress/component/advanced/radioactive-state/counter/counter-cy.js",
"./cypress/component/advanced/radioactive-state/todos/todos-cy.js",
"./cypress/component/advanced/renderless/mouse-cy.js",
"./cypress/component/advanced/mock-fetch/fetch-cy.js",
"./cypress/component/advanced/i18n/i18next-cy.js",
"./cypress/component/advanced/material-ui-example/simple-rating-cy.js",
"./cypress/component/advanced/material-ui-example/checkbox-labels-cy.js",
"./cypress/component/advanced/material-ui-example/button-cy.js",
"./cypress/component/advanced/material-ui-example/select-cy.js",
"./cypress/component/advanced/material-ui-example/list-item-cy.js",
"./cypress/component/advanced/material-ui-example/autocomplete-cy.js",
"./cypress/component/advanced/react-bootstrap/modal-cy.js",
"./cypress/component/advanced/react-bootstrap/dropdown-cy.js",
"./cypress/component/basic/emotion-cy.js",
"./cypress/component/basic/alias/alias-cy.js",
"./cypress/component/basic/styled-components/Todo-cy.js",
"./cypress/component/basic/styled-components/Todos-cy.js",
"./cypress/component/basic/react-tutorial/square1-cy.js",
"./cypress/component/basic/react-tutorial/pretty-snapshots-cy.js",
"./cypress/component/basic/react-tutorial/square3-cy.js",
"./cypress/component/basic/react-tutorial/square4-cy.js",
"./cypress/component/basic/react-tutorial/shopping-list-cy.js",
"./cypress/component/basic/react-tutorial/square2-cy.js",
"./cypress/component/basic/react-tutorial/hello-cy.js",
"./cypress/component/basic/react-tutorial/game-cy.js",
"./cypress/component/basic/css/css-orange-button-cy.js",
"./cypress/component/basic/window-cy.js",
"./cypress/component/basic/hello-x-cy.js",
"./cypress/component/basic/wrap-cy.js",
"./cypress/component/basic/hello-world-inline-cy.js",
"./cypress/component/basic/toggle-example/toggle-cy.js",
"./cypress/component/basic/network/2-users-fetch-cy.js",
"./cypress/component/basic/network/1-users-cy.js",
"./cypress/component/basic/react-book-by-chris-noring/jsx-cy.js",
"./cypress/component/basic/react-book-by-chris-noring/components-cy.js",
"./cypress/component/basic/react-book-by-chris-noring/thinking-in-components/Todo-cy.js",
"./cypress/component/basic/react-book-by-chris-noring/thinking-in-components/Todos-cy.js",
"./cypress/component/basic/use-render/my-component-cy.js",
"./cypress/component/basic/counter-set-state/counter-cy.js",
"./cypress/component/basic/use-lodash-fp/lodash-fp-cy.js",
"./cypress/component/basic/document/document-cy.js",
"./cypress/component/basic/enzyme/context-cy.js",
"./cypress/component/basic/enzyme/props-cy.js",
"./cypress/component/basic/enzyme/state-cy.js",
"./cypress/component/basic/styles/style/style-cy.js",
"./cypress/component/basic/css-modules/css-modules-orange-button-cy.js",
"./cypress/component/basic/hello-world-cy.js",
"./cypress/component/basic/unmount/unmount-cy.js",
"./cypress/component/basic/unmount/comp-cy.js",
"./cypress/component/basic/hello-act-cy.js",
"./cypress/component/basic/stateless-cy.js",
"./cypress/component/basic/transpiled-cy.js",
"./cypress/component/basic/full-navigation-cy.js",
"./cypress/component/basic/alert-cy.js",
"./cypress/component/basic/error-boundary-cy.js",
"./cypress/component/basic/counter-use-hooks/counter-hooks-cy.js",
"./cypress/component/basic/stub-example/clicker-cy.js",
"./cypress/component/basic/stub-example/clicker-with-delay-cy.js",
"./cypress/component/smoke-cy.js",
"./cypress/e2e/integration tests/integration-cy.js",
"./examples/react-scripts-folder/cypress/component/App.cy-cy.js",
"./examples/react-scripts-folder/cypress/e2e/cy-cy.js",
"./examples/snapshots/cypress/component/PositiveCounter-cy.js",
"./examples/snapshots/cypress/e2e/cy-cy.js",
"./examples/visual-testing-with-applitools/cypress/e2e/cy-cy.js",
"./examples/tailwind/cypress/e2e/cy-cy.js",
"./examples/tailwind/src/playground.cy-cy.js",
"./examples/tailwind/src/App.cy-cy.js",
"./examples/webpack-options/cypress/component/Mock.cy-cy.js",
"./examples/webpack-options/cypress/component/Test.cy-cy.js",
"./examples/webpack-options/cypress/e2e/cy-cy.js",
"./examples/webpack-file/cypress/e2e/cy-cy.js",
"./examples/react-scripts/cypress/e2e/cy-cy.js",
"./examples/react-scripts-typescript/cypress/e2e/cy-cy.js",
"./examples/a11y/cypress/e2e/cy-cy.js",
"./examples/sass-and-ts/cypress/e2e/cy-cy.js",
"./examples/visual-sudoku/cypress/e2e/cy-cy.js",
"./examples/visual-sudoku/src/App.cy-cy.js",
"./examples/visual-testing-with-percy/cypress/e2e/cy-cy.js",
"./examples/visual-testing-with-percy/src/DatePicker.cy-cy.js",
"./examples/visual-testing-with-happo/cypress/e2e/cy-cy.js",
"./examples/visual-testing-with-happo/src/Calendar.cy-cy.js"
]

const fs = require('fs')
const path = require('path')

const towrite = []
for (const a of arr) {
  if (a.endsWith('/cy-cy.js')) {
    const n = a.replace('/cy-cy.js', '/spec.cy.js')
    towrite.push({ a, n })
  } else if (a.endsWith('.cy-cy.js')) {
    const n = a.replace('.cy-cy.js', '.cy.js')
    towrite.push({ a, n })
  } else {
    towrite.push({ a, n: a })
  }
}


for (const {a, n} of towrite) {
  fs.renameSync(a, n)
}
