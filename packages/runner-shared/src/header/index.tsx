import cs from 'classnames'

import { action, computed, observable } from 'mobx'
import { observer } from 'mobx-react'
import React, { Component, createRef } from 'react'
import Tooltip from '@cypress/react-tooltip'
import $ from 'jquery'
import { ViewportInfo } from '../viewport-info'
import { SelectorPlayground } from '../selector-playground/SelectorPlayground'
import { selectorPlaygroundModel } from '../selector-playground'
import { Studio } from '../studio'
import type { EventManager } from '@packages/app/src/runner/event-manager'

interface BaseState {
  isLoading: boolean
  isRunning: boolean
  width: number
  height: number
  displayScale: number | undefined
  defaults: {
    width: number
    height: number
  }
  updateWindowDimensions: (payload: { headerHeight: number }) => void
}

interface StateCT {
  runner: 'component'
  state: {
    screenshotting: boolean
  } & BaseState
}

interface StateE2E {
  runner: 'e2e'
  state: {
    url: string
    isLoadingUrl: boolean
    highlightUrl: boolean
  } & BaseState
}

interface HeaderBaseProps {
  config: {
    configFile: string
    [k: string]: unknown
  }
  eventManager: EventManager
}

type CtHeaderProps = StateCT & HeaderBaseProps;

type E2EHeaderProps = StateE2E & HeaderBaseProps;

type HeaderProps = CtHeaderProps | E2EHeaderProps;

@observer
export class Header extends Component<HeaderProps> {
  @observable showingViewportMenu = false;
  @observable urlInput = '';
  @observable previousSelectorPlaygroundOpen: boolean = false;
  @observable previousRecorderIsOpen: boolean = false;

  urlInputRef = createRef<HTMLInputElement>();
  headerRef = createRef<HTMLHeadElement>();

  get studioForm () {
    if (this.props.runner !== 'e2e') {
      return
    }

    return (
      <form
        className={cs('url-container', {
          loading: this.props.runner === 'e2e' && this.props.state.isLoadingUrl,
          highlighted:
            this.props.runner === 'e2e' && this.props.state.highlightUrl,
          'menu-open': this._studioNeedsUrl,
        })}
        onSubmit={this._visitUrlInput}
      >
        <input
          ref={this.urlInputRef}
          type="text"
          className={cs('url', { 'input-active': this._studioNeedsUrl })}
          value={this._studioNeedsUrl ? this.urlInput : this.props.state.url}
          readOnly={!this._studioNeedsUrl}
          onChange={this._onUrlInput}
          onClick={this._openUrl}
        />
        <div className="popup-menu url-menu">
          <p>
            <strong>Please enter a valid URL to visit.</strong>
          </p>
          <div className="menu-buttons">
            <button
              type="button"
              className="btn-cancel"
              onClick={this._cancelStudio}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-submit"
              disabled={!this.urlInput}
            >
              {`Go `}
              <i className="fas fa-arrow-right" />
            </button>
          </div>
        </div>
        <span className="loading-container">
          ...loading
          {' '}
          <i className="fas fa-spinner fa-pulse" />
        </span>
      </form>
    )
  }

  render () {
    const { config, state } = this.props

    return (
      <header
        ref={this.headerRef}
        className={cs({
          'showing-selector-playground': selectorPlaygroundModel.isOpen,
          'showing-studio': this.props.eventManager.studioRecorder.isOpen,
          'display-none':
            this.props.runner === 'component' && this.props.state.screenshotting,
        })}
      >
        <div className="sel-url-wrap">
          <Tooltip
            title="Open Selector Playground"
            visible={
              selectorPlaygroundModel.isOpen || this.props.eventManager.studioRecorder.isOpen
                ? false
                : null
            }
            wrapperClassName="selector-playground-toggle-tooltip-wrapper"
            className="cy-tooltip"
          >
            <button
              aria-label="Open Selector Playground"
              className="header-button selector-playground-toggle"
              disabled={
                this.props.state.isLoading ||
                state.isRunning ||
                this.props.eventManager.studioRecorder.isOpen
              }
              onClick={this._togglePlaygroundOpen}
            >
              <i aria-hidden="true" className="fas fa-crosshairs" />
            </button>
          </Tooltip>
          <div
            className={cs('menu-cover', {
              'menu-cover-display': this._studioNeedsUrl,
            })}
          />
          {this.studioForm}
        </div>

        <ViewportInfo
          showingViewportMenu={this.showingViewportMenu}
          width={state.width}
          height={state.height}
          config={config}
          displayScale={
            this.props.runner === 'e2e' ? state.displayScale : undefined
          }
          defaults={{
            width: state.defaults.width,
            height: state.defaults.height,
          }}
          toggleViewportMenu={this._toggleViewportMenu}
        />

        <SelectorPlayground
          model={selectorPlaygroundModel}
          eventManager={this.props.eventManager}
        />
        {this.props.runner === 'e2e' && (
          <Studio model={this.props.eventManager.studioRecorder} hasUrl={!!this.props.state.url} />
        )}
      </header>
    )
  }

  @action componentDidMount () {
    this.previousSelectorPlaygroundOpen = selectorPlaygroundModel.isOpen
    this.previousRecorderIsOpen = this.props.eventManager.studioRecorder.isOpen

    this.urlInput = this.props.config.baseUrl
      ? `${this.props.config.baseUrl}/`
      : ''
  }

  @action componentDidUpdate () {
    if (
      selectorPlaygroundModel.isOpen !== this.previousSelectorPlaygroundOpen
    ) {
      this._updateWindowDimensions()
      this.previousSelectorPlaygroundOpen = selectorPlaygroundModel.isOpen
    }

    if (this.props.eventManager.studioRecorder.isOpen !== this.previousRecorderIsOpen) {
      this._updateWindowDimensions()
      this.previousRecorderIsOpen = this.props.eventManager.studioRecorder.isOpen
    }

    if (this._studioNeedsUrl && this.urlInputRef.current) {
      this.urlInputRef.current.focus()
    }
  }

  _togglePlaygroundOpen = () => {
    selectorPlaygroundModel.toggleOpen()
  };

  @action _toggleViewportMenu = () => {
    this.showingViewportMenu = !this.showingViewportMenu
  };

  _updateWindowDimensions = () => {
    if (!this.headerRef.current) {
      return
    }

    this.props.state.updateWindowDimensions({
      headerHeight: $(this.headerRef.current).outerHeight() as number,
    })
  };

  _openUrl = () => {
    if (this._studioNeedsUrl || this.props.runner !== 'e2e') {
      return
    }

    window.open(this.props.state.url)
  };

  @computed get _studioNeedsUrl () {
    if (this.props.runner !== 'e2e') {
      return
    }

    return this.props.eventManager.studioRecorder.needsUrl && !this.props.state.url
  }

  @action _onUrlInput = (e) => {
    // : React.FormEvent<HTMLInputElement>) => {
    if (!this._studioNeedsUrl) return

    this.urlInput = e.target.value
  };

  @action _visitUrlInput = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!this._studioNeedsUrl) return

    // Note: changes in TypeScript 4.4.4 made the code below fail the type check.
    // ts interprets visitUrl below as (url: null | undefined) => never
    // TODO: studio/studio-recorder.js should be converted to ts. And add proper type.
    // @ts-ignore
    this.props.eventManager.studioRecorder.visitUrl(this.urlInput)

    this.urlInput = ''
  };

  _cancelStudio = () => {
    this.props.eventManager.emit('studio:cancel')
  };
}
