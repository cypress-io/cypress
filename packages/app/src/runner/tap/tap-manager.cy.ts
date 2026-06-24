import { TapManager } from './tap-manager'
import { tapCommands } from './commands'
import { TapCommandError } from './commands/definition'
import type { TapCommandDefinition } from './commands/definition'
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

    it('turns a handler TapCommandError into an ok: false envelope carrying its code and message', async () => {
      cy.stub(tapCommands.health, 'handler').rejects(new TapCommandError('NO_RUN', 'no spec has been run yet'))

      const manager = new TapManager(CYPRESS_VERSION)

      expect(await manager.exec('health')).to.deep.eq({
        ok: false,
        code: 'NO_RUN',
        message: 'no spec has been run yet',
      })
    })

    it('lets any other handler throw propagate — it is a binding bug, not a domain failure', async () => {
      cy.stub(tapCommands.health, 'handler').rejects(new Error('boom'))

      const manager = new TapManager(CYPRESS_VERSION)

      let thrown: Error | undefined

      try {
        await manager.exec('health')
      } catch (err) {
        thrown = err as Error
      }

      expect(thrown?.message).to.eq('boom')
    })

    it('round-trips the envelope through JSON (the CDP returnByValue boundary)', async () => {
      const manager = new TapManager(CYPRESS_VERSION)

      for (const outcome of [await manager.exec('health'), await manager.exec('bogus')]) {
        expect(JSON.parse(JSON.stringify(outcome))).to.deep.eq(outcome)
      }
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

    it('includes run with its required spec param', async () => {
      const manager = new TapManager(CYPRESS_VERSION)
      const schema = await manager.getSchema()
      const run = schema.commands.find((command) => command.name === 'run')

      expect(run).to.deep.eq({
        name: 'run',
        description: tapCommands.run.description,
        params: [
          { name: 'spec', type: 'string', required: true, description: 'project-relative spec path, as listed by the specs command' },
        ],
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
