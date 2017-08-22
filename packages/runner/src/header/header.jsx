import cs from 'classnames'
import { observer } from 'mobx-react'
import React, { Component } from 'react'

@observer
export default class Header extends Component {
  constructor (props) {
    super(props)

    this.state = { showingViewportMenu: false }
  }

  render () {
    const { width, height, displayScale, defaults, isLoading, url, highlightUrl } = this.props.state
    const { showingViewportMenu } = this.state

    return (
      <header>
        <div
          className={cs('url-container', {
            loading: isLoading,
            highlighted: highlightUrl,
          })}
        >
          <input className='url' value={url} readOnly onClick={this._openUrl} />
          <span className='loading-container'>
            ...loading <i className='fa fa-spinner fa-spin fa-pulse'></i>
          </span>
        </div>
        <ul className='menu'>
          <li className={cs('viewport-info', { open: showingViewportMenu })}>
            <button onClick={this._toggleViewportMenu}>
              <i className='fa fa-fw'></i>
              {width} x {height} <span className='viewport-scale'>({displayScale}%)</span>
            </button>
            <div className='viewport-menu'>
              <p>The <strong>viewport</strong> determines the width and height of your application. By default the viewport will be <strong>{defaults.width}px</strong> by <strong>{defaults.height}px</strong> unless specified by a <code>cy.viewport</code> command.</p>
              <p>Additionally you can override the default viewport dimensions by specifying these values in your <code>cypress.json</code>.</p>
              <pre>{/* eslint-disable indent */}
{`{
  viewportWidth: ${defaults.width},
  viewportHeight: ${defaults.height}
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
      </header>
    )
  }

  _openUrl = () => {
    window.open(this.props.state.url)
  }

  _toggleViewportMenu = () => {
    this.setState({ showingViewportMenu: !this.state.showingViewportMenu })
  }
}
