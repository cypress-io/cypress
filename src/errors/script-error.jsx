import { observer } from 'mobx-react'
import React from 'react'

const BundleError = ({ specPath }) => (
  <div>
    <h4>
      <i className='fa fa-warning'></i>
      Oops...we found an error preparing your spec file:
    </h4>
    <pre>{specPath.replace(/\//g, ' / ')}</pre>
    <p>Cypress automatically compiles and bundles your test code so you can use ES2015, JS modules, CoffeeScript, etc (<a href='https://on.cypress.io/we-found-an-error-preparing-your-file' target='_blank' rel='noopener noreferrer'>more details here</a>). This can get tripped up by the following:</p>
    <ul>
      <li>The file missing</li>
      <li>A syntax error in the file or one of its dependencies</li>
      <li>A missing dependency</li>
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
    <p>We noticed that you have explicity set the supportFolder option in your configuration. This option is no longer supported and has been replaced by the supportScripts option.</p>
    <p>Please update your configuration to use the supportScripts option. <a href='https://on.cypress.io/guides/configuration#section-global' target='_blank' rel='noopener noreferrer'>Read more about supportScripts here</a></p>
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
        <pre>{state.scriptError.error.replace(/\{newline\}/g, '\n')}</pre>
      </main>
    </div>
  )
})

export default ScriptError
