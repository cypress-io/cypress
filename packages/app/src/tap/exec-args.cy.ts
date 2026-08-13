import { coerceCommandArgs, coerceCommandOptions } from './exec-args'
import type { TapCommandOptionSchema, TapCommandParamSchema } from './contract'

// Coercion answers with the failure already raised, so a case is asserted by the
// code it carries and the specifics it renders with.
const failure = (outcome: unknown): { code: string, detail?: string } => {
  const { code, detail } = (outcome as { error: { code: string, detail?: string } }).error

  return { code, detail }
}

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

    it('rejects missing required params, naming them', () => {
      const outcome = coerceCommandArgs('probe', PARAMS, {})

      expect(failure(outcome).code).to.eq('INVALID_ARGUMENTS')
      expect(failure(outcome).detail).to.contain('missing the required <path>')
    })

    it('rejects an arg not named by the param schema', () => {
      const outcome = coerceCommandArgs('probe', PARAMS, { path: 'a', count: '1', exact: 'true', extra: 'extra' })

      expect(failure(outcome).code).to.eq('INVALID_ARGUMENTS')
      expect(failure(outcome).detail).to.contain('<extra> was passed to "probe", but it\'s not a supported argument')
    })

    it('rejects values that do not parse as the declared number type', () => {
      for (const bad of ['abc', '']) {
        const outcome = coerceCommandArgs('probe', PARAMS, { path: 'a', count: bad })

        expect(failure(outcome), `value "${bad}"`).to.deep.eq({
          code: 'INVALID_VALUE',
          detail: `Expected \`<count>\` to be a number.\n\nInstead the value was: ${JSON.stringify(bad)}`,
        })
      }
    })

    it('rejects values that are not literal true/false for the boolean type', () => {
      const outcome = coerceCommandArgs('probe', PARAMS, { path: 'a', count: '1', exact: 'yes' })

      expect(failure(outcome)).to.deep.eq({
        code: 'INVALID_VALUE',
        detail: 'Expected `<exact>` to be true or false.\n\nInstead the value was: "yes"',
      })
    })

    it('rejects non-string wire values', () => {
      const outcome = coerceCommandArgs('probe', PARAMS, { path: 42 as unknown as string })

      expect(failure(outcome)).to.deep.eq({
        code: 'INVALID_VALUE',
        detail: 'Expected `<path>` to be a string.\n\nInstead the value was: 42',
      })
    })
  })

  describe('coerceCommandOptions', () => {
    const OPTIONS: TapCommandOptionSchema[] = [
      { name: 'browser', type: 'string', required: false, description: 'which browser' },
      { name: 'port', type: 'number', required: false, description: 'a port' },
      { name: 'headed', type: 'boolean', required: false, description: 'show the browser' },
      { name: 'config', type: 'string', required: true, description: 'a config path' },
    ]

    it('coerces each supplied option to its declared wire type', () => {
      expect(coerceCommandOptions('run', OPTIONS, { browser: 'chrome', port: '8080', headed: 'true', config: 'a.json' })).to.deep.eq({
        ok: true,
        options: { browser: 'chrome', port: 8080, headed: true, config: 'a.json' },
      })
    })

    it('defaults an absent boolean flag to false and omits absent value options', () => {
      expect(coerceCommandOptions('run', OPTIONS, { config: 'a.json' })).to.deep.eq({
        ok: true,
        options: { headed: false, config: 'a.json' },
      })
    })

    it('rejects a missing required option, naming it', () => {
      const outcome = coerceCommandOptions('run', OPTIONS, {})

      expect(failure(outcome).code).to.eq('INVALID_OPTIONS')
      expect(failure(outcome).detail).to.contain('missing the required --config option')
    })

    // A flag the command has no such thing as reads as its own condition, not as
    // one of the ways a flag it does have can be wrong.
    it('rejects an option not in the schema, naming it', () => {
      const outcome = coerceCommandOptions('run', OPTIONS, { config: 'a.json', bogus: 'x' })

      expect(failure(outcome)).to.deep.eq({
        code: 'UNKNOWN_OPTION',
        detail: 'Unknown option "--bogus"',
      })
    })

    it('rejects a value that does not parse as the declared number type', () => {
      const outcome = coerceCommandOptions('run', OPTIONS, { config: 'a.json', port: 'abc' })

      expect(failure(outcome)).to.deep.eq({
        code: 'INVALID_VALUE',
        detail: 'Expected `--port` to be a number.\n\nInstead the value was: "abc"',
      })
    })

    it('rejects a non true/false value for a boolean option', () => {
      const outcome = coerceCommandOptions('run', OPTIONS, { config: 'a.json', headed: 'yes' })

      expect(failure(outcome)).to.deep.eq({
        code: 'INVALID_VALUE',
        detail: 'Expected `--headed` to be true or false.\n\nInstead the value was: "yes"',
      })
    })
  })
})
