import _ from 'lodash'
import React, { Component } from 'react'
import { observer } from 'mobx-react'
import { action } from 'mobx'
import Loader from 'react-loader'

import App from '../lib/app'
import { clearRunAllActiveSpec } from '../lib/utils'
import { runSpec } from '../projects/projects-api'
import specsCollection from './specs-collection'

@observer
class Specs extends Component {
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
              <i className='fa fa-folder-open-o fa-fw'></i>
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
      let activeClass = spec.isChosen ? 'active' : ''

      return (
        <li key={spec.id} className='file'>
          <a href='#' onClick={this._selectSpec.bind(this, spec.id)} className={activeClass}>
            <div>
              <div>
                <i className={`fa fa-fw ${this._fileIcon(spec)}`}></i>
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

  _fileIcon (spec) {
    if (spec.isChosen) {
      return 'fa-wifi green'
    } else {
      return 'fa-file-code-o'
    }
  }

  _runAllSpecs (e) {
    e.preventDefault()

    action('spec:selected', specsCollection.setChosenSpec('__all'))

    let link = e.currentTarget

    link.classList.add('active')
    link.getElementsByTagName('i')[0].setAttribute('class', 'fa fa-wifi green fa-fw')

    let project = this.props.project

    runSpec(project, '__all', project.chosenBrowser.name)
  }

  _selectSpec (specId, e) {
    e.preventDefault()

    clearRunAllActiveSpec()

    action('spec:selected', specsCollection.setChosenSpec(specId))

    let project = this.props.project

    runSpec(project, specId, project.chosenBrowser.name)
  }

  _empty () {
    return (
      <div id='tests-list-page'>
        <div className="empty-well">
          <h5>
            No files found in
            <code onClick={this._openIntegrationFolder.bind(this)}>
              { this.props.project.integrationFolder }
            </code>
          </h5>
            <a className='helper-docs-link' onClick={this._openHelp}>
              <i className='fa fa-question-circle'></i>{' '}
              Need help?
            </a>
        </div>
      </div>
    )
  }

  _openIntegrationFolder () {
    App.ipc('open:finder', this.props.project.integrationFolder)
  }

  _openHelp (e) {
    e.preventDefault()
    App.ipc('external:open', 'https://on.cypress.io/guides/writing-your-first-test#section-test-files')
  }
}

export default Specs
