import cs from 'classnames'
import _ from 'lodash'
import React, { Component } from 'react'
import { observer } from 'mobx-react'
import Loader from 'react-loader'

import ipc from '../lib/ipc'
import projectsApi from '../projects/projects-api'
import specsStore from './specs-store'

@observer
class Specs extends Component {
  render () {
    if (specsStore.isLoading) return <Loader color='#888' scale={0.5}/>

    if (!specsStore.filter && !specsStore.specs.length) return this._empty()

    const allSpecsSpec = specsStore.getAllSpecsSpec()

    return (
      <div id='tests-list-page'>
        <header>
          <div className={cs('search', {
            'show-clear-filter': !!specsStore.filter,
          })}>
            <label htmlFor='filter'>
              <i className='fa fa-search'></i>
            </label>
            <input
              id='filter'
              className='filter'
              placeholder='Search...'
              value={specsStore.filter || ''}
              onChange={this._updateFilter}
              onKeyUp={this._executeFilterAction}
            />
            <a className='clear-filter fa fa-times' onClick={this._clearFilter} />
          </div>
          <a onClick={this._selectSpec.bind(this, allSpecsSpec)} className={cs('all-tests btn btn-default', { active: allSpecsSpec.isChosen })}>
            <i className={`fa fa-fw ${this._allSpecsIcon(allSpecsSpec.isChosen)}`}></i>{' '}
            {allSpecsSpec.displayName}
          </a>
        </header>
        {this._specsList()}
      </div>
    )
  }

  _specsList () {
    if (specsStore.filter && !specsStore.specs.length) {
      return (
        <div className='empty-well'>
          No files match the filter '{specsStore.filter}'
        </div>
      )
    }

    return (
      <ul className='outer-files-container list-as-table'>
        {_.map(specsStore.specs, (spec) => this._specItem(spec))}
      </ul>
    )
  }

  _specItem (spec) {
    if (spec.hasChildren()) {
      return this._folderContent(spec)
    } else {
      return this._specContent(spec)
    }
  }

  _allSpecsIcon (allSpecsChosen) {
    if (allSpecsChosen) {
      return 'fa-dot-circle-o green'
    } else {
      return 'fa-play'
    }
  }

  _specIcon (isChosen) {
    if (isChosen) {
      return 'fa-dot-circle-o green'
    } else {
      return 'fa-file-code-o'
    }
  }

  _clearFilter = () => {
    specsStore.clearFilter(this.props.project.id)
  }

  _updateFilter = (e) => {
    specsStore.setFilter(this.props.project.id, e.target.value)
  }

  _executeFilterAction = (e) => {
    if (e.key === 'Escape') {
      this._clearFilter()
    }
  }

  _selectSpec (spec, e) {
    e.preventDefault()

    const { project } = this.props

    return projectsApi.runSpec(project, spec, project.chosenBrowser)
  }

  _selectSpecFolder (specFolderPath, e) {
    e.preventDefault()

    specsStore.setExpandSpecFolder(specFolderPath)
  }

  _folderContent (spec) {
    const isExpanded = spec.isExpanded

    return (
      <li key={spec.path} className={`folder  ${isExpanded ? 'folder-expanded' : 'folder-collapsed'}`}>
        <div>
          <div onClick={this._selectSpecFolder.bind(this, spec)}>
            <i className={`folder-collapse-icon fa fa-fw ${isExpanded ? 'fa-caret-down' : 'fa-caret-right'}`}></i>
            <i className={`fa fa-fw ${isExpanded ? 'fa-folder-open-o' : 'fa-folder-o'}`}></i>
            <div className='folder-display-name'>{spec.displayName}{' '}</div>
          </div>
          {
            isExpanded ?
              <div>
                <ul className='list-as-table'>
                  {_.map(spec.children, (spec) => this._specItem(spec))}
                </ul>
              </div> :
              null
          }
        </div>
      </li>
    )
  }

  _specContent (spec) {
    return (
      <li key={spec.path} className='file'>
        <a href='#' onClick={this._selectSpec.bind(this, spec)} className={cs({ active: spec.isChosen })}>
          <div>
            <div>
              <i className={`fa fa-fw ${this._specIcon(spec.isChosen)}`}></i>
              {spec.displayName}
            </div>
          </div>
          <div>
            <div></div>
          </div>
        </a>
      </li>
    )
  }

  _empty () {
    return (
      <div id='tests-list-page'>
        <div className='empty-well'>
          <h5>
            No files found in
            <code onClick={this._openIntegrationFolder.bind(this)}>
              {this.props.project.integrationFolder}
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
