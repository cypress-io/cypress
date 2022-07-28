import React from 'react'
import Command from './command'
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

    it('session status in command', () => {
      cy.mount(
        <div>
          {statusList.map((status, index) => (
            <Command
              key={status}
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
