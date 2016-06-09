import { useStrict, observe } from 'mobx'
import React from 'react'
import { render } from 'react-dom'

import state from './lib/state'
import App from './app/app'

useStrict(true)

observe(state, (change) => {
  console.log(change.type, `state.${change.name}`, 'from', change.oldValue, 'to', change.object[change.name])
})

window.Runner = {
  start (config) {
    render(<App config={config} state={state} />, document.getElementById('app'))
  },
}
