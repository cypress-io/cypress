import React from 'react'

export default ({ onReload }) => (
  <div className='runner automation-failure'>
    <div className='automation-message automation-disconnected'>
      <p>Whoops, the Cypress extension has disconnected.</p>
      <p className='muted'>Cypress cannot run tests without this extension.</p>
      <button onClick={onReload}>
        <i className='fas fa-sync-alt'></i> Reload the Browser
      </button>
      <div className='helper-line'>
        <a href='https://on.cypress.io/launching-browsers' target='_blank'>
          <i className='fas fa-question-circle'></i>
          Why am I seeing this message?
        </a>
      </div>
    </div>
  </div>
)
