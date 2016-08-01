export default (config) => {
  return `
    <link rel='stylesheet' href='/${config.namespace}/runner/blank.css' />
    <div class='container'>
      <h1></h1>
      <p>This is the default blank page.</p>
      <p>To test your web application:</p>
      <ul>
        <li>Start your app's server</li>
        <li>
          <kbd>
            <a href='https://on.cypress.io/api/visit' target='_blank'>cy.visit()</a>
          </kbd>
          your app
        </li>
        <li>Begin writing tests</li>
      </ul>
    </div>
  `
}
