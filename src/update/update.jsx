import React, { Component } from 'react'
import { observer } from 'mobx-react'
import state from '../lib/state'

import App from '../lib/app'

@observer
class Update extends Component {
  constructor (props) {
    super(props)

    this._checkForUpdate()
  }

  componentDidMount () {
    if (state.updateAvailable) {
      $('html').addClass('has-updates')
    }

    this.checkId = setInterval(this._checkForUpdate, (5 * 60 * 1000))
  }

  componentWillUnmount () {
    $('html').removeClass('has-updates')

    clearInterval(this.checkId)
  }

  render () {
    if (!state.updateAvailable) return null

    return (
      <div id='updates-available'>
      New updates are available
        <strong onClick={this._downloadUpdate}>
          <i className='fa fa-download'></i>
          Update
        </strong>
      </div>
    )
  }

  _checkForUpdate () {
    App.ipc('updater:check')
    .then((version) => {
      state.updatesAvailable(!!(version))
    })
  }
}

export default Update
