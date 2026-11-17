import { describe, it, expect } from 'vitest'
import { CypressEsm } from '../src'

const transform = (code: string, id = '/src/entry.ts'): string | undefined => {
  const plugin = CypressEsm()

  if (!(plugin.transform instanceof Function)) {
    throw new Error('transform is not a function')
  }

  // Safe because the plugin's transform hook is synchronous and returns either nothing or `{ code }`
  const result = plugin.transform.call({} as any, code, id) as { code: string } | undefined

  // The debug flag passed to the runtime depends on the DEBUG env var, which is irrelevant here
  return result?.code.replace(/, (?:true|false|undefined)\)/g, ')')
}

describe('CypressEsm', () => {
  describe('non-JS assets', () => {
    it('leaves asset modules untransformed', () => {
      for (const id of [
        '/src/image.svg',
        '/src/image.png',
        '/src/photo.jpg',
        '/src/photo.jpeg',
        '/src/anim.gif',
        '/src/scan.tiff',
        '/src/image.webp',
        '/src/data.json',
        '/src/README.md',
        '/src/notes.txt',
        '/src/feed.xml',
        '/src/page.html',
        '/src/page.htm',
        '/src/page.xhtml',
        '/src/style.css',
        '/src/style.less',
        '/src/style.scss',
        '/src/style.sass',
        '/src/style.css?inline',
        '/src/Image.SVG',
        '/src/Style.Css?raw',
      ]) {
        expect(transform('import a from \'./a\'', id), id).toBeUndefined()
      }
    })

    it('transforms modules whose extension only starts with an asset extension', () => {
      for (const id of ['/src/page.mdx', '/src/style.css.ts', '/src/data.jsonc', '/src/svg.ts']) {
        expect(transform('import a from \'./a\'', id), id).toContain('__cypressModule')
      }
    })

    it('leaves static and dynamic imports of assets alone, regardless of case', () => {
      const code = [
        'import css from \'./style.CSS?inline\'',
        'import svg from \'./image.svg?raw\'',
        'const png = import(\'./img.PNG\')',
      ].join('\n')

      expect(transform(code)).toEqual(code)
    })

    it('maps imports of modules whose extension only starts with an asset extension', () => {
      const code = transform('import doc from \'./doc.mdx\'\nconst m = import(\'./data.jsonc\')')

      expect(code).toContain('import * as cypress__src_entry_ts_1 from \'./doc.mdx\';')
      expect(code).toContain('__cypressDynamicModule(\'/src/entry.ts\', import(\'./data.jsonc\')')
    })
  })

  describe('module identifier', () => {
    it('replaces every character that is not a letter or digit, keeping letter case', () => {
      expect(transform('import a from \'./a\'', '/src/My-Comp2.tsx')).toContain('import * as cypress__src_My_Comp2_tsx_1 from \'./a\';')
    })
  })

  describe('import declaration splitting', () => {
    it('splits a default import from a following named import block', () => {
      const code = transform('import Def, { A, B as C } from \'./m\'')

      expect(code).toEqual([
        'import * as cypress__src_entry_ts_1 from \'./m\';',
        'const Def = __cypressModule(\'/src/entry.ts#./m\', cypress__src_entry_ts_1);',
        'const { A, B: C } = __cypressModule(\'/src/entry.ts#./m\', cypress__src_entry_ts_1);',
      ].join(''))
    })

    it('splits a named import block from a following namespace import', () => {
      const code = transform('import TheDefault, { Named }, * as Everything from \'module\'')

      expect(code).toEqual([
        'import * as cypress__src_entry_ts_1 from \'module\';',
        'const TheDefault = __cypressModule(\'/src/entry.ts#module\', cypress__src_entry_ts_1);',
        'const { Named } = __cypressModule(\'/src/entry.ts#module\', cypress__src_entry_ts_1);',
        'const Everything = __cypressModule(\'/src/entry.ts#module\', cypress__src_entry_ts_1);',
      ].join(''))
    })

    it('does not split on commas inside a named import block', () => {
      const code = transform('import {\n  A,\n  B as C,\n} from \'./m\'')

      expect(code).toEqual([
        'import * as cypress__src_entry_ts_1 from \'./m\';',
        'const {  A,  B: C,} = __cypressModule(\'/src/entry.ts#./m\', cypress__src_entry_ts_1);',
      ].join(''))
    })
  })
})
