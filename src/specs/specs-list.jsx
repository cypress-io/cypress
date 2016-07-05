import _ from 'lodash'
import React, { Component } from 'react'
import { observer } from 'mobx-react'

import App from '../lib/app'
import { getSpecs } from './specs-api'
import specsCollection from './specs-collection'

@observer
class Specs extends Component {
  constructor (props) {
    super(props)
    getSpecs(this.props.project)
  }

  render () {
    if (!specsCollection.isLoaded) return null

    if (!specsCollection.specs.length) return this._empty()

    return (
      <div id='tests-list-page'>
        <ul className='outer-files-container list-as-table'>
          { _.map(specsCollection.specs, (spec) => (
            this.specItem(spec)
          ))}
        </ul>
      </div>
    )
  }

  specItem (spec) {
    if (spec.children.specs && spec.children.specs.length) {
      return (
        <li key={spec.id} className='folder'>
          <div>
            <div>
              <i className='fa fa-folder-o'></i>
              { spec.name }{' '}
            </div>
          </div>
          <div>
            <div>
              <ul className='list-as-table'>
                { _.map(spec.children.specs, (spec) => (
                  this.specItem(spec)
                ))}
              </ul>
            </div>
          </div>
        </li>
      )
    } else {
      return (
        <li key={spec.id} className='file'>
          <a href='#'>
            <div>
              <div>
                <i className='fa fa-file-o'></i>
                { spec.name }
              </div>
            </div>
            <div>
              <div></div>
            </div>
          </a>
        </li>
      )
    }
  }

  _empty () {
    return (
      <div id='tests-list-page'>
        <div className="empty-well">
          <h5>
            No files found in
            <code>{ this.props.project.path }</code>
          </h5>
            <a className='helper-docs-link' onClick={this._openHelp}>
              <i className='fa fa-question-circle'></i>{' '}
              Need help?
            </a>
        </div>
      </div>
    )
  }

  _openHelp () {
    App.ipc('external:open', 'https://on.cypress.io/guides/writing-your-first-test#section-test-files')
  }
}

export default Specs
