import cs from 'classnames'
import { action } from 'mobx'
import { observer } from 'mobx-react'
import React from 'react'

const Footer = observer(({ state }) => {
  const toggle = action(() => {
    state.isSelectorHelperEnabled = !state.isSelectorHelperEnabled
  })

  return (
    <footer className={cs({
      'showing-selector-helper': state.isSelectorHelperEnabled,
    })}>
      <div className='selector-helper'>
        <p>Click on an element to view its selector</p>
        <button className='close' onClick={toggle}>
          <i className='fa fa-remove' />
        </button>
      </div>
      <div className='controls'>
        <button onClick={toggle}>
          <i className='fa fa-mouse-pointer' />
        </button>
      </div>
    </footer>
  )
})

export default Footer
