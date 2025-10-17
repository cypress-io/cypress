import React from 'react'
import Command from './command'
import CommandModel from './command-model'
import type { SessionStatus } from '../sessions/utils'
import type { TestState } from '@packages/types'
import appState from '../lib/app-state'

describe('commands', () => {
  describe('test states', () => {
    it('warned command', () => {
      cy.mount(
        <div>
          <Command
            key={status}
            model={
              new CommandModel({
                name: 'session',
                message: 'user1',
                state: 'warned',
                sessionInfo: {
                  id: 'user1',
                  isGlobalSession: false,
                  status: 'recreated',
                },
                number: 1,
                type: 'parent',
                hookId: '1',
                testId: '1',
                id: 1,
                numElements: 1,
              })
            }
            scrollIntoView={() => {}}
            aliasesWithDuplicates={[]}
          />
        </div>,
      )

      cy.percySnapshot()
    })
  })

  describe('sessionPill', () => {
    const statusList: Array<{
      state: TestState
      status: SessionStatus
    }> = [
      {
        state: 'pending',
        status: 'creating',
      },
      {
        state: 'passed',
        status: 'created',
      },
      {
        state: 'pending',
        status: 'restoring',
      },
      {
        state: 'passed',
        status: 'restored',
      },
      {
        state: 'warned',
        status: 'recreating',
      },
      {
        state: 'warned',
        status: 'recreated',
      },
      {
        state: 'failed',
        status: 'failed',
      },
      {
        state: 'passed',
        status: 'created',
      },
    ]

    it('session status in command', () => {
      cy.mount(
        <div>
          {statusList.map(({ state, status }, index) => (
            <Command
              key={status}
              model={
                new CommandModel({
                  name: 'session',
                  message: 'user1',
                  state,
                  sessionInfo: {
                    id: 'user1',
                    isGlobalSession: false,
                    status,
                  },
                  number: index,
                  type: 'parent',
                  hookId: '1',
                  testId: '1',
                  id: index,
                  numElements: 1,
                })
              }
              scrollIntoView={() => {}}
              aliasesWithDuplicates={[]}
            />
          ))}
        </div>,
      )

      cy.get('.command-name-session').last().click()

      cy.percySnapshot()
    })
  })

  describe('prompt', () => {
    let config

    beforeEach(() => {
      config = cy.stub(Cypress, 'config').log(false).callThrough()
    })

    it('should render prompt get code button when state is passed', () => {
      config.withArgs('experimentalPromptCommand').returns(true)
      config.withArgs('isTextTerminal').returns(false)
      cy.mount(
        <div>
          <Command
            model={
              new CommandModel({
                name: 'prompt',
                state: 'passed',
                numElements: 1,
                hookId: '1',
                id: 1,
                testId: '1',
              })
            }
            scrollIntoView={() => {}}
            aliasesWithDuplicates={[]}
          />
        </div>,
      )

      cy.get('.command-prompt-get-code').should('be.visible').should('have.text', 'Get code')
      cy.get('.command-prompt-get-code-indicator').should('be.visible')

      cy.percySnapshot()
    })

    it('should render prompt get code button when state is failed', () => {
      config.withArgs('experimentalPromptCommand').returns(true)
      config.withArgs('isTextTerminal').returns(false)
      cy.mount(
        <div>
          <Command
            model={
              new CommandModel({
                name: 'prompt',
                state: 'failed',
                numElements: 1,
                hookId: '1',
                id: 1,
                testId: '1',
              })
            }
            scrollIntoView={() => {}}
            aliasesWithDuplicates={[]}
          />
        </div>,
      )

      cy.get('.command-prompt-get-code').should('be.visible').should('have.text', 'Get code')
      cy.get('.command-prompt-get-code-indicator').should('be.visible')

      cy.percySnapshot()
    })

    it('should not render prompt get code button when state is not passed', () => {
      config.withArgs('experimentalPromptCommand').returns(true)
      config.withArgs('isTextTerminal').returns(false)
      cy.mount(
        <div>
          <Command
            model={
              new CommandModel({
                name: 'prompt',
                state: 'pending',
                numElements: 1,
                hookId: '1',
                id: 1,
                testId: '1',
              })
            }
            scrollIntoView={() => {}}
            aliasesWithDuplicates={[]}
          />
        </div>,
      )

      cy.get('.command-prompt-get-code').should('not.exist')
      cy.get('.command-prompt-get-code-indicator').should('not.exist')
    })

    it('should not render prompt if experimentalPromptCommand is false', () => {
      config.withArgs('experimentalPromptCommand').returns(false)
      config.withArgs('isTextTerminal').returns(false)

      cy.mount(
        <div>
          <Command model={new CommandModel({ name: 'prompt', state: 'passed', numElements: 1, hookId: '1', id: 1, testId: '1' })} scrollIntoView={() => {}} aliasesWithDuplicates={[]} />
        </div>,
      )

      cy.get('.command-prompt-get-code').should('not.exist')
      cy.get('.command-prompt-get-code-indicator').should('not.exist')
    })

    it('should not render prompt if isTextTerminal is true', () => {
      config.withArgs('experimentalPromptCommand').returns(true)
      config.withArgs('isTextTerminal').returns(true)

      cy.mount(
        <div>
          <Command model={new CommandModel({ name: 'prompt', state: 'passed', numElements: 1, hookId: '1', id: 1, testId: '1' })} scrollIntoView={() => {}} aliasesWithDuplicates={[]} />
        </div>,
      )

      cy.get('.command-prompt-get-code').should('not.exist')
      cy.get('.command-prompt-get-code-indicator').should('not.exist')
    })
  })

  describe('studio click message', () => {
    beforeEach(() => {
      // Reset appState before each test
      appState.reset()
      appState.isRunning = false
    })

    it('should show click message when studio is not active', () => {
      appState.studioActive = false

      cy.mount(
        <div>
          <Command
            model={
              new CommandModel({
                name: 'get',
                message: '.foo',
                state: 'passed',
                hasConsoleProps: true,
                number: 1,
                type: 'parent',
                hookId: '1',
                testId: '1',
                id: 1,
                numElements: 1,
              })
            }
            scrollIntoView={() => {}}
            aliasesWithDuplicates={[]}
          />
        </div>,
      )

      // Click on the command
      cy.get('.command-wrapper').click()

      // The tooltip message should appear
      cy.get('.cy-tooltip').should('contain', 'Printed output to your console')
    })

    it('should NOT show click message when studio is active', () => {
      appState.studioActive = true

      cy.mount(
        <div>
          <Command
            model={
              new CommandModel({
                name: 'get',
                message: '.foo',
                state: 'passed',
                hasConsoleProps: true,
                number: 1,
                type: 'parent',
                hookId: '1',
                testId: '1',
                id: 1,
                numElements: 1,
              })
            }
            scrollIntoView={() => {}}
            aliasesWithDuplicates={[]}
          />
        </div>,
      )

      cy.get('.command-wrapper').click()

      cy.get('.cy-tooltip').should('not.exist')
    })

    it('should NOT show click message when test is running', () => {
      appState.studioActive = false
      appState.isRunning = true

      cy.mount(
        <div>
          <Command
            model={
              new CommandModel({
                name: 'get',
                message: '.foo',
                state: 'passed',
                hasConsoleProps: true,
                number: 1,
                type: 'parent',
                hookId: '1',
                testId: '1',
                id: 1,
                numElements: 1,
              })
            }
            scrollIntoView={() => {}}
            aliasesWithDuplicates={[]}
          />
        </div>,
      )

      cy.get('.command-wrapper').click()

      cy.get('.cy-tooltip').should('not.exist')
    })

    it('should NOT show click message when command has no console props', () => {
      appState.studioActive = false

      cy.mount(
        <div>
          <Command
            model={
              new CommandModel({
                name: 'get',
                message: '.foo',
                state: 'passed',
                hasConsoleProps: false,
                number: 1,
                type: 'parent',
                hookId: '1',
                testId: '1',
                id: 1,
                numElements: 1,
              })
            }
            scrollIntoView={() => {}}
            aliasesWithDuplicates={[]}
          />
        </div>,
      )

      cy.get('.command-wrapper').click()

      cy.get('.cy-tooltip').should('not.exist')
    })
  })
})
