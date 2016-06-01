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

render(
  <div id="aut-wrapper">
    <div id="aut-container">
      <Header uiState={uiState} />
      <Iframes uiState={uiState} />
      <div id="message-region"></div>
    </div>
  </div>
, document.getElementById('app'))
