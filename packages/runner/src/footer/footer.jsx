import cs from 'classnames'
import { observer } from 'mobx-react'
import React from 'react'

import SelectorHelper from '../selector-helper/selector-helper'
import selectorHelperModel from '../selector-helper/selector-helper-model'

const toggleSelectorHelper = () => {
  selectorHelperModel.toggleEnabled()
}

const Footer = observer(({ state }) => {
  if (state.isLoading || state.isRunning) return null

  return (
    <footer className={cs({
      'showing-selector-helper': selectorHelperModel.isEnabled,
    })}>
      <SelectorHelper />
      <div className='controls'>
        <button onClick={toggleSelectorHelper}>
          <i className='fa fa-mouse-pointer' />
        </button>
      </div>
    </footer>
  )
})

export default Footer
