import { observer } from 'mobx-react'
import React, { Component } from 'react'

@observer
export default class Header extends Component {
  render () {
    const { width, height, scale, defaults } = this.props.uiState

    // TODO: style url to look like input
    return (
      <header>
        <div id="url-container" className="pull-left">
          <div id="url-wrapper" className={this.props.uiState.loading ? 'loading' : ''}>
            <div className="url">{this.props.uiState.url}</div>
            <span className="loading-wrapper">
              <span className="loading-content">...loading</span>
              <i className="fa fa-spinner fa-spin"></i>
            </span>
          </div>
        </div>
        <ul className="iframe-menu">
          <li>
            <div className="dropdown pull-left">
              <button data-toggle="dropdown" className="btn btn-link">
                <span id="current-viewport-sizes">
                  {width} x {height} <span id="viewport-scale">({scale}%)</span>
                </span>
              </button>
              <div id="viewport-wrapper" className="dropdown-menu dropdown-menu-right">
                <p>The <strong>viewport</strong> determines the width and height of your application. By default the viewport will be <strong>{defaults.width}px</strong> by <strong>{defaults.height}px</strong> unless specified by a <code>cy.viewport</code> command.</p>
                <p>Additionally you can override the default viewport dimensions by specifying these values in your <code>cypress.json</code>.</p>
                <pre>
{`{
  viewportWidth: ${defaults.width},
  viewportHeight: ${defaults.height}
}`}
                </pre>
                <p id="viewport-link">
                  <a href="https://on.cypress.io/api/viewport" target="_blank">
                    <i className="fa fa-info-circle"></i>
                    Read more about viewport here.
                  </a>
                </p>
              </div>
            </div>
          </li>
        </ul>
      </header>
    )
  }
}
