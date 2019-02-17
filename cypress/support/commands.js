import { stylesCache, setXMLHttpRequest, setAlert } from '../../lib'
// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add("login", (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add("drag", { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add("dismiss", { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This is will overwrite an existing command --
// Cypress.Commands.overwrite("visit", (originalFn, url, options) => { ... })

/** Initialize an empty document w/ ReactDOM and DOM events.
    @function   cy.injectReactDOM
**/
Cypress.Commands.add('injectReactDOM', () => {
  var packages = {}
  // Yeah, due to how Cy resolves promises under the hood, a closure works but an @aliased cached asset doesn't
  return cy
    .log('Injecting ReactDOM for Unit Testing')
    .readFile('node_modules/react/umd/react.development.js', { log: false }).then(file => packages.React = file)
    .readFile('node_modules/react-dom/umd/react-dom.development.js', { log: false }).then(file => packages.ReactDOM = file)
    .then(() => {
      // include React and ReactDOM to force DOM to register all DOM event listeners
      // otherwise the component will NOT be able to dispatch any events
      // when it runs the second time
      // https://github.com/bahmutov/cypress-react-unit-test/issues/3
      var html = `<body>
          <div id="cypress-jsdom"></div>
          <script>${packages.React}</script>
          <script>${packages.ReactDOM}</script>
        </body>`
      const document = cy.state('document')
      document.write(html)
      document.close()
    })
})

cy.stylesCache = stylesCache
/** Caches styles from previously compiled components for reuse
    @function   cy.copyComponentStyles
    @param      {Object}  component
**/
Cypress.Commands.add('copyComponentStyles', (component) => {
  // need to find same component when component is recompiled
  // by the JSX preprocessor. Thus have to use something else,
  // like component name
  const hash = component.type.name
  const document = cy.state('document')
  let styles = document.querySelectorAll('head style')
  if (styles.length) {
    cy.log('injected %d styles', styles.length)
    cy.stylesCache.set(hash, styles)
  } else {
    cy.log('No styles injected for this component, checking cache')
    if (cy.stylesCache.has(hash)) {
      styles = cy.stylesCache.get(hash)
    } else {
      styles = null
    }
  }
  if (!styles) {
    return
  }
  const parentDocument = window.parent.document
  const projectName = Cypress.config('projectName')
  const appIframeId = "Your App: '" + projectName + "'"
  const appIframe = parentDocument.getElementById(appIframeId)
  var head = appIframe.contentDocument.querySelector('head')
  styles.forEach(function (style) {
    head.appendChild(style)
  })
  return
})

/** Mount a React component in a blank document; register it as an alias
    To access: use an alias, e.g.cy.get('@Component').its('state').should(...)
    @function   cy.mount
    @param      {Object}  jsx
    @param      {string}  [Component]   alias
**/
Cypress.Commands.add('mount', (jsx, alias = 'Component') => {
  cy
    .injectReactDOM()
    .log('ReactDOM.render(<' + alias + ' ... />)')
    .window({ log: false })
    .then(setXMLHttpRequest)
    .then(setAlert)
    .then(win => {
      const { ReactDOM } = win
      const document = cy.state('document')
      const component = ReactDOM.render(jsx, document.getElementById('cypress-jsdom'))
      cy.wrap(component, { log: false }).as(alias)
    })
  cy.copyComponentStyles(jsx)
})
