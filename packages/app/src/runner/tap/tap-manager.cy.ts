import { TapManager } from './tap-manager'
import { tapCommands } from './commands'
import { coerceCommandArgs } from './exec-args'
import { TAP_PROTOCOL_VERSION } from './contract'
import type { TapCommandParamSchema } from './contract'

const CYPRESS_VERSION = '15.0.0'

describe('tap/tap-manager', () => {
  describe('exec', () => {
    it('dispatches a registry command and wraps its result in the envelope', async () => {
      const manager = new TapManager(CYPRESS_VERSION)

      expect(await manager.exec('health')).to.deep.eq({ ok: true, result: 'ok' })
    })

    it('defaults args so a no-param command can be invoked without them', async () => {
      const manager = new TapManager(CYPRESS_VERSION)

      expect(await manager.exec('health', [])).to.deep.eq({ ok: true, result: 'ok' })
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

    it('returns INVALID_ARGUMENTS when positionals do not satisfy the param schema', async () => {
      const manager = new TapManager(CYPRESS_VERSION)

      const outcome = await manager.exec('health', ['extra'])

      expect(outcome).to.deep.include({ ok: false, code: 'INVALID_ARGUMENTS' })
      expect((outcome as { message: string }).message).to.contain('Usage: cypress tap health')
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

    it('coerces each positional to its declared wire type', () => {
      expect(coerceCommandArgs('probe', PARAMS, ['a/b.ts', '3', 'true'])).to.deep.eq({
        ok: true,
        args: ['a/b.ts', 3, true],
      })
    })

    it('allows optional params to be omitted', () => {
      expect(coerceCommandArgs('probe', PARAMS, ['a/b.ts'])).to.deep.eq({ ok: true, args: ['a/b.ts'] })
    })

    it('rejects missing required params with a usage hint', () => {
      const outcome = coerceCommandArgs('probe', PARAMS, [])

      expect(outcome.ok).to.eq(false)
      expect((outcome as { message: string }).message).to.contain('missing the required <path>')
      expect((outcome as { message: string }).message).to.contain('Usage: cypress tap probe <path> [count] [exact]')
    })

    it('rejects extra positionals', () => {
      const outcome = coerceCommandArgs('probe', PARAMS, ['a', '1', 'true', 'extra'])

      expect(outcome.ok).to.eq(false)
      expect((outcome as { message: string }).message).to.contain('takes 3 argument(s), but 4 were given')
    })

    it('rejects values that do not parse as the declared number type', () => {
      for (const bad of ['abc', '']) {
        const outcome = coerceCommandArgs('probe', PARAMS, ['a', bad])

        expect(outcome.ok, `value "${bad}"`).to.eq(false)
        expect((outcome as { message: string }).message).to.contain('<count> must be a number')
      }
    })

    it('rejects values that are not literal true/false for the boolean type', () => {
      const outcome = coerceCommandArgs('probe', PARAMS, ['a', '1', 'yes'])

      expect(outcome.ok).to.eq(false)
      expect((outcome as { message: string }).message).to.contain('<exact> must be true or false')
    })

    it('rejects non-string wire values', () => {
      const outcome = coerceCommandArgs('probe', PARAMS, [42 as unknown as string])

      expect(outcome.ok).to.eq(false)
      expect((outcome as { message: string }).message).to.contain('<path> must be a string over the wire')
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
      }
    })

    it('includes health with no params', async () => {
      const manager = new TapManager(CYPRESS_VERSION)
      const schema = await manager.getSchema()
      const health = schema.commands.find((command) => command.name === 'health')

      expect(health).to.deep.eq({
        name: 'health',
        description: tapCommands.health.description,
        params: [],
      })
    })

    it('round-trips through JSON (the CDP returnByValue boundary)', async () => {
      const manager = new TapManager(CYPRESS_VERSION)
      const schema = await manager.getSchema()

      expect(JSON.parse(JSON.stringify(schema))).to.deep.eq(schema)
    })
  })
})
