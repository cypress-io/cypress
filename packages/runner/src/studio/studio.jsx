import React, { Component } from 'react'
import Tooltip from '@cypress/react-tooltip'

class Studio extends Component {
  render () {
    const { model } = this.props

    return (
      <div className='header-popup studio'>
        <div className='studio-title'>
          <span className='icon'><i className='fas fa-magic' /></span>{' '}
          <span className='title'>CYPRESS STUDIO</span>{' '}
          <span className='beta'>BETA</span>
        </div>
        <div className='available-commands' onClick={this.showAvailableCommands}>
          <a href='#'>AVAILABLE COMMANDS</a>
        </div>
        <div className='studio-controls'>
          <Tooltip
            title='Save Test'
            className='cy-tooltip'
            visible={model.isLoading ? false : null}
          >
            <button
              className='header-button button-save'
              disabled={model.isLoading}
            >
              <i className='fas fa-save' />
            </button>
          </Tooltip>
        </div>
      </div>
    )
  }

  showAvailableCommands = (e) => {
    e.preventDefault()
  }
}

export default Studio
