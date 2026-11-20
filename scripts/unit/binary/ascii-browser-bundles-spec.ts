import '../../spec-helper'
import { expect } from 'chai'
import fs from 'fs-extra'
import os from 'os'
import path from 'path'
import vm from 'vm'
import { transformSync } from 'esbuild'
import { decode } from '@jridgewell/sourcemap-codec'

const { toAscii, writeBrowserBundlesAsAscii } = require('../../binary/ascii-browser-bundles')
const { escapeNonAscii } = require('../../binary/escape-non-ascii')

const evaluate = (source: string) => vm.runInNewContext(source)
const isAscii = (source: string) => !/[\u0080-\uffff]/.test(source)

const expectSameResultInAscii = (source: string) => {
  const escaped = toAscii(source)

  expect(isAscii(escaped)).to.be.true
  expect(evaluate(escaped)).to.deep.equal(evaluate(source))
}

describe('ascii-browser-bundles', () => {
  context('toAscii', () => {
    it('escapes strings, templates and identifiers', () => {
      expectSameResultInAscii(`var café = 'ẞ 公司 🙂'; [café, \`→\${café}←\`]`)
    })

    it('refuses a tagged template, whose raw text an escape would change', () => {
      expect(() => toAscii('String.raw`ẞ`')).to.throw('a character outside ASCII is still in the bundle')
    })

    it('escapes regular expressions, including identity escapes and astral characters', () => {
      expectSameResultInAscii(`[
        'aẞb'.replace(/ẞ/g, 'ss'),
        /[ẞ…]/.test('…'),
        /\\ẞ/.test('ẞ'),
        /\\\\ẞ/.test('\\\\ẞ'),
        /^🙂$/u.test('🙂'),
        /^[🙂]$/u.test('🙂'),
        /^.{2}$/.test('🙂'),
      ]`)
    })

    it('escapes comments, including legal comments', () => {
      const escaped = toAscii(`/*! © ẞ */\n// “quoted” →\nvar x = 1 /* … */\nx`)

      expect(isAscii(escaped)).to.be.true
      expect(escaped).to.include('\\u00A9')
      expect(evaluate(escaped)).to.equal(1)
    })

    it('reads ES modules', () => {
      const escaped = toAscii(`export const label = 'ẞ'\nexport default /ẞ/u`, { sourceType: 'module' })

      expect(isAscii(escaped)).to.be.true
      expect(escaped).to.include('export')
    })
  })

  context('escapeNonAscii', () => {
    it('escapes regular expressions and comments, which esbuild leaves as written', () => {
      const source = `/*! © */\n[/ẞ/.test('ẞ'), /\\ẞ/.test('ẞ'), /^[🙂]$/u.test('🙂')]`
      const { code } = escapeNonAscii(source)

      expect(isAscii(code)).to.be.true
      expect(evaluate(code)).to.deep.equal(evaluate(source))
    })

    it('moves the source map columns that follow an escape on the same line', () => {
      const source = `function normalize (text) {\n  return text.replace(/ẞ/g, 'ss').replace(/…/g, '...') + window.afterTheRegex(text)\n}\nwindow.normalize = normalize\n`
      const minified = transformSync(source, { minify: true, charset: 'ascii', sourcemap: true, sourcefile: 'normalize.js' })
      const { code, map } = escapeNonAscii(minified.code, JSON.parse(minified.map))
      const segment = decode(map.mappings)[0].find(([column]) => column === code.indexOf('afterTheRegex'))

      expect(segment?.slice(2)).to.deep.equal([1, source.split('\n')[1].indexOf('afterTheRegex')])
    })
  })

  context('writeBrowserBundlesAsAscii', () => {
    let appDir: string

    beforeEach(async () => {
      appDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ascii-browser-bundles-'))
    })

    afterEach(async () => {
      await fs.remove(appDir)
    })

    it('rewrites the runner and app bundles and leaves other files alone', async () => {
      const runner = path.join(appDir, 'packages', 'runner', 'dist', 'cypress_runner.js')
      const appChunk = path.join(appDir, 'packages', 'app', 'dist', 'assets', 'index.js')
      const css = path.join(appDir, 'packages', 'app', 'dist', 'assets', 'index.css')

      await fs.outputFile(runner, `window.label = 'ẞ'`)
      await fs.outputFile(appChunk, `export const label = 'ẞ'`)
      await fs.outputFile(css, `.a::before { content: 'ẞ' }`)

      await writeBrowserBundlesAsAscii(appDir)

      expect(await fs.readFile(runner, 'utf8')).to.include('"\\u1E9E"')
      expect(await fs.readFile(appChunk, 'utf8')).to.include('"\\u1E9E"')
      expect(await fs.readFile(css, 'utf8')).to.equal(`.a::before { content: 'ẞ' }`)
    })

    it('refuses a bundle with a linked source map, whose columns rewriting it would move', async () => {
      const runner = path.join(appDir, 'packages', 'runner', 'dist', 'cypress_runner.js')

      await fs.outputFile(runner, `window.pattern = /ẞ/\n//# sourceMappingURL=cypress_runner.js.map`)

      const error = await writeBrowserBundlesAsAscii(appDir).catch((err: Error) => err)

      expect(error).to.be.an('error').with.property('message').that.includes('has a source map')
    })
  })
})
