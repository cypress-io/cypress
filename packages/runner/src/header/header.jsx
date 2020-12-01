import cs from 'classnames'
import { action, observable } from 'mobx'
import { observer } from 'mobx-react'
import React, { Component } from 'react'
import Tooltip from '@cypress/react-tooltip'
import { $ } from '@packages/driver'

import { configFileFormatted } from '../lib/config-file-formatted'
import SelectorPlayground from '../selector-playground/selector-playground'
import selectorPlaygroundModel from '../selector-playground/selector-playground-model'
import Studio from '../studio/studio'
import studioRecorder from '../studio/studio-recorder'

@observer
export default class Header extends Component {
  @observable showingViewportMenu = false

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
            visible={selectorPlaygroundModel.isOpen || studioRecorder.isActive ? false : null}
            wrapperClassName='selector-playground-toggle-tooltip-wrapper'
            className='cy-tooltip'
          >
            <button
              aria-label='Open Selector Playground'
              className='header-button selector-playground-toggle'
              onClick={this._togglePlaygroundOpen}
              disabled={state.isLoading || state.isRunning || studioRecorder.isActive}
            >
              <i aria-hidden="true" className='fas fa-crosshairs' />
            </button>
          </Tooltip>
          <div
            className={cs('url-container', {
              'loading': state.isLoadingUrl,
              'highlighted': state.highlightUrl,
            })}
          >
            <input className='url' value={state.url} readOnly onClick={this._openUrl} />
            <span className='loading-container'>
              ...loading <i className='fas fa-spinner fa-pulse' />
            </span>
          </div>
        </div>
        <ul className='menu'>
          <li className={cs('viewport-info', { 'open': this.showingViewportMenu })}>
            <button onClick={this._toggleViewportMenu}>
              {state.width} <span className='the-x'>x</span> {state.height} <span className='viewport-scale'>({state.displayScale}%)</span>
              <i className='fas fa-fw fa-info-circle'></i>
            </button>
            <div className='viewport-menu'>
              <p>The <strong>viewport</strong> determines the width and height of your application. By default the viewport will be <strong>{state.defaults.width}px</strong> by <strong>{state.defaults.height}px</strong> unless specified by a <code>cy.viewport</code> command.</p>
              <p>Additionally you can override the default viewport dimensions by specifying these values in your {configFileFormatted(config.configFile)}.</p>
              <pre>{/* eslint-disable indent */}
                {`{
  "viewportWidth": ${state.defaults.width},
  "viewportHeight": ${state.defaults.height}
}`}
              </pre>{/* eslint-enable indent */}
              <p>
                <a href='https://on.cypress.io/viewport' target='_blank'>
                  <i className='fas fa-info-circle' />
                  Read more about viewport here.
                </a>
              </p>
            </div>
          </li>
        </ul>
        <SelectorPlayground model={selectorPlaygroundModel} />
        <Studio model={studioRecorder} />
      </header>
    )
  }

  componentDidMount () {
    this.previousSelectorPlaygroundOpen = selectorPlaygroundModel.isOpen
    this.previousRecorderIsOpen = studioRecorder.isOpen
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
  }

  _updateWindowDimensions = () => {
    this.props.state.updateWindowDimensions({
      headerHeight: $(this.refs.header).outerHeight(),
    })
  }

  _togglePlaygroundOpen = () => {
    selectorPlaygroundModel.toggleOpen()
  }

  _openUrl = () => {
    window.open(this.props.state.url)
  }

  @action _toggleViewportMenu = () => {
    this.showingViewportMenu = !this.showingViewportMenu
  }
}
