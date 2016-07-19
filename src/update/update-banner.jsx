import React, { Component } from 'react'
import { action } from 'mobx'
import { observer } from 'mobx-react'

import state from '../lib/state'
import updater from './update-model'
import App from '../lib/app'

@observer
class UpdateBanner extends Component {
  constructor (props) {
    super(props)

    this._checkForUpdate()
  }

  componentDidMount () {
    this.checkId = setInterval(this._checkForUpdate, (5 * 60 * 1000))
  }

  componentWillUnmount () {
    document.getElementsByTagName('html')[0].classList.remove('has-updates')

    clearInterval(this.checkId)
  }

  render () {
    if (!state.updateAvailable) return null

    document.getElementsByTagName('html')[0].classList.add('has-updates')

    return (
      <div id='updates-available'>
      New updates are available
        <strong onClick={this._downloadUpdate}>
          <i className='fa fa-download'></i>{' '}
          Update
        </strong>
      </div>
    )
  }

  _checkForUpdate () {
    App.ipc('updater:check')
    .then(action('checked:updates', (version) => {
      state.updatesAvailable(!!version)
    }))
  }

  _downloadUpdate () {
    updater.openUpdateWindow()
  }
}

export default UpdateBanner
