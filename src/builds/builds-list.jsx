import _ from 'lodash'
import React, { Component } from 'react'
import { observer } from 'mobx-react'
import Loader from 'react-loader'

import state from '../lib/state'
import buildsCollection from './builds-collection'
import { getBuilds } from './builds-api'

import Build from './builds-list-item'
import LoginMessage from './login-message'

@observer
class Builds extends Component {

  componentWillMount () {
    getBuilds()
  }

  render () {
    if (!state.hasUser) return <LoginMessage />

    if (buildsCollection.isLoading) return <Loader color="#888" scale={0.5}/>

    if (!buildsCollection.builds.length) return this._empty()

    return (
      <div id='builds'>
        <div className='builds-wrapper'>
          <h5>Builds</h5>
        </div>
        <ul className='builds-list list-as-table'>
          { _.map(buildsCollection.builds, (build) => (
            <li key={build.uuid} className='li'>
              <Build build={build} />
            </li>
          ))}
        </ul>
      </div>
    )
  }

  _empty () {
    return (
      <div id='builds-list-page'>
        <div className="empty-well">
          <h5>
            No Builds
          </h5>
        </div>
      </div>
    )
  }
}

export default Builds
