import { useStrict, observe } from 'mobx'
import React from 'react'
import { render } from 'react-dom'

import uiState from './lib/ui-state'
import App from './app'

useStrict(true)

observe(uiState, (change) => {
  console.log(change.type, `uiState.${change.name}`, 'from', change.oldValue, 'to', change.object[change.name])
})

window.Runner = {
  start (config) {
    render(<App config={config} uiState={uiState} />, document.getElementById('app'))
  },
}
