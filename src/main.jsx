import { useStrict, autorun } from 'mobx'
import React from 'react'
import { render } from 'react-dom'

import uiState from './lib/ui-state'
import App from './app'

useStrict(true)

autorun(() => {
  console.log('UI State:', uiState.serialize())
})

window.Runner = {
  start (config) {
    render(<App config={config} uiState={uiState} />, document.getElementById('app'))
  },
}
