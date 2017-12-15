import cs from 'classnames'
import { action, observable } from 'mobx'
import { observer } from 'mobx-react'
import React, { Component } from 'react'
import Tooltip from '@cypress/react-tooltip'
import { $ } from '@packages/driver'

import SelectorHelper from '../selector-helper/selector-helper'
import selectorHelperModel from '../selector-helper/selector-helper-model'

@observer
export default class Header extends Component {
  @observable showingViewportMenu = false

  render () {
    const { state } = this.props

    return (
      <header
        ref='header'
        className={cs({
          'showing-selector-helper': selectorHelperModel.isEnabled,
        })}
      >
        <div className='sel-url-wrap'>
          <Tooltip
            title='Open Selector Playground'
            wrapperClassName='selector-helper-toggle-tooltip-wrapper'
          >
            <button
              className='selector-helper-toggle'
              onClick={this._toggleSelectorHelper}
              disabled={state.isLoading || state.isRunning}
            >
              <i className='fa fa-chevron-down' />
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
              ...loading <i className='fa fa-spinner fa-spin fa-pulse'></i>
            </span>
          </div>
        </div>
        <ul className='menu'>
          <li className={cs('viewport-info', { open: this.showingViewportMenu })}>
            <button onClick={this._toggleViewportMenu}>
              {state.width} x {state.height} <span className='viewport-scale'>({state.displayScale}%)</span>
              <i className='fa fa-fw fa-info-circle'></i>
            </button>
            <div className='viewport-menu'>
              <p>The <strong>viewport</strong> determines the width and height of your application. By default the viewport will be <strong>{state.defaults.width}px</strong> by <strong>{state.defaults.height}px</strong> unless specified by a <code>cy.viewport</code> command.</p>
              <p>Additionally you can override the default viewport dimensions by specifying these values in your <code>cypress.json</code>.</p>
              <pre>{/* eslint-disable indent */}
{`{
  viewportWidth: ${state.defaults.width},
  viewportHeight: ${state.defaults.height}
}`}
              </pre>{/* eslint-enable indent */}
              <p>
                <a href='https://on.cypress.io/viewport' target='_blank' rel="noopener noreferrer">
                  <i className='fa fa-info-circle'></i>
                  Read more about viewport here.
                </a>
              </p>
            </div>
          </li>
        </ul>
        <SelectorHelper model={selectorHelperModel} />
      </header>
    )
  }

  componentDidMount () {
    this.previousSelectorHelperEnabled = selectorHelperModel.isEnabled
  }

  componentDidUpdate () {
    if (selectorHelperModel.isEnabled !== this.previousSelectorHelperEnabled) {
      this.props.state.updateWindowDimensions({
        headerHeight: $(this.refs.header).outerHeight(),
      })
      this.previousSelectorHelperEnabled = selectorHelperModel.isEnabled
    }
  }

  _toggleSelectorHelper = () => {
    selectorHelperModel.toggleEnabled()
  }

  _openUrl = () => {
    window.open(this.props.state.url)
  }

  @action _toggleViewportMenu = () => {
    this.showingViewportMenu = !this.state.showingViewportMenu
  }
}
