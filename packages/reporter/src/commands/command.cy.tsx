import React from 'react'
import Command, { SessionPill } from './command'
import CommandModel from './command-model'

describe('commands', () => {
  describe('sessionPill', () => {
    const statusList = [
      'creating',
      'created',
      'restoring',
      'restored',
      'recreating',
      'recreated',
      'failed',
    ]

    it('sessionPill', () => {
      cy.mount(
        <div className='command-wrapper'>
          {statusList.map((status) => <SessionPill status={status} />)}
        </div>,
      )

      cy.percySnapshot()
    })

    it('sessionPill in command', () => {
      cy.mount(
        <div>
          {statusList.map((status, index) => (
            <Command
              model={
                new CommandModel({
                  name: 'session',
                  message: 'user1',
                  state: 'passed',
                  renderProps: {
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
