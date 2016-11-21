import { observer } from 'mobx-react'
import React from 'react'

const BundleError = ({ specPath }) => (
  <div>
    <h4>
      <i className='fa fa-warning'></i>
      Oops...we found an error preparing your test file:
    </h4>
    <pre>{specPath}</pre>
    <p>This error occurred while Cypress was compiling and bundling your test code (<a href='https://on.cypress.io/we-found-an-error-preparing-your-file' target='_blank' rel='noopener noreferrer'>learn more</a>) and is usually caused by:</p>
    <ul>
      <li>The file missing</li>
      <li>A syntax error in the file or one of its dependencies</li>
      <li>A missing dependency</li>
    </ul>
    <p>Fix the error in your code to clear this error and re-run your tests.</p>
  </div>
)

const ScriptError = observer(({ specPath, state }) => {
  if (!state.scriptError) return null

  function error () {
    switch (state.scriptError.type) {
      case "BUNDLE_ERROR":
        return <BundleError specPath={specPath} />
      default:
        return null
    }
  }

  return (
    <div className='runner script-error'>
      <aside style={{ width: state.reporterWidth }}>
        {error()}
      </aside>
      <main style={{ marginTop: state.headerHeight }}>
        <pre className='error-stack'>
          {state.scriptError.error.replace(/\{newline\}/g, '\n')}
        </pre>
      </main>
    </div>
  )
})

export default ScriptError
