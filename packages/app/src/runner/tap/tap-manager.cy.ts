import { TapManager } from './tap-manager'
import { tapCommands } from './commands'
import type { TapCommandDefinition } from './commands'
import { coerceCommandArgs, coerceCommandOptions } from './exec-args'
import { TAP_PROTOCOL_VERSION } from './contract'
import type { TapCommandOptionSchema, TapCommandParamSchema } from './contract'

const CYPRESS_VERSION = '15.0.0'

describe('tap/tap-manager', () => {
  describe('exec', () => {
    it('dispatches a registry command and wraps its result in the envelope', async () => {
      const manager = new TapManager(CYPRESS_VERSION)

      expect(await manager.exec('health')).to.deep.eq({ ok: true, result: 'ok' })
    })

    it('defaults args so a no-param command can be invoked without them', async () => {
      const manager = new TapManager(CYPRESS_VERSION)

      expect(await manager.exec('health', {})).to.deep.eq({ ok: true, result: 'ok' })
    })

    it('treats null args/options as absent so a CDP caller never escapes the envelope', async () => {
      const manager = new TapManager(CYPRESS_VERSION)

      expect(await manager.exec('health', null as any, null as any)).to.deep.eq({ ok: true, result: 'ok' })
    })

    it('rejects a non-object args payload instead of silently validating it', async () => {
      const manager = new TapManager(CYPRESS_VERSION)

      for (const malformed of [42, true, 'oops', [] as any]) {
        const outcome = await manager.exec('health', malformed as any)

        expect(outcome, `args: ${JSON.stringify(malformed)}`).to.deep.include({ ok: false, code: 'INVALID_ARGUMENTS' })
        expect((outcome as { message: string }).message).to.contain('non-object args payload')
      }
    })

    it('rejects a non-object options payload instead of silently validating it', async () => {
      const manager = new TapManager(CYPRESS_VERSION)

      const outcome = await manager.exec('health', {}, 42 as any)

      expect(outcome).to.deep.include({ ok: false, code: 'INVALID_ARGUMENTS' })
      expect((outcome as { message: string }).message).to.contain('non-object options payload')
    })

    it('returns UNKNOWN_COMMAND listing the available commands', async () => {
      const manager = new TapManager(CYPRESS_VERSION)

      const outcome = await manager.exec('bogus')

      expect(outcome).to.deep.include({ ok: false, code: 'UNKNOWN_COMMAND' })
      expect((outcome as { message: string }).message).to.contain(`Available commands: ${Object.keys(tapCommands).join(', ')}.`)
      expect((outcome as { message: string }).message).to.contain('v15.0.0')
    })

    it('does not resolve inherited property names as commands', async () => {
      const manager = new TapManager(CYPRESS_VERSION)

      const outcome = await manager.exec('constructor')

      expect(outcome).to.deep.include({ ok: false, code: 'UNKNOWN_COMMAND' })
    })

    it('returns INVALID_ARGUMENTS when an arg is not in the param schema', async () => {
      const manager = new TapManager(CYPRESS_VERSION)

      const outcome = await manager.exec('health', { extra: 'x' })

      expect(outcome).to.deep.include({ ok: false, code: 'INVALID_ARGUMENTS' })
      expect((outcome as { message: string }).message).to.contain('has no <extra> argument')
      expect((outcome as { message: string }).message).to.contain('Usage: cypress tap health')
    })

    it('returns INVALID_ARGUMENTS when an option is not in the command schema', async () => {
      const manager = new TapManager(CYPRESS_VERSION)

      const outcome = await manager.exec('health', {}, { bogus: 'true' })

      expect(outcome).to.deep.include({ ok: false, code: 'INVALID_ARGUMENTS' })
      expect((outcome as { message: string }).message).to.contain('has no --bogus option')
    })

    it('round-trips the envelope through JSON (the CDP returnByValue boundary)', async () => {
      const manager = new TapManager(CYPRESS_VERSION)

      for (const outcome of [await manager.exec('health'), await manager.exec('bogus')]) {
        expect(JSON.parse(JSON.stringify(outcome))).to.deep.eq(outcome)
      }
    })
  })

  describe('coerceCommandArgs', () => {
    const PARAMS: TapCommandParamSchema[] = [
      { name: 'path', type: 'string', required: true, description: 'a path' },
      { name: 'count', type: 'number', required: false, description: 'how many' },
      { name: 'exact', type: 'boolean', required: false, description: 'exact match' },
    ]

    it('coerces each arg to its declared wire type', () => {
      expect(coerceCommandArgs('probe', PARAMS, { path: 'a/b.ts', count: '3', exact: 'true' })).to.deep.eq({
        ok: true,
        args: { path: 'a/b.ts', count: 3, exact: true },
      })
    })

    it('allows optional params to be omitted', () => {
      expect(coerceCommandArgs('probe', PARAMS, { path: 'a/b.ts' })).to.deep.eq({ ok: true, args: { path: 'a/b.ts' } })
    })

    it('rejects missing required params with a usage hint', () => {
      const outcome = coerceCommandArgs('probe', PARAMS, {})

      expect(outcome.ok).to.eq(false)
      expect((outcome as { message: string }).message).to.contain('missing the required <path>')
      expect((outcome as { message: string }).message).to.contain('Usage: cypress tap probe <path> [count] [exact]')
    })

    it('rejects an arg not named by the param schema', () => {
      const outcome = coerceCommandArgs('probe', PARAMS, { path: 'a', count: '1', exact: 'true', extra: 'extra' })

      expect(outcome.ok).to.eq(false)
      expect((outcome as { message: string }).message).to.contain('has no <extra> argument')
    })

    it('rejects values that do not parse as the declared number type', () => {
      for (const bad of ['abc', '']) {
        const outcome = coerceCommandArgs('probe', PARAMS, { path: 'a', count: bad })

        expect(outcome.ok, `value "${bad}"`).to.eq(false)
        expect((outcome as { message: string }).message).to.contain('<count> must be a number')
      }
    })

    it('rejects values that are not literal true/false for the boolean type', () => {
      const outcome = coerceCommandArgs('probe', PARAMS, { path: 'a', count: '1', exact: 'yes' })

      expect(outcome.ok).to.eq(false)
      expect((outcome as { message: string }).message).to.contain('<exact> must be true or false')
    })

    it('rejects non-string wire values', () => {
      const outcome = coerceCommandArgs('probe', PARAMS, { path: 42 as unknown as string })

      expect(outcome.ok).to.eq(false)
      expect((outcome as { message: string }).message).to.contain('<path> must be a string over the wire')
    })
  })

  describe('coerceCommandOptions', () => {
    const PARAMS: TapCommandParamSchema[] = [
      { name: 'spec', type: 'string', required: true, description: 'a spec' },
    ]
    const OPTIONS: TapCommandOptionSchema[] = [
      { name: 'browser', type: 'string', required: false, description: 'which browser' },
      { name: 'port', type: 'number', required: false, description: 'a port' },
      { name: 'headed', type: 'boolean', required: false, description: 'show the browser' },
      { name: 'config', type: 'string', required: true, description: 'a config path' },
    ]

    it('coerces each supplied option to its declared wire type', () => {
      expect(coerceCommandOptions('run', PARAMS, OPTIONS, { browser: 'chrome', port: '8080', headed: 'true', config: 'a.json' })).to.deep.eq({
        ok: true,
        options: { browser: 'chrome', port: 8080, headed: true, config: 'a.json' },
      })
    })

    it('defaults an absent boolean flag to false and omits absent value options', () => {
      expect(coerceCommandOptions('run', PARAMS, OPTIONS, { config: 'a.json' })).to.deep.eq({
        ok: true,
        options: { headed: false, config: 'a.json' },
      })
    })

    it('rejects a missing required option with a usage hint', () => {
      const outcome = coerceCommandOptions('run', PARAMS, OPTIONS, {})

      expect(outcome.ok).to.eq(false)
      expect((outcome as { message: string }).message).to.contain('missing the required --config option')
      expect((outcome as { message: string }).message).to.contain('Usage: cypress tap run <spec> [options]')
    })

    it('rejects an option not in the schema', () => {
      const outcome = coerceCommandOptions('run', PARAMS, OPTIONS, { config: 'a.json', bogus: 'x' })

      expect(outcome.ok).to.eq(false)
      expect((outcome as { message: string }).message).to.contain('has no --bogus option')
    })

    it('rejects a value that does not parse as the declared number type', () => {
      const outcome = coerceCommandOptions('run', PARAMS, OPTIONS, { config: 'a.json', port: 'abc' })

      expect(outcome.ok).to.eq(false)
      expect((outcome as { message: string }).message).to.contain('--port must be a number')
    })

    it('rejects a non true/false value for a boolean option', () => {
      const outcome = coerceCommandOptions('run', PARAMS, OPTIONS, { config: 'a.json', headed: 'yes' })

      expect(outcome.ok).to.eq(false)
      expect((outcome as { message: string }).message).to.contain('--headed must be true or false')
    })
  })

  describe('getSchema', () => {
    it('advertises the protocol version, cypress version, and every registry command', async () => {
      const manager = new TapManager(CYPRESS_VERSION)
      const schema = await manager.getSchema()

      expect(schema.protocolVersion).to.eq(TAP_PROTOCOL_VERSION)
      expect(schema.cypressVersion).to.eq(CYPRESS_VERSION)

      expect(schema.commands.map((command) => command.name)).to.deep.eq(Object.keys(tapCommands))

      for (const command of schema.commands) {
        const definition = tapCommands[command.name as keyof typeof tapCommands]

        expect(command.description).to.eq(definition.description)
        expect(command.params).to.deep.eq(definition.params)
        expect(command.options).to.deep.eq((definition as TapCommandDefinition).options ?? [])
      }
    })

    it('includes health with no params or options', async () => {
      const manager = new TapManager(CYPRESS_VERSION)
      const schema = await manager.getSchema()
      const health = schema.commands.find((command) => command.name === 'health')

      expect(health).to.deep.eq({
        name: 'health',
        description: tapCommands.health.description,
        params: [],
        options: [],
      })
    })

    it('round-trips through JSON (the CDP returnByValue boundary)', async () => {
      const manager = new TapManager(CYPRESS_VERSION)
      const schema = await manager.getSchema()

      expect(JSON.parse(JSON.stringify(schema))).to.deep.eq(schema)
    })

    it('returns a snapshot whose arrays cannot mutate the in-process registry', async () => {
      const manager = new TapManager(CYPRESS_VERSION)
      const health = (await manager.getSchema()).commands.find((command) => command.name === 'health')!

      // A caller ignoring the readonly type and mutating the returned arrays
      // must not reach back into the shared registry.
      ;(health.params as TapCommandParamSchema[]).push({ name: 'injected', type: 'string', required: true, description: 'x' })

      ;(health.options as TapCommandOptionSchema[]).push({ name: 'injected', type: 'string', required: true, description: 'x' })

      expect(tapCommands.health.params).to.deep.eq([])

      const freshHealth = (await manager.getSchema()).commands.find((command) => command.name === 'health')!

      expect(freshHealth.params).to.deep.eq([])
      expect(freshHealth.options).to.deep.eq([])
    })
  })
})
