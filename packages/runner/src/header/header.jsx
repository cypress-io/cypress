import cs from 'classnames'
import { action, observable } from 'mobx'
import { observer } from 'mobx-react'
import React, { Component } from 'react'
import Tooltip from '@cypress/react-tooltip'
import { $ } from '@packages/driver'

import { configFileFormatted } from '../lib/config-file-formatted'
import SelectorPlayground from '../selector-playground/selector-playground'
import selectorPlaygroundModel from '../selector-playground/selector-playground-model'

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
        })}
      >
        <div className='sel-url-wrap'>
          <Tooltip
            title='Open Selector Playground'
            visible={selectorPlaygroundModel.isOpen ? false : null}
            wrapperClassName='selector-playground-toggle-tooltip-wrapper'
            className='cy-tooltip'
          >
            <button
              aria-label='Open Selector Playground'
              className='selector-playground-toggle'
              onClick={this._togglePlaygroundOpen}
              disabled={state.isLoading || state.isRunning}
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
              ...loading <i className='fas fa-spinner fa-pulse'></i>
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
                  <i className='fas fa-info-circle'></i>
                  Read more about viewport here.
                </a>
              </p>
            </div>
          </li>
        </ul>
        <SelectorPlayground model={selectorPlaygroundModel} />
      </header>
    )
  }

  componentDidMount () {
    this.previousSelectorPlaygroundOpen = selectorPlaygroundModel.isOpen
  }

  componentDidUpdate () {
    if (selectorPlaygroundModel.isOpen !== this.previousSelectorPlaygroundOpen) {
      this.props.state.updateWindowDimensions({
        headerHeight: $(this.refs.header).outerHeight(),
      })

      this.previousSelectorPlaygroundOpen = selectorPlaygroundModel.isOpen
    }
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
