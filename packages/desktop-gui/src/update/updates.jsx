import React, { Component } from 'react'
import { observer } from 'mobx-react'
import Loader from 'react-loader'

import ipc from '../lib/ipc'
import updater from './update-model'

const openChangelog = (e) => {
  e.preventDefault()
  return ipc.externalOpen('https://on.cypress.io/changelog')
}

@observer
class Updates extends Component {
  constructor (props) {
    super(props)

    // TODO: implement this:
    // ipc.getOptions().then((options = {}) => {
    // })

    updater.setVersion(props.options.version)

    ipc.updaterRun((err, data = {}) => {
      switch (data.event) {
        case 'start':
          return updater.setState('checking')
        case 'apply':
          return updater.setState('applying')
        case 'error':
          return updater.setState('error')
        case 'done':
          return updater.setState('done')
        case 'none':
          return updater.setState('none')
        case 'download':
          updater.setNewVersion(data.version)
          return updater.setState('downloading')
        default:
          return
      }
    })
  }

  render () {
    if (!updater.state) return <Loader color='#888' scale={0.5}/>

    return (
      <div>
        <p>
          <a onClick={openChangelog} href='#'>
            View Changelog
          </a>
        </p>
        { this._currentVersion() }
        { this._newVersion() }
        { this._state() }
      </div>
    )
  }

  _currentVersion = () => {
    if (updater.version) {
      return (
        <p className='version'>
          <b>Current Version:</b>{' '}
          <span>{ updater.version }</span>
        </p>
      )
    }
  }

  _newVersion = () => {
    if (updater.newVersion) {
      return (
        <p className='new-version'>
          <b>New Version:</b>{' '}
          <span>{ updater.newVersion }</span>
        </p>
      )
    }
  }

  _state = () => {
    let errClass
    if (updater.state === 'error') {
      errClass = 'text-danger'
    }

    if (updater.state) {
      return (
        <div>
          <p className={`state ${errClass}`}>
            { this._notFinished() }{' '}
            <span dangerouslySetInnerHTML={this._getHtmlState()} />
          </p>
          { this._finished() }
        </div>
      )
    }
  }

  _getHtmlState = () => {
    return { __html: updater.stateFormatted.split('\n').join("<br />") }
  }

  _notFinished = () => {
    if (!updater.finished) {
      return (
        <i className='fa fa-spinner fa-spin'></i>
      )
    }
  }

  _finished = () => {
    if (updater.finished) {
      return (
        <div>
          <button onClick={this._closeWindow} className='btn btn-default'>
            { updater.buttonFormatted }
          </button>
        </div>
      )
    }
  }

  _closeWindow (e) {
    e.preventDefault()
    ipc.windowClose()
  }
}

export default Updates
