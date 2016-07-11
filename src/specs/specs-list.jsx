/*global $*/

import _ from 'lodash'
import React, { Component } from 'react'
import { observer } from 'mobx-react'

import App from '../lib/app'
import { getSpecs } from './specs-api'
import { launchBrowser } from '../projects/projects-api'
import specsCollection from './specs-collection'
import Loader from 'react-loader'

@observer
class Specs extends Component {
  constructor (props) {
    super(props)

    getSpecs(this.props.project)
  }

  render () {
    if (specsCollection.isLoading) return <Loader color="#888" scale={0.5}/>

    if (!specsCollection.specs.length) return this._empty()

    return (
      <div id='tests-list-page'>
        <a onClick={this._runAllSpecs.bind(this)} className="all-tests btn btn-link">
          <i className="fa fa-play"></i>{' '}
          Run All Tests
        </a>
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
              <i className='fa fa-folder-open-o'></i>
              { spec.name }{' '}
            </div>
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
          <a href='#' onClick={this._selectSpec.bind(this, spec)}>
            <div>
              <div>
                <i className='fa fa-file-code-o'></i>
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

  _runAllSpecs (e) {
    e.preventDefault()

    let project = this.props.project

    launchBrowser(project, '__all', project.chosenBrowser.name)
  }

  _selectSpec (spec, e) {
    e.preventDefault()

    $('.file>a.active').removeClass('active')

    e.currentTarget.classList.add('active')

    let project = this.props.project

    launchBrowser(project, spec.id, project.chosenBrowser.name)
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

  _openHelp (e) {
    e.preventDefault()
    App.ipc('external:open', 'https://on.cypress.io/guides/writing-your-first-test#section-test-files')
  }
}

export default Specs
