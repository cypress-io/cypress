// @ts-check

import cs from 'classnames'
import _ from 'lodash'
import React, { Component } from 'react'
import { observer } from 'mobx-react'
import Loader from 'react-loader'
import Tooltip from '@cypress/react-tooltip'

import FileOpener from './file-opener'
import ipc from '../lib/ipc'
import projectsApi from '../projects/projects-api'
import specsStore, { allIntegrationSpecsSpec, allComponentSpecsSpec } from './specs-store'

/**
 * Returns a label text for a button.
 * @param {boolean} areTestsAlreadyRunning To form the message "running" vs "run"
 * @param {'integration'|'component'} specType Spec type should be included in the label
 * @param {number} specsN Number of specs to run or already running
*/
const formRunButtonLabel = (areTestsAlreadyRunning, specType, specsN) => {
  if (areTestsAlreadyRunning) {
    return `Running ${specType} tests`
  }

  const label = specsN === 1 ? `Run 1 ${specType} spec` : `Run ${specsN} ${specType} specs`

  return label
}

/**
 * Returns array of specs sorted with folders first, then file.
 * @param {any[]} specs array of specs with random order of 'file'/'folder'
 */
const sortedSpecList = (specs) => {
  let list = []
  let folders = []
  let files = []

  _.map(specs, (spec) => {
    if (spec.hasChildren) {
      folders.push(spec)
    } else {
      files.push(spec)
    }
  })

  list = list.concat(folders)
  list = list.concat(files)

  return list
}

// Note: this component can be mounted and unmounted
// if you need to persist the data through mounts, "save" it in the specsStore
@observer
class SpecsList extends Component {
  constructor (props) {
    super(props)
    this.filterRef = React.createRef()
    // when the specs are running and the user changes the search filter
    // we still want to show the previous button label to reflect what
    // is currently running
    this.runAllSavedLabel = null

    // @ts-ignore
    if (window.Cypress) {
      // expose project object for testing
      // @ts-ignore
      window.__project = this.props.project
    }
  }

  render () {
    if (specsStore.isLoading) return <Loader color='#888' scale={0.5}/>

    const filteredSpecs = specsStore.getFilteredSpecs()

    const integrationSpecsN = _.filter(filteredSpecs, { specType: 'integration' }).length
    const componentSpecsN = _.filter(filteredSpecs, { specType: 'component' }).length

    const hasSpecFilter = specsStore.filter
    const numberOfShownSpecs = filteredSpecs.length
    const hasNoSpecs = !hasSpecFilter && !numberOfShownSpecs

    if (hasNoSpecs) {
      return this._empty()
    }

    const areTestsRunning = this._areTestsRunning()

    // store in the component for ease of sharing with other methods
    this.integrationLabel = formRunButtonLabel(areTestsRunning, 'integration', integrationSpecsN)
    this.componentLabel = formRunButtonLabel(areTestsRunning, 'component', componentSpecsN)

    return (
      <div className='specs'>
        <header>
          <div className={cs('search', {
            'show-clear-filter': !!specsStore.filter,
          })}>
            <label htmlFor='filter'>
              <i className='fas fa-search' />
            </label>
            <input
              id='filter'
              className='filter'
              placeholder='Search...'
              value={specsStore.filter || ''}
              ref={this.filterRef}
              onChange={this._updateFilter}
              onKeyUp={this._executeFilterAction}
            />
            <Tooltip
              title='Clear search'
              className='browser-info-tooltip cy-tooltip'
            >
              <a className='clear-filter fas fa-times' onClick={this._clearFilter} />
            </Tooltip>
          </div>
        </header>
        {this._specsList()}
      </div>
    )
  }

  _specsList () {
    if (specsStore.filter && !specsStore.specs.length) {
      return (
        <div className='empty-well'>
          No specs match your search: "<strong>{specsStore.filter}</strong>"
          <br/>
          <a onClick={() => {
            this._clearFilter()
            this.filterRef.current.focus()
          }} className='btn btn-link'>
            <i className='fas fa-times'/> Clear search
          </a>
        </div>
      )
    }

    return (
      <ul className='specs-list list-as-table'>
        {_.map(specsStore.specs, (spec) => this._specItem(spec, 0))}
      </ul>
    )
  }

  _specItem (spec, nestingLevel) {
    return spec.hasChildren ? this._folderContent(spec, nestingLevel) : this._specContent(spec, nestingLevel)
  }

  _allSpecsIcon () {
    return this._areTestsRunning() ? 'far fa-dot-circle green' : 'fas fa-play'
  }

  _areTestsRunning () {
    if (!this.props.project) {
      return false
    }

    return this.props.project.browserState === 'opening'
      || this.props.project.browserState === 'opened'
  }

  _specIcon (isChosen) {
    return isChosen ? 'far fa-dot-circle green' : 'far fa-file'
  }

  _clearFilter = () => {
    const { id, path } = this.props.project

    specsStore.clearFilter({ id, path })
  }

  _updateFilter = (e) => {
    const { id, path } = this.props.project

    specsStore.setFilter({ id, path }, e.target.value)
  }

