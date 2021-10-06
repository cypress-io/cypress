import React from 'react'
import cs from 'classnames'

import { namedObserver } from '../mobx'
import { configFileFormatted } from '../config-file-formatted'

interface ViewportInfoProps {
  showingViewportMenu: boolean
  width: number
  height: number
  displayScale: number | undefined
  config: {
    configFile: unknown // Similar to Cypress.RuntimeConfigOptions, but has some extra properties
    [key: string]: unknown
  }
  defaults: {
    width: number
    height: number
  }
  toggleViewportMenu: () => void
}

export const ViewportInfo: React.FC<ViewportInfoProps> = namedObserver('ViewportInfo', ({
  showingViewportMenu,
  width,
  height,
  displayScale,
  defaults,
  config,
  toggleViewportMenu,
}: ViewportInfoProps) => {
  return (
    <ul className='menu'>
      <li className={cs('viewport-info', { 'menu-open': showingViewportMenu })}>
        <button onClick={toggleViewportMenu}>
          {width}
          {' '}
          <span className='the-x'>x</span>
          {' '}
          {height}
          {' '}
          <span className='viewport-scale'>
            {displayScale && `(${displayScale}%)`}
          </span>
          <i className='fas fa-fw fa-info-circle'></i>
        </button>
        <div className='popup-menu viewport-menu'>
          {/* eslint-disable react/jsx-one-expression-per-line */}
          <p>The <strong>viewport</strong> determines the width and height of your application. By default the viewport will be
            <strong>{` ${defaults.width}`}px</strong> by
            <strong>{` ${defaults.height}`}px</strong> unless specified by a
            {' '}<code>cy.viewport</code> command.
          </p>
          <p>Additionally you can override the default viewport dimensions by specifying these values in your {configFileFormatted(config.configFile)}.</p>
          <pre>{/* eslint-disable indent */}
            {`{
  "viewportWidth": ${defaults.width},
  "viewportHeight": ${defaults.height}
}`}
          </pre>
          {/* eslint-enable indent */}
          <p>
            <a href='https://on.cypress.io/viewport' target='_blank' rel='noreferrer'>
              <i className='fas fa-info-circle'></i>
              Read more about viewport here.
            </a>
          </p>
          {/* eslint-enable react/jsx-one-expression-per-line */}
        </div>
      </li>
    </ul>
  )
})
