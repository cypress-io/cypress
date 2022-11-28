import React from 'react'
import Command from './command'
import CommandModel from './command-model'
import type { SessionStatus } from '../sessions/utils'
import type { TestState } from '@packages/types'

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
            />
          ))}
        </div>,
      )

      cy.percySnapshot()
    })
  })
})
