import cs from 'classnames'
import { observer } from 'mobx-react'
import React from 'react'
import Tooltip from '@cypress/react-tooltip'

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
      <SelectorHelper model={selectorHelperModel} />
      <div className='controls'>
        <Tooltip
          title='Select an element in your app to see a suggested selector'
        >
          <button onClick={toggleSelectorHelper}>
            <i className='fa fa-mouse-pointer' />
          </button>
        </Tooltip>
      </div>
    </footer>
  )
})

export default Footer
