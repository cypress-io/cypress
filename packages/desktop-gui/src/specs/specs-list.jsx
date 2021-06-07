// @ts-check

import cs from 'classnames'
import _ from 'lodash'
import React, { Component } from 'react'
import { observer } from 'mobx-react'
import Loader from 'react-loader'
import Tooltip from '@cypress/react-tooltip'

import FileOpener from './file-opener'
import Notification from '../notifications/notification'
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
    this.state = {
      isFocused: false,
    }

    this.filterRef = React.createRef()
    this.newSpecRef = React.createRef()
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

    this.state = {
      firstTestBannerDismissed: false,
    }
  }

  componentDidUpdate () {
    if (this.newSpecRef.current) {
      this.newSpecRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
      // unset new spec after animation to prevent further scrolling
      this.removeNewSpecTimeout = setTimeout(() => specsStore.setNewSpecPath(null), 3000)
    }
  }

  componentWillUnmount () {
    if (this.removeNewSpecTimeout) {
      clearTimeout(this.removeNewSpecTimeout)
    }

    specsStore.setNewSpecPath(null)
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
        {this._firstTestBanner()}
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
              placeholder={this._togglePlaceholderSearchTips()}
              value={specsStore.filter || ''}
              ref={this.filterRef}
              onBlur={this._toggleFocus}
              onChange={this._updateFilter}
              onFocus={this._toggleFocus}
              onKeyUp={this._executeFilterAction}
            />

            { window.addEventListener('keydown', this._focusWhenSearchKeys) }

            <Tooltip
              title='Clear search'
              className='browser-info-tooltip cy-tooltip'
            >
              <a className='clear-filter fas fa-times' onClick={this._clearFilter} />
            </Tooltip>
          </div>
          <div className='new-file-button'>
            <button className='btn btn-link' onClick={this._createNewFile}><i className="fa fa-plus"></i> New Spec File</button>
          </div>
        </header>
        {this._specsList()}
        {this._newSpecNotification()}
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

  _toggleFocus = () => {
    this.setState({
      isFocused: !this.state.isFocused,
    })
  }

  _searchPlaceholderText () {
    const osKey = window.clientInformation['platform'] === 'MacIntel' ? 'Cmd' : 'Ctrl'

    return `Press ${osKey} + F to search...`
  }

  _togglePlaceholderSearchTips = () => {
    return (this.state.isFocused) ? 'Search' : this._searchPlaceholderText()
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

  _focusWhenSearchKeys = (e) => {
    const keysForMacOs = (e.metaKey && e.keyCode === 70 && window.clientInformation['platform'] === 'MacIntel')
    const keysForOtherOs = (e.keyCode === 114 || (e.ctrlKey && e.keyCode === 70 && window.clientInformation['platform'] !== 'MacIntel'))

    return (keysForOtherOs || keysForMacOs)
      // @ts-ignore
      ? document.querySelector('#filter').focus()
      : ''
  }

  _selectSpec (spec, e) {
    e.preventDefault()
    e.stopPropagation()

    if (specsStore.isChosen(spec)) return

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

  _openSpecFolder (specFolderPath, e) {
    if (e.key === 'Enter' || e.keyCode === 32) specsStore.toggleExpandSpecFolder(specFolderPath)
  }

  _createNewFile = (e) => {
    e.preventDefault()
    e.stopPropagation()

    ipc.showNewSpecDialog().then(({ specs, path }) => {
      if (path) {
        specsStore.setNewSpecPath(path)
        specsStore.setSpecs(specs)
      }
    })
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

    const tabIndex = 0

    return (
      <li key={spec.path} className={`folder level-${nestingLevel} ${isExpanded ? 'folder-expanded' : 'folder-collapsed'}`}>
        <div>
          <div tabIndex={tabIndex} className="folder-name" onKeyDown={this._openSpecFolder.bind(this, spec)} onClick={this._selectSpecFolder.bind(this, spec)}>
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
    const isNew = specsStore.isNew(spec)
    const className = cs(`file level-${nestingLevel}`, { active: isActive, 'new-spec': isNew })

    return (
      <li key={spec.path} className={className} ref={isNew ? this.newSpecRef : null}>
        <a href='#' onClick={this._selectSpec.bind(this, spec)} className="file-name-wrapper">
          <div className="file-name">
            <i className={`fa-fw ${this._specIcon(isActive)}`} />
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
            <code onClick={this._openIntegrationFolder}>
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

  _firstTestBanner () {
    if (!this.props.project.isNew || this.state.firstTestBannerDismissed) return

    return (
      <div className="first-test-banner alert alert-info alert-dismissible">
        <p>We've created some sample tests around key Cypress concepts. Run the first one or create your own test file.</p>
        <p><a onClick={this._openHelp}>How to write tests</a></p>
        <button className="close" onClick={this._removeFirstTestBanner}><span>&times;</span></button>
      </div>
    )
  }

  _newSpecNotification () {
    return (
      <Notification className='new-spec-warning' show={specsStore.showNewSpecWarning} onClose={specsStore.dismissNewSpecWarning}>
        <i className='fas fa-exclamation-triangle' />
        Your file has been successfully created.
        However, since it was created outside of your integration folder or is not recognized as a spec file, it won't be visible in this list.
      </Notification>
    )
  }

  _openIntegrationFolder = () => {
    ipc.openFinder(this.props.project.integrationFolder)
  }

  _openHelp (e) {
    e.preventDefault()
    ipc.externalOpen('https://on.cypress.io/writing-first-test')
  }

  _removeFirstTestBanner = () => {
    this.setState({ firstTestBannerDismissed: true })
  }
}

export default SpecsList