  _executeFilterAction = (e) => {
    if (e.key === 'Escape') {
      this._clearFilter()
    }
  }

  _selectSpec (spec, e) {
    e.preventDefault()
    e.stopPropagation()

    const { project } = this.props

    specsStore.setSelectedSpec(spec)

    if (spec.relative === '__all') {
      if (specsStore.filter) {
        const filteredSpecs = specsStore.getFilteredSpecs()
        const numberOfShownSpecs = filteredSpecs.length

        this.runAllSavedLabel = numberOfShownSpecs === 1
          ? 'Running 1 spec' : `Running ${numberOfShownSpecs} specs`
      } else {
        this.runAllSavedLabel = 'Running all specs'
      }
    } else {
      this.runAllSavedLabel = 'Running 1 spec'
    }

    return projectsApi.runSpec(project, spec, project.chosenBrowser, specsStore.filter)
  }

  _setExpandRootFolder (specFolderPath, isExpanded, e) {
    e.preventDefault()
    e.stopPropagation()

    specsStore.setExpandSpecChildren(specFolderPath, isExpanded)
    specsStore.setExpandSpecFolder(specFolderPath, true)
  }

  _selectSpecFolder (specFolderPath, e) {
    e.preventDefault()

    specsStore.toggleExpandSpecFolder(specFolderPath)
  }

  _folderContent (spec, nestingLevel) {
    const isExpanded = spec.isExpanded
    const specType = spec.specType || 'integration'

    // only applied to the top level for "integration" and "component" specs
    const getSpecRunButton = () => {
      const word = this._areTestsRunning() ? 'Running' : 'Run'
      let buttonText = spec.displayName === 'integration' ? this.integrationLabel : this.componentLabel

      if (this._areTestsRunning()) {
        // selected spec must be set
        if (specsStore.selectedSpec) {
          // only show the button matching current running spec type
          if (spec.specType !== specsStore.selectedSpec.specType) {
            return <></>
          }

          if (specsStore.selectedSpec.relative !== '__all') {
            // we are only running 1 spec
            buttonText = `${word} 1 spec`
          }
        }
      }

      const isActive = specType === 'integration'
        ? specsStore.isChosen(allIntegrationSpecsSpec)
        : specsStore.isChosen(allComponentSpecsSpec)
      const className = cs('btn-link all-tests', { active: isActive })

      return (<button
        className={className}
        title={`${word} ${specType} specs together`}
        onClick={this._selectSpec.bind(this,
          spec.displayName === 'integration' ? allIntegrationSpecsSpec : allComponentSpecsSpec)
        }><i className={`fa-fw ${this._allSpecsIcon()}`} />{' '}{buttonText}</button>)
    }

    return (
      <li key={spec.path} className={`folder level-${nestingLevel} ${isExpanded ? 'folder-expanded' : 'folder-collapsed'}`}>
        <div>
          <div className="folder-name" onClick={this._selectSpecFolder.bind(this, spec)}>
            <i className={`folder-collapse-icon fas fa-fw ${isExpanded ? 'fa-caret-down' : 'fa-caret-right'}`} />
            {nestingLevel !== 0 ? <i className={`far fa-fw ${isExpanded ? 'fa-folder-open' : 'fa-folder'}`} /> : null}
            {
              nestingLevel === 0 ?
                <>
                  {spec.displayName} tests
                  {specsStore.specHasFolders(spec) ?
                    <span>
                      <a onClick={this._setExpandRootFolder.bind(this, spec, false)}>collapse all</a>{' | '}
                      <a onClick={this._setExpandRootFolder.bind(this, spec, true)}>expand all</a>
                    </span> :
                    null
                  }
                </> :
                spec.displayName
            }
            {nestingLevel === 0 ? getSpecRunButton() : <></>}
          </div>
          {
            isExpanded ?
              <div>
                <ul className={`list-as-table ${specType}`}>
                  {_.map(sortedSpecList(spec.children), (spec) => this._specItem(spec, nestingLevel + 1))}
                </ul>
              </div> :
              null
          }
        </div>
      </li>

    )
  }

  _specContent (spec, nestingLevel) {
    const fileDetails = {
      absoluteFile: spec.absolute,
      originalFile: spec.relative,
      relativeFile: spec.relative,
    }

    const isActive = specsStore.isChosen(spec)
    const className = cs(`file level-${nestingLevel}`, { active: isActive })

    return (
      <li key={spec.path} className={className}>
        <a href='#' onClick={this._selectSpec.bind(this, spec)} className="file-name-wrapper">
          <div className="file-name">
            <i className={`fa-fw ${this._specIcon(specsStore.isChosen(spec))}`} />
            {spec.displayName}
          </div>
        </a>
        <FileOpener fileDetails={fileDetails} className="file-open-in-ide" />
      </li>
    )
  }

  _empty () {
    return (
      <div className='specs'>
        <div className='empty-well'>
          <h5>
            No files found in
            <code onClick={this._openIntegrationFolder.bind(this)}>
              {this.props.project.integrationFolder}
            </code>
          </h5>
          <a className='helper-docs-link' onClick={this._openHelp}>
            <i className='fas fa-question-circle' />{' '}
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

export default SpecsList
