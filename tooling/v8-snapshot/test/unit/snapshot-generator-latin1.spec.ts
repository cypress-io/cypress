import path from 'path'
import fs from 'fs-extra'
import { expect, use } from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { SourceMapConsumer, SourceMapGenerator } from 'source-map-js'
import { SnapshotGenerator } from '../../src/generator/snapshot-generator'
import { shiftGeneratedColumns } from '../../src/sourcemap/shift-generated-columns'
import { escapeNonLatin1 } from '../../src/generator/escape-non-latin1'

use(chaiAsPromised)

const LATIN1 = /^[\0-\xff]*$/

describe('snapshot generator keeps the snapshot script Latin-1', () => {
  let projectBaseDir: string
  let cacheDir: string

  const generator = (opts: { minify?: boolean, useExistingSnapshotScript?: boolean } = {}) => {
    return new SnapshotGenerator(projectBaseDir, path.join(projectBaseDir, 'entry.js'), {
      cacheDir,
      nodeModulesOnly: false,
      ...opts,
    })
  }

  const readScript = () => fs.readFile(path.join(cacheDir, 'snapshot.js'), 'utf8')

  beforeEach(async () => {
    // Inside the package so the generator can resolve electron from the project
    projectBaseDir = await fs.mkdtemp(path.join(__dirname, '..', 'fixtures', 'tmp-latin1-'))
    cacheDir = path.join(projectBaseDir, 'cache')

    await fs.writeFile(path.join(projectBaseDir, 'package.json'), '{ "name": "latin1" }')
    await fs.writeFile(path.join(projectBaseDir, 'yarn.lock'), '')
    await fs.writeFile(path.join(projectBaseDir, 'entry.js'), [
      '// s\u2019adagia',
      'const quotes = /[\u2018\u201C]/',
      'module.exports = { quotes, apostrophe: \'\u2019\' }',
    ].join('\n'))
  })

  afterEach(() => fs.remove(projectBaseDir))

  it('escapes the assembled script', async () => {
    await generator().createScript()

    const script = await readScript()

    expect(script).to.match(LATIN1)
    expect(script).to.contain('/[\\u2018\\u201C]/')
  })

  it('escapes the minified script', async () => {
    await generator({ minify: true }).createScript()

    expect(await readScript()).to.match(LATIN1)
  })

  it('escapes an existing script', async () => {
    await fs.outputFile(path.join(cacheDir, 'snapshot.js'), 'var s = "\u2019"')
    await generator({ useExistingSnapshotScript: true }).createScript()

    expect(await readScript()).to.equal('var s = "\\u2019"')
  })

  it('refuses to make a snapshot from a script with a char above U+00FF', async () => {
    const snapshotGenerator = generator()

    await fs.outputFile(path.join(cacheDir, 'snapshot.js'), 'var s = "\u2019"')
    snapshotGenerator.snapshotScript = Buffer.from('var s = "\u2019"')

    await expect(snapshotGenerator.makeSnapshot()).to.be.rejectedWith(/snapshot\.js contains a character above U\+00FF at line 1, column 10/)
  })
})

describe('shiftGeneratedColumns', () => {
  it('moves the generated columns after each edit on the edited lines only', () => {
    const map = new SourceMapGenerator({ file: 'snapshot.js' })
    const add = (line: number, column: number, originalColumn: number) => {
      map.addMapping({ generated: { line, column }, original: { line: 1, column: originalColumn }, source: 'entry.js' })
    }

    // Line 1: `a="X";b=1` with X escaped to six characters; line 2 is not edited
    add(1, 0, 0)
    add(1, 2, 2)
    add(1, 6, 10)
    add(2, 6, 20)

    const shifted = new SourceMapConsumer(JSON.parse(shiftGeneratedColumns(map.toString(), 'a="X";b=1\nc=1;d=2', [{ index: 3, delta: 5 }])))
    const columns: Array<[number, number]> = []

    shifted.eachMapping((m) => columns.push([m.generatedLine, m.generatedColumn]))

    expect(columns).to.deep.equal([[1, 0], [1, 2], [1, 11], [2, 6]])
  })

  it('keeps each mapping on its token when escaping adds columns and line breaks', () => {
    const script = 'a=1 /*\u2028*/ b="\u2019";c=2 // \u2028d=3\ne="\u2019";f=4'
    const { code, edits } = escapeNonLatin1(script)
    const tokens = ['a', 'b', 'c', 'd', 'e', 'f']
    const position = (source: string, token: string) => {
      const before = source.slice(0, source.indexOf(`${token}=`))

      return { line: before.split('\n').length, column: before.length - before.lastIndexOf('\n') - 1 }
    }
    const map = new SourceMapGenerator({ file: 'snapshot.js' })

    tokens.forEach((name, i) => {
      map.addMapping({ generated: position(script, name), original: { line: 1, column: i }, source: 'entry.js', name })
    })

    const shifted = new SourceMapConsumer(JSON.parse(shiftGeneratedColumns(map.toString(), script, edits)))
    const generated: Record<string, { line: number, column: number }> = {}

    shifted.eachMapping((m) => {
      generated[m.name] = { line: m.generatedLine, column: m.generatedColumn }
    })

    expect(code.split('\n')).to.have.length(4)
    expect(generated).to.deep.equal(Object.fromEntries(tokens.map((name) => [name, position(code, name)])))
  })

  it('returns the map unchanged when there are no edits', () => {
    expect(shiftGeneratedColumns('{"mappings":"AAAA"}', 'a', [])).to.equal('{"mappings":"AAAA"}')
  })
})
