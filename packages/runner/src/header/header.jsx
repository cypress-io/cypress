import cs from 'classnames'

import { action, computed, observable } from 'mobx'
import { observer } from 'mobx-react'
import React, { Component, createRef } from 'react'
import Tooltip from '@cypress/react-tooltip'
// import State from '../lib/state'
// @ts-ignore
import { $ } from '@packages/driver'

import {
  SelectorPlayground,
  ViewportInfo,
  selectorPlaygroundModel,
  eventManager,
  Studio,
  studioRecorder,
} from '@packages/runner-shared'

@observer
export default class Header extends Component {
  @observable showingViewportMenu = false
  @observable urlInput = ''
  urlInputRef = createRef()

  render () {
    const { state, config } = this.props

    return (
      <header
        ref='header'
        className={cs({
          'showing-selector-playground': selectorPlaygroundModel.isOpen,
          'showing-studio': studioRecorder.isOpen,
        })}
      >
        <div className='sel-url-wrap'>
          <Tooltip
            title='Open Selector Playground'
            visible={selectorPlaygroundModel.isOpen || studioRecorder.isOpen ? false : null}
            wrapperClassName='selector-playground-toggle-tooltip-wrapper'
            className='cy-tooltip'
          >
            <button
              aria-label='Open Selector Playground'
              className='header-button selector-playground-toggle'
              onClick={this._togglePlaygroundOpen}
              disabled={state.isLoading || state.isRunning || studioRecorder.isOpen}
            >
              <i aria-hidden="true" className='fas fa-crosshairs' />
            </button>
          </Tooltip>
          <div className={cs('menu-cover', { 'menu-cover-display': this._studioNeedsUrl })} />
          <form
            className={cs('url-container', {
              'loading': state.isLoadingUrl,
              'highlighted': state.highlightUrl,
              'menu-open': this._studioNeedsUrl,
            })}
            onSubmit={this._visitUrlInput}
          >
            <input
              ref={this.urlInputRef}
              type='text'
              className={cs('url', { 'input-active': this._studioNeedsUrl })}
              value={this._studioNeedsUrl ? this.urlInput : state.url}
              readOnly={!this._studioNeedsUrl}
              onChange={this._onUrlInput}
              onClick={this._openUrl}
            />
            <div className='popup-menu url-menu'>
              <p><strong>Please enter a valid URL to visit.</strong></p>
              <div className='menu-buttons'>
                <button type='button' className='btn-cancel' onClick={this._cancelStudio}>Cancel</button>
                <button type='submit' className='btn-submit' disabled={!this.urlInput}>Go <i className='fas fa-arrow-right' /></button>
              </div>
            </div>
            <span className='loading-container'>
              ...loading <i className='fas fa-spinner fa-pulse' />
            </span>
          </form>
        </div>

        <ViewportInfo
          showingViewportMenu={this.showingViewportMenu}
          width={state.width}
          height={state.height}
          config={config}
          displayScale={state.displayScale}
          defaults={{
            width: state.defaults.width,
            height: state.defaults.height,
          }}
          toggleViewportMenu={this._toggleViewportMenu}
        />

        <SelectorPlayground
          model={selectorPlaygroundModel}
          eventManager={eventManager}
        />
        <Studio model={studioRecorder} hasUrl={!!state.url} />
      </header>
    )
  }

  @action componentDidMount () {
    this.previousSelectorPlaygroundOpen = selectorPlaygroundModel.isOpen
    this.previousRecorderIsOpen = studioRecorder.isOpen

    this.urlInput = this.props.config.baseUrl ? `${this.props.config.baseUrl}/` : ''
  }

  componentDidUpdate () {
    if (selectorPlaygroundModel.isOpen !== this.previousSelectorPlaygroundOpen) {
      this._updateWindowDimensions()
      this.previousSelectorPlaygroundOpen = selectorPlaygroundModel.isOpen
    }

    if (studioRecorder.isOpen !== this.previousRecorderIsOpen) {
      this._updateWindowDimensions()
      this.previousRecorderIsOpen = studioRecorder.isOpen
    }

    if (this._studioNeedsUrl) {
      this.urlInputRef.current.focus()
    }
  }

  _togglePlaygroundOpen = () => {
    selectorPlaygroundModel.toggleOpen()
  }

  @action _toggleViewportMenu = () => {
    this.showingViewportMenu = !this.showingViewportMenu
  }

  _updateWindowDimensions = () => {
    this.props.state.updateWindowDimensions({
      headerHeight: $(this.refs.header).outerHeight(),
    })
  }

  _openUrl = () => {
    if (this._studioNeedsUrl) return

    window.open(this.props.state.url)
  }

  @computed get _studioNeedsUrl () {
    return studioRecorder.needsUrl && !this.props.state.url
  }

  @action _onUrlInput = (e) => {
    if (!this._studioNeedsUrl) return

    this.urlInput = e.target.value
  }

  @action _visitUrlInput = (e) => {
    e.preventDefault()

    if (!this._studioNeedsUrl) return

    studioRecorder.visitUrl(this.urlInput)

    this.urlInput = ''
  }

  _cancelStudio = () => {
    eventManager.emit('studio:cancel')
  }
}
