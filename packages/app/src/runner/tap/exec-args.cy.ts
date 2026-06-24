import { coerceCommandArgs, coerceCommandOptions } from './exec-args'
import type { TapCommandOptionSchema, TapCommandParamSchema } from './contract'

describe('tap/exec-args', () => {
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
})
