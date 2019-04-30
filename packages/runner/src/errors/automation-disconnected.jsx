import React from 'react'

export default ({ onReload }) => (
  <div className='runner automation-failure'>
    <div className='automation-message automation-disconnected'>
      <p>Whoops, the Cypress Chrome extension has disconnected.</p>
      <p className='muted'>Cypress cannot run tests without this extension.</p>
      <button onClick={onReload}>
        <i className='fa fa-refresh'></i> Reload the Browser
      </button>
      <div className='helper-line'>
        <a href='https://on.cypress.io/guides/browser-management' target='_blank' rel='noopener noreferrer'>
          <i className='fa fa-question-circle'></i>
          Why am I seeing this message?
        </a>
      </div>
    </div>
  </div>
)
