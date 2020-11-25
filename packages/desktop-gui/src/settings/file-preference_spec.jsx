import FilePreference from './file-preference'
import React from 'react'
import { mount } from 'cypress-react-unit-test'
import Collapse, { Panel } from 'rc-collapse'
import ipc from '../lib/ipc'

/* global cy, Cypress */
describe('FilePreference', () => {
  const availableEditors = [
    { id: 'atom', name: 'Atom', isOther: false, openerId: 'atom' },
    { id: 'vim', name: 'Vim', isOther: false, openerId: 'vim' },
    { id: 'sublime', name: 'Sublime Text', isOther: false, openerId: 'sublime' },
    { id: 'vscode', name: 'Visual Studio Code', isOther: false, openerId: 'vscode' },
    { id: 'other', name: 'Other', isOther: true, openerId: '' },
  ]

  it('shows editor choice', () => {
    const editorsAfterDelay = Cypress.Promise.resolve({ availableEditors, preferredOpener: availableEditors[3] }).delay(2000)

    cy.stub(ipc, 'getUserEditor').resolves(editorsAfterDelay)

    mount(
      <div className="settings">
        <div className="settings-wrapper">
          <Collapse>
            <Panel header='File Opener Preference' key='file-preference' className='form-horizontal settings-file-preference'>
              <FilePreference />
            </Panel>
          </Collapse>
        </div>
      </div>,
      { alias: 'FilePreference', stylesheets: '/__root/dist/app.css' },
    )

    cy.get('.file-preference').should('not.exist')
    cy.log('**Opening file preferences**')
    cy.contains('File Opener Preference').click()
    cy.get('.file-preference').should('be.visible')
    cy.get('.loading-editors').should('be.visible')

    cy.log('**Editors loaded**')
    cy.get('.loading-editors').should('not.exist')
    cy.contains('Visual Studio Code').closest('li').should('have.class', 'is-selected')
  })
})
