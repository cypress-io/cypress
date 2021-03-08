import cs from 'classnames'

import { action, observable } from 'mobx'
import { observer } from 'mobx-react'
import React, { Component } from 'react'
import Tooltip from '@cypress/react-tooltip'
import State from '../lib/state'

import { configFileFormatted } from '../lib/config-file-formatted'
import SelectorPlayground from '../selector-playground/selector-playground'
import selectorPlaygroundModel from '../selector-playground/selector-playground-model'
import { ExtendedConfigOptions } from '../app/RunnerCt'

interface HeaderProps {
  state: State
  config: ExtendedConfigOptions
}

@observer
export default class Header extends Component<HeaderProps> {
  headerRef = React.createRef()

  @observable showingViewportMenu = false

  render () {
    const { state, config } = this.props

    return (
      <header
        ref={this.headerRef}
        className={cs({
          'showing-selector-playground': selectorPlaygroundModel.isOpen,
          'display-none': state.screenshotting,
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
              className='header-button selector-playground-toggle'
              onClick={this._togglePlaygroundOpen}
              disabled={state.isLoading || state.isRunning}
            >
              <i aria-hidden="true" className='fas fa-crosshairs' />
            </button>
          </Tooltip>
        </div>
        <ul className='menu'>
          <li className={cs('viewport-info', { 'menu-open': this.showingViewportMenu })}>
            <button onClick={this._toggleViewportMenu}>
              {state.viewportWidth} <span className='the-x'>x</span> {state.viewportHeight}
              <i className='fas fa-fw fa-info-circle'></i>
            </button>
            <div className='popup-menu viewport-menu'>
              <p>The <strong>viewport</strong> determines the width and height of your application. By default the viewport will be
                <strong>{state.defaults.viewportWidth}px</strong> by
                <strong>{state.defaults.viewportHeight}px</strong> unless specified by a
                <code>cy.viewport</code> command.</p>
              <p>Additionally you can override the default viewport dimensions by specifying these values in your {configFileFormatted(config.configFile)}.</p>
              <pre>{/* eslint-disable indent */}
                {`{
  "viewportWidth": ${state.defaults.viewportWidth},
  "viewportHeight": ${state.defaults.viewportHeight}
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
        headerHeight: this.headerRef.current.offsetHeight,
      })

      this.previousSelectorPlaygroundOpen = selectorPlaygroundModel.isOpen
    }
  }

  _togglePlaygroundOpen = () => {
    selectorPlaygroundModel.toggleOpen()
  }

  @action _toggleViewportMenu = () => {
    this.showingViewportMenu = !this.showingViewportMenu
  }
}
