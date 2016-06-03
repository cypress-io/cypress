import { useStrict, autorun } from 'mobx'
import React from 'react'
import { render } from 'react-dom'

import uiState from './lib/ui-state'

import Header from './header/header'
import Iframes from './iframe/iframes'

useStrict(true)

autorun(() => {
  console.log('UI State:', uiState.serialize())
})

window.Runner = {
  start (config) {
    render(
      <div className="container">
        <Header uiState={uiState} />
        <Iframes uiState={uiState} config={config} />
      </div>
    , document.getElementById('app'))
  },
}
