import _ from 'lodash'
import React, { Component } from 'react'
import { observer } from 'mobx-react'
import Loader from 'react-loader'

import ipc from '../lib/ipc'
import { runSpec } from '../projects/projects-api'
import specsCollection from './specs-collection'

@observer
class Specs extends Component {
  render () {
    if (specsCollection.isLoading) return <Loader color="#888" scale={0.5}/>

    if (!specsCollection.specs.length) return this._empty()

    let allActiveClass = specsCollection.allSpecsChosen ? 'active' : ''

    return (
      <div id='tests-list-page'>
        <a onClick={this._runAllSpecs.bind(this)} className={`all-tests btn btn-link ${allActiveClass}`}>
          <i className={`fa fa-fw ${this._allSpecsIcon(specsCollection.allSpecsChosen)}`}></i>{' '}
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
        <li key={spec.path} className='folder'>
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
        <li key={spec.path} className='file'>
          <a href='#' onClick={this._selectSpec.bind(this, spec.path)} className={activeClass}>
            <div>
              <div>
                <i className={`fa fa-fw ${this._specIcon(spec.isChosen)}`}></i>
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

  _allSpecsIcon (bool) {
    if (bool) {
      return 'fa-dot-circle-o green'
    } else {
      return 'fa-play'
    }
  }

  _specIcon (bool) {
    if (bool) {
      return 'fa-dot-circle-o green'
    } else {
      return 'fa-file-code-o'
    }
  }

  _runAllSpecs (e) {
    e.preventDefault()

    specsCollection.setChosenSpec('__all')

    let project = this.props.project

    runSpec(project, '__all', project.chosenBrowser.name)
  }

  _selectSpec (specPath, e) {
    e.preventDefault()

    specsCollection.setChosenSpec(specPath)

    let project = this.props.project

    runSpec(project, specPath, project.chosenBrowser.name)
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
    ipc.openFinder(this.props.project.integrationFolder)
  }

  _openHelp (e) {
    e.preventDefault()
    ipc.externalOpen('https://on.cypress.io/writing-first-test')
  }
}

export default Specs
