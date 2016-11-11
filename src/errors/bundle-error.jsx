import { observer } from 'mobx-react'
import React from 'react'

const BundleError = observer(({ specPath, state }) => {
  if (!state.bundleError) return null

  return (
    <div className='runner bundle-error'>
      <aside style={{ width: state.reporterWidth }}>
        <h4>
          <i className='fa fa-warning'></i>
          Oops... we found an error preparing your spec file:
        </h4>
        <pre>{specPath.split('/').join(' / ')}</pre>
        <p>Cypress automatically compiles and bundles your test code so you can use ES2015, JS modules, CoffeeScript, etc (<a href='https://on.cypress.io/guides/test-transpilation' target='_blank' rel='noopener noreferrer'>more details here</a>). This can get tripped up by the following:</p>
        <ul>
          <li>The file missing</li>
          <li>A syntax error in the file or one of its dependencies</li>
          <li>A missing dependency</li>
        </ul>
        <p>Fix the error in your code to clear this error and re-run your tests.</p>
      </aside>
      <main style={{ marginTop: state.headerHeight }}>
        <pre>{state.bundleError.stack.replace(/\{newline\}/g, '\n')}</pre>
      </main>
    </div>
  )
})

export default BundleError
