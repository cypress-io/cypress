import { useStrict, toJS } from 'mobx'
import React from 'react'
import { render } from 'react-dom'

import appGlobal from './lib/app'
import handleGlobalErrors from './lib/handle-global-errors'
import momentOverrides from './lib/configure-moment'

import App from './app/app'
import Updates from './update/updates'

useStrict(true)

handleGlobalErrors()
momentOverrides()

if (window.env === 'test' || window.env === 'development') {
  window.toJS = toJS
}

appGlobal.start = ({ projectPath }) => {
  render(<App projectPath={projectPath} />, document.getElementById('app'))
}

appGlobal.startUpdateApp = () => {
  render(<Updates />, document.getElementById('updates'))
}
