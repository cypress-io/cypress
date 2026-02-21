import React from 'react'
import Command from './command'
import CommandModel from './command-model'
import type { SessionStatus } from '../sessions/utils'
import type { TestState } from '@packages/types'
import events from '../lib/events'

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
      config = cy.stub(Cypress, 'config').log(false)
      config.callThrough()
    })

    it('should render prompt get code button when state is passed', () => {
      config.withArgs('experimentalPromptCommand').returns(true)
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

      cy.get('.command-prompt-get-code').should('be.visible').should('have.text', 'Code')
      cy.get('.command-prompt-get-code-indicator').should('be.visible')

      cy.percySnapshot()
    })

    it('should not render prompt get code button when state is failed', () => {
      config.withArgs('experimentalPromptCommand').returns(true)
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

      cy.get('.command-prompt-get-code').should('not.exist')
      cy.get('.command-prompt-get-code-indicator').should('not.exist')

      cy.percySnapshot()
    })

    it('should not render prompt get code button when state is not passed', () => {
      config.withArgs('experimentalPromptCommand').returns(true)
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

      cy.mount(
        <div>
          <Command model={new CommandModel({ name: 'prompt', state: 'passed', numElements: 1, hookId: '1', id: 1, testId: '1' })} scrollIntoView={() => {}} aliasesWithDuplicates={[]} />
        </div>,
      )

      cy.get('.command-prompt-get-code').should('not.exist')
      cy.get('.command-prompt-get-code-indicator').should('not.exist')
    })

    describe('Feedback button', () => {
      const promptCommandModel = () => new CommandModel({
        name: 'prompt',
        state: 'passed',
        numElements: 1,
        hookId: '1',
        id: 1,
        testId: '1',
      })

      beforeEach(() => {
        config.withArgs('experimentalPromptCommand').returns(true)
      })

      it('should render Feedback button when state is passed', () => {
        cy.mount(
          <div>
            <Command
              model={promptCommandModel()}
              scrollIntoView={() => {}}
              aliasesWithDuplicates={[]}
            />
          </div>,
        )

        cy.get('.command-prompt-get-feedback').should('be.visible').should('contain.text', 'Feedback')
        cy.percySnapshot()
      })

      it('should render Feedback button when state is failed', () => {
        cy.mount(
          <div>
            <Command
              model={new CommandModel({
                name: 'prompt',
                state: 'failed',
                numElements: 1,
                hookId: '1',
                id: 1,
                testId: '1',
              })}
              scrollIntoView={() => {}}
              aliasesWithDuplicates={[]}
            />
          </div>,
        )

        cy.get('.command-prompt-get-feedback').should('exist')
      })

      it('should emit external:open with backend URL when Feedback button is clicked', () => {
        const feedbackUrl = 'https://example.com/feedback-from-backend'

        const backendRequestHandler = cy.stub(Cypress, 'backendRequestHandler').log(false)

        backendRequestHandler.withArgs('prompt:backend:request', 'prompt:get-feedback-url').resolves(feedbackUrl)
        backendRequestHandler.callThrough()

        cy.spy(events, 'emit')

        cy.mount(
          <div>
            <Command
              model={promptCommandModel()}
              scrollIntoView={() => {}}
              aliasesWithDuplicates={[]}
            />
          </div>,
        )

        cy.get('.command-prompt-get-feedback').click()
        .then(() => {
          expect(events.emit).to.be.calledWith('external:open', feedbackUrl)
        })
      })

      it('should emit external:open with fallback URL when backend request fails', () => {
        const fallbackUrl = 'https://on.cypress.io/report-cy-prompt-issue'

        const backendRequestHandler = cy.stub(Cypress, 'backendRequestHandler').log(false)

        backendRequestHandler.withArgs('prompt:backend:request', 'prompt:get-feedback-url').rejects(new Error('Backend unavailable'))
        backendRequestHandler.callThrough()

        cy.spy(events, 'emit')

        cy.mount(
          <div>
            <Command
              model={promptCommandModel()}
              scrollIntoView={() => {}}
              aliasesWithDuplicates={[]}
            />
          </div>,
        )

        cy.get('.command-prompt-get-feedback').click()
        .then(() => {
          expect(events.emit).to.be.calledWith('external:open', fallbackUrl)
        })
      })
    })
  })
})
