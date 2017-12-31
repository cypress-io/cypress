import { render } from 'react-dom'

/* eslint-env mocha */
export const mount = jsx => {
  const html = '<body><div id="app"></div></body>'

  const document = cy.state('document')
  document.write(html)
  document.close()

  render(jsx, document.getElementById('app'))
}
