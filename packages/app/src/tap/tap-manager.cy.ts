import { TapManager } from './tap-manager'
import { tapCommands } from './commands'
import type { TapCommandDefinition } from './commands/definition'
import { TAP_SCHEMA_VERSION } from './contract'

const CYPRESS_VERSION = '15.0.0'

describe('tap/tap-manager', () => {
  // NOTE: the registry ships empty, so exec's dispatch, payload, per-command
  // arg/option, and domain-failure (TapCommandError) paths can only be
  // exercised once the first real command lands (see the `specs` command spec).
  // Until then these cover the command-lookup failure and the wire envelope.
  describe('exec', () => {
    it('returns UNKNOWN_COMMAND listing the available commands', async () => {
      const manager = new TapManager(CYPRESS_VERSION)

      const outcome = await manager.exec('bogus')

      expect((outcome as { error: { code: string, message: string } }).error.code).to.eq('UNKNOWN_COMMAND')
      expect((outcome as { error: { message: string } }).error.message).to.contain(`Available commands: ${Object.keys(tapCommands).join(', ')}.`)
      expect((outcome as { error: { message: string } }).error.message).to.contain('v15.0.0')
    })

    it('does not resolve inherited property names as commands', async () => {
      const manager = new TapManager(CYPRESS_VERSION)

      const outcome = await manager.exec('constructor')

      expect((outcome as { error: { code: string } }).error.code).to.eq('UNKNOWN_COMMAND')
    })

    it('round-trips the envelope through JSON (the CDP returnByValue boundary)', async () => {
      const manager = new TapManager(CYPRESS_VERSION)
      const outcome = await manager.exec('bogus')

      expect(JSON.parse(JSON.stringify(outcome))).to.deep.eq(outcome)
    })
  })

  describe('getSchema', () => {
    it('advertises the schema version, cypress version, and every registry command', async () => {
      const manager = new TapManager(CYPRESS_VERSION)
      const schema = await manager.getSchema()

      expect(schema.schemaVersion).to.eq(TAP_SCHEMA_VERSION)
      expect(schema.cypressVersion).to.eq(CYPRESS_VERSION)

      expect(schema.commands.map((command) => command.name)).to.deep.eq(Object.keys(tapCommands))

      for (const command of schema.commands) {
        const definition = tapCommands[command.name as keyof typeof tapCommands]

        expect(command.description).to.eq(definition.description)
        expect(command.params).to.deep.eq(definition.params)
        expect(command.options).to.deep.eq((definition as TapCommandDefinition).options ?? [])
      }
    })

    it('round-trips through JSON (the CDP returnByValue boundary)', async () => {
      const manager = new TapManager(CYPRESS_VERSION)
      const schema = await manager.getSchema()

      expect(JSON.parse(JSON.stringify(schema))).to.deep.eq(schema)
    })
  })
})
