import { beforeEach, describe, expect, it, vi } from 'vitest'
import commander from 'commander'

import { buildTapProgram } from '../../../lib/tap/build-program'
import type { TapSchema } from '@packages/cypress-instances'

const schema: TapSchema = {
  schemaVersion: 1,
  cypressVersion: '15.0.0',
  commands: [
    {
      name: 'health',
      description: 'check that a running Cypress instance is reachable',
      params: [],
      options: [],
    },
    {
      name: 'run',
      description: 'run a spec by its project-relative path',
      params: [
        { name: 'spec', type: 'string', required: true, description: 'project-relative spec path' },
      ],
      options: [
        { name: 'browser', alias: 'b', type: 'string', required: false, description: 'which browser to run in' },
        { name: 'port', type: 'number', required: false, description: 'a port to listen on' },
        { name: 'headed', type: 'boolean', required: false, description: 'show the browser' },
      ],
    },
    {
      name: 'open',
      description: 'open a spec at a line',
      params: [
        { name: 'spec', type: 'string', required: true, description: 'project-relative spec path' },
        { name: 'line', type: 'number', required: false, description: 'a one-based line number' },
      ],
      options: [],
    },
    {
      name: 'run-state',
      description: 'report where the running Cypress instance is in its run lifecycle',
      params: [],
      options: [],
      hidden: true,
    },
  ],
}

const subcommand = (program: commander.Command, name: string): commander.Command => {
  return program.commands.find((command) => command.name() === name)!
}

