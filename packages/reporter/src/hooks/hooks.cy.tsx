import React from 'react'
import { Hook } from './hooks'
import HookModel from './hook-model'
import CommandModel, { CommandProps } from '../commands/command-model'

import '../main.scss'

describe('hooks/hooks.tsx', () => {
  const createMockCommand = (id: number): CommandModel => {
    const props: CommandProps = {
      id,
      name: 'get',
      state: 'passed',
      visible: true,
      testId: 'test-1',
      hookId: 'hook-1',
      instrument: 'command',
      numElements: 1,
      testCurrentRetry: 0,
      timeout: 4000,
      wallClockStartedAt: new Date().toString(),
    }

    return new CommandModel(props)
  }

  const createMockModel = (overrides: Partial<HookModel> = {}): HookModel => {
    const hook = new HookModel({
      hookId: 'hook-1',
      hookName: 'test body',
      ...overrides,
    })

    if (overrides.failed !== undefined) {
      hook.failed = overrides.failed
    }

    if (overrides.hookNumber !== undefined) {
      hook.hookNumber = overrides.hookNumber
    }

    if (overrides.commands !== undefined) {
      hook.commands = overrides.commands
    }

    return hook
  }

  it('should mount', () => {
    const model = createMockModel()

    cy.mount(<div className="runnable suite">
      <div className="hooks-container">
        <Hook model={model} showNumber={false} scrollIntoView={() => {}} />
      </div>
    </div>)

    cy.percySnapshot()

    // Hook name is displayed in lowercase in DOM, but CSS transforms it to uppercase
    cy.contains('test body', { matchCase: false }).click().realHover()
    cy.percySnapshot()
  })

  it('should display failed state', () => {
    const model = createMockModel({ failed: true })

    cy.mount(<div className="runnable suite">
      <div className="hooks-container">
        <Hook model={model} showNumber={false} scrollIntoView={() => {}} />
      </div>
    </div>)

    cy.contains('(failed)').should('be.visible')
    cy.get('.hook-item').should('have.class', 'hook-failed')
    cy.percySnapshot()
  })

  it('should display hook number when showNumber is true', () => {
    const model = createMockModel({ hookNumber: 2 })

    cy.mount(<div className="runnable suite">
      <div className="hooks-container">
        <Hook model={model} showNumber={true} scrollIntoView={() => {}} />
      </div>
    </div>)

    cy.contains('(2)').should('be.visible')
    cy.percySnapshot()
  })

  it('should not display hook number when showNumber is false', () => {
    const model = createMockModel({ hookNumber: 2 })

    cy.mount(<div className="runnable suite">
      <div className="hooks-container">
        <Hook model={model} showNumber={false} scrollIntoView={() => {}} />
      </div>
    </div>)

    cy.contains('(2)').should('not.exist')
  })

  it('should handle empty commands array', () => {
    const model = createMockModel({ commands: [] })

    cy.mount(<div className="runnable suite">
      <div className="hooks-container">
        <Hook model={model} showNumber={false} scrollIntoView={() => {}} />
      </div>
    </div>)

    cy.get('.commands-container').should('exist')
    cy.get('.command').should('not.exist')
  })

  it('should handle undefined commands', () => {
    const model = createMockModel({ commands: undefined as any })

    cy.mount(<div className="runnable suite">
      <div className="hooks-container">
        <Hook model={model} showNumber={false} scrollIntoView={() => {}} />
      </div>
    </div>)

    cy.get('.commands-container').should('exist')
    // Should not crash
  })

  it('should render commands when they exist', () => {
    const commands = [createMockCommand(1), createMockCommand(2)]
    const model = createMockModel({ commands })

    cy.mount(<div className="runnable suite">
      <div className="hooks-container">
        <Hook model={model} showNumber={false} scrollIntoView={() => {}} />
      </div>
    </div>)

    // Commands should render incrementally, so we may need to wait
    cy.get('.command', { timeout: 2000 }).should('have.length.at.least', 1)
  })

  it('should handle different hook names', () => {
    const hookNames = ['before all', 'before each', 'after all', 'after each', 'test body'] as const

    hookNames.forEach((hookName) => {
      const model = createMockModel({ hookName, hookId: `hook-${hookName}` })

      cy.mount(<div className="runnable suite">
        <div className="hooks-container">
          <Hook model={model} showNumber={false} scrollIntoView={() => {}} />
        </div>
      </div>)

      // Hook name is displayed in lowercase in DOM, but CSS transforms it to uppercase
      cy.contains(hookName, { matchCase: false }).should('be.visible')
    })
  })

  describe('deferred commands rendering', () => {
    it('should render first command immediately', () => {
      const commands = [createMockCommand(1)]
      const model = createMockModel({ commands })

      cy.mount(<div className="runnable suite">
        <div className="hooks-container">
          <Hook model={model} showNumber={false} scrollIntoView={() => {}} />
        </div>
      </div>)

      // First command should render immediately
      cy.get('.command').should('have.length', 1)
    })

    it('should render commands incrementally in batches of 50', () => {
      // Create 120 commands to test incremental rendering
      const commands = Array.from({ length: 120 }, (_, i) => createMockCommand(i + 1))
      const model = createMockModel({ commands })

      cy.mount(<div className="runnable suite">
        <div className="hooks-container">
          <Hook model={model} showNumber={false} scrollIntoView={() => {}} />
        </div>
      </div>)

      // First command should render immediately
      cy.get('.command').should('have.length', 1)

      // Wait for first batch (1 + 50 = 51 commands)
      cy.wait(100) // Wait for requestAnimationFrame
      cy.get('.command', { timeout: 2000 }).should('have.length.at.least', 51)

      // Wait for second batch (51 + 50 = 101 commands)
      cy.wait(100)
      cy.get('.command', { timeout: 2000 }).should('have.length.at.least', 101)

      // Wait for final batch (should render all 120)
      cy.wait(100)
      cy.get('.command', { timeout: 2000 }).should('have.length', 120)
    })

    it('should reset rendered count when remounted with fewer commands', () => {
      // Test that when component is remounted with fewer commands, it starts fresh
      const initialCommands = Array.from({ length: 100 }, (_, i) => createMockCommand(i + 1))
      const initialModel = createMockModel({ commands: initialCommands })

      cy.mount(<div className="runnable suite">
        <div className="hooks-container">
          <Hook model={initialModel} showNumber={false} scrollIntoView={() => {}} />
        </div>
      </div>)

      // Wait for some commands to render
      cy.wait(200)
      cy.get('.command', { timeout: 2000 }).should('have.length.at.least', 51)

      // Remount with fewer commands (simulating test rerun)
      const fewerCommands = [createMockCommand(1), createMockCommand(2)]
      const newModel = createMockModel({ commands: fewerCommands })

      cy.mount(<div className="runnable suite">
        <div className="hooks-container">
          <Hook model={newModel} showNumber={false} scrollIntoView={() => {}} />
        </div>
      </div>)

      // Should start fresh and render only 2 commands
      cy.get('.command', { timeout: 2000 }).should('have.length', 2)
    })

    it('should continue rendering when new commands are added', () => {
      const initialCommands = Array.from({ length: 30 }, (_, i) => createMockCommand(i + 1))
      const model = createMockModel({ commands: initialCommands })

      cy.mount(<div className="runnable suite">
        <div className="hooks-container">
          <Hook model={model} showNumber={false} scrollIntoView={() => {}} />
        </div>
      </div>)

      // Wait for initial batch to render
      cy.wait(200)
      cy.get('.command', { timeout: 2000 }).should('have.length.at.least', 30)

      // Add more commands
      const newCommands = Array.from({ length: 50 }, (_, i) => createMockCommand(i + 31))

      model.commands = [...initialCommands, ...newCommands]

      // Wait for new commands to render incrementally
      cy.wait(200)
      cy.get('.command', { timeout: 2000 }).should('have.length.at.least', 51) // 30 + first batch of new ones
    })

    it('should handle exactly 50 commands (one full batch)', () => {
      const commands = Array.from({ length: 50 }, (_, i) => createMockCommand(i + 1))
      const model = createMockModel({ commands })

      cy.mount(<div className="runnable suite">
        <div className="hooks-container">
          <Hook model={model} showNumber={false} scrollIntoView={() => {}} />
        </div>
      </div>)

      // First command immediately
      cy.get('.command').should('have.length', 1)

      // Wait for batch to complete
      cy.wait(200)
      cy.get('.command', { timeout: 2000 }).should('have.length', 50)
    })

    it('should handle 51 commands (one full batch + 1)', () => {
      const commands = Array.from({ length: 51 }, (_, i) => createMockCommand(i + 1))
      const model = createMockModel({ commands })

      cy.mount(<div className="runnable suite">
        <div className="hooks-container">
          <Hook model={model} showNumber={false} scrollIntoView={() => {}} />
        </div>
      </div>)

      // First command immediately
      cy.get('.command').should('have.length', 1)

      // Wait for first batch (1 + 50 = 51)
      cy.wait(200)
      cy.get('.command', { timeout: 2000 }).should('have.length', 51)
    })
  })
})
