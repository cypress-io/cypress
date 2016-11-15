import { observer } from 'mobx-react'
import React from 'react'

const BundleError = ({ specPath }) => (
  <div>
    <h4>
      <i className='fa fa-warning'></i>
      Oops...we found an error preparing your test file:
    </h4>
    <pre>{specPath.replace(/\//g, '/')}</pre>
    <p>Cypress compiles and bundles your test code so you can use ES2015, JS modules, CoffeeScript, etc. (<a href='https://on.cypress.io/we-found-an-error-preparing-your-file' target='_blank' rel='noopener noreferrer'>Learn more</a>). This can cause problems when:</p>
    <ul>
      <li>The file is missing.</li>
      <li>There's a syntax error in the file or one of its dependencies.</li>
      <li>There's a missing dependency.</li>
    </ul>
    <p>Fix the error in your code to clear this error and re-run your tests.</p>
  </div>
)

const SupportFolderError = () => (
  <div>
    <h4>
      <i className='fa fa-warning'></i>
      The supportFolder option has been removed
    </h4>
    <p>We see you set up a <strong>supportFolder</strong> option in your configuration.</p>
    <p>This option is not supported and was replaced by the <strong>supportScripts</strong> option.</p>
    <p>Please update your configuration.{' '}
      <a href='https://on.cypress.io/guides/configuration#section-global' target='_blank' rel='noopener noreferrer'>
        Learn more.
      </a>
    </p>
  </div>
)

const ScriptError = observer(({ specPath, state }) => {
  if (!state.scriptError) return null

  function error () {
    switch (state.scriptError.type) {
      case "BUNDLE_ERROR":
        return <BundleError specPath={specPath} />
      case "SUPPORT_FOLDER":
        return <SupportFolderError />
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