describe('lib/tap/build-program', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('registers the CLI-native `instances` and `status` commands first, then one subcommand per advertised command', () => {
    const program = buildTapProgram(schema, vi.fn())

    expect(program.commands.map((command) => command.name())).toEqual(['instances', 'status', 'health', 'run', 'open'])
  })

  it('omits commands flagged hidden from the program (still exec-able, just not advertised)', () => {
    const program = buildTapProgram(schema, vi.fn())

    expect(program.commands.map((command) => command.name())).not.toContain('run-state')
  })

  it('names the program so generated usage reads `cypress tap <command>`', () => {
    const program = buildTapProgram(schema, vi.fn())

    expect(subcommand(program, 'run').helpInformation()).toContain('Usage: cypress tap run [options] <spec>')
  })

  it('derives positional grammar from each param schema (required <>, optional [])', () => {
    const program = buildTapProgram(schema, vi.fn())

    expect(program.helpInformation()).toContain('run [options] <spec>')
    expect(subcommand(program, 'open').usage()).toBe('[options] <spec> [line]')
  })

  it('renders a rich per-command help with the param descriptions', () => {
    const program = buildTapProgram(schema, vi.fn())
    const help = subcommand(program, 'open').helpInformation()

    expect(help).toContain('Arguments:')
    expect(help).toContain('spec')
    expect(help).toContain('project-relative spec path')
    expect(help).toContain('a one-based line number')
  })

  it('forwards positional strings to dispatch keyed by schema param name, uninterpreted', () => {
    const dispatch = vi.fn()
    const program = buildTapProgram(schema, dispatch)

    program.parse(['open', 'cypress/e2e/a.cy.js', '42'], { from: 'user' })

    expect(dispatch).toHaveBeenCalledWith('open', { spec: 'cypress/e2e/a.cy.js', line: '42' }, {})
  })

  it('keys only the supplied positionals, omitting an absent trailing optional', () => {
    const dispatch = vi.fn()
    const program = buildTapProgram(schema, dispatch)

    program.parse(['open', 'cypress/e2e/a.cy.js'], { from: 'user' })

    expect(dispatch).toHaveBeenCalledWith('open', { spec: 'cypress/e2e/a.cy.js' }, {})
  })

  it('dispatches a no-param command with an empty arg map and no options', () => {
    const dispatch = vi.fn()
    const program = buildTapProgram(schema, dispatch)

    program.parse(['health'], { from: 'user' })

    expect(dispatch).toHaveBeenCalledWith('health', {}, {})
  })

  it('throws a catchable missingArgument error when a required positional is absent', () => {
    const program = buildTapProgram(schema, vi.fn())

    expect(() => program.parse(['run'], { from: 'user' })).toThrowError(
      expect.objectContaining({ code: 'commander.missingArgument' }),
    )
  })

  it('throws a catchable excessArguments error for operands beyond the declared params', () => {
    const program = buildTapProgram(schema, vi.fn())

    expect(() => program.parse(['run', 'a.cy.js', 'extra'], { from: 'user' })).toThrowError(
      expect.objectContaining({ code: 'commander.excessArguments' }),
    )
  })

  it('throws a catchable excessArguments error for operands passed to a no-param command', () => {
    const program = buildTapProgram(schema, vi.fn())

    expect(() => program.parse(['health', 'extra'], { from: 'user' })).toThrowError(
      expect.objectContaining({ code: 'commander.excessArguments' }),
    )
  })

  it('throws a catchable excessArguments error for operands passed to the CLI-native instances command', () => {
    const program = buildTapProgram(schema, vi.fn())

    expect(() => program.parse(['instances', 'extra'], { from: 'user' })).toThrowError(
      expect.objectContaining({ code: 'commander.excessArguments' }),
    )
  })

  it('throws a catchable unknownCommand error for a command not in the schema', () => {
    const program = buildTapProgram(schema, vi.fn())

    expect(() => program.parse(['bogus'], { from: 'user' })).toThrowError(
      expect.objectContaining({ code: 'commander.unknownCommand' }),
    )
  })

  it('declares each schema option (with its alias) in the per-command help', () => {
    const program = buildTapProgram(schema, vi.fn())
    const help = subcommand(program, 'run').helpInformation()

    expect(help).toContain('Options:')
    expect(help).toContain('-b, --browser <browser>')
    expect(help).toContain('which browser to run in')
    expect(help).toContain('--headed')
  })

  it('forwards parsed option values to dispatch as raw strings keyed by name, uninterpreted', () => {
    const dispatch = vi.fn()
    const program = buildTapProgram(schema, dispatch)

    program.parse(['run', 'a.cy.js', '--browser', 'chrome', '--port', '8080', '--headed'], { from: 'user' })

    expect(dispatch).toHaveBeenCalledWith('run', { spec: 'a.cy.js' }, { browser: 'chrome', port: '8080', headed: 'true' })
  })

  it('resolves a short alias to its option name', () => {
    const dispatch = vi.fn()
    const program = buildTapProgram(schema, dispatch)

    program.parse(['run', 'a.cy.js', '-b', 'firefox'], { from: 'user' })

    expect(dispatch).toHaveBeenCalledWith('run', { spec: 'a.cy.js' }, { browser: 'firefox' })
  })

  it('omits options the user did not supply', () => {
    const dispatch = vi.fn()
    const program = buildTapProgram(schema, dispatch)

    program.parse(['run', 'a.cy.js'], { from: 'user' })

    expect(dispatch).toHaveBeenCalledWith('run', { spec: 'a.cy.js' }, {})
  })

  it('throws a catchable unknownOption error for a flag not in the schema', () => {
    const program = buildTapProgram(schema, vi.fn())

    expect(() => program.parse(['run', 'a.cy.js', '--nope'], { from: 'user' })).toThrowError(
      expect.objectContaining({ code: 'commander.unknownOption' }),
    )
  })

  it('treats a schema command that omits params as having no positionals', () => {
    const dispatch = vi.fn()
    const program = buildTapProgram({
      protocolVersion: 1,
      cypressVersion: '15.0.0',
      commands: [{
        name: 'health',
        description: 'check that a running Cypress instance is reachable',
      }],
    } as TapSchema, dispatch)

    program.parse(['health'], { from: 'user' })

    expect(dispatch).toHaveBeenCalledWith('health', {}, {})

    expect(() => program.parse(['health', 'extra'], { from: 'user' })).toThrowError(
      expect.objectContaining({ code: 'commander.excessArguments' }),
    )
  })

  const dashedSchema: TapSchema = {
    protocolVersion: 1,
    cypressVersion: '15.0.0',
    commands: [{
      name: 'export',
      description: 'export results',
      params: [],
      options: [
        { name: 'dry-run', type: 'boolean', required: false, description: 'preview without writing' },
        { name: 'output-file', type: 'string', required: false, description: 'where to write results' },
      ],
    }],
  }

  it('forwards a dashed boolean option keyed by its raw schema name despite commander camelCasing it', () => {
    const dispatch = vi.fn()
    const program = buildTapProgram(dashedSchema, dispatch)

    program.parse(['export', '--dry-run'], { from: 'user' })

    expect(dispatch).toHaveBeenCalledWith('export', {}, { 'dry-run': 'true' })
  })

  it('forwards a dashed value option keyed by its raw schema name despite commander camelCasing it', () => {
    const dispatch = vi.fn()
    const program = buildTapProgram(dashedSchema, dispatch)

    program.parse(['export', '--output-file', 'out.json'], { from: 'user' })

    expect(dispatch).toHaveBeenCalledWith('export', {}, { 'output-file': 'out.json' })
  })

  it('omits dashed options the user did not supply', () => {
    const dispatch = vi.fn()
    const program = buildTapProgram(dashedSchema, dispatch)

    program.parse(['export'], { from: 'user' })

    expect(dispatch).toHaveBeenCalledWith('export', {}, {})
  })

  it('forwards a dashed param name keyed by its raw schema name (positionals bypass camelCasing)', () => {
    const dispatch = vi.fn()
    const program = buildTapProgram({
      protocolVersion: 1,
      cypressVersion: '15.0.0',
      commands: [{
        name: 'show',
        description: 'show a spec',
        params: [{ name: 'spec-path', type: 'string', required: true, description: 'project-relative spec path' }],
        options: [],
      }],
    }, dispatch)

    program.parse(['show', 'a.cy.js'], { from: 'user' })

    expect(dispatch).toHaveBeenCalledWith('show', { 'spec-path': 'a.cy.js' }, {})
  })

  it('declares a required value option with requiredOption so commander enforces it', () => {
    const program = buildTapProgram({
      schemaVersion: 1,
      cypressVersion: '15.0.0',
      commands: [{
        name: 'login',
        description: 'log in',
        params: [],
        options: [{ name: 'token', type: 'string', required: true, description: 'an auth token' }],
      }],
    }, vi.fn())

    expect(() => program.parse(['login'], { from: 'user' })).toThrowError(
      expect.objectContaining({ code: 'commander.missingMandatoryOptionValue' }),
    )
  })
})
