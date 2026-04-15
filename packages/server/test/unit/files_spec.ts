import path from 'path'
import { createReadFileStreamFromPath, readFile, writeFile } from '../../lib/files'
import FixturesHelper from '@tooling/system-tests'
import { setCtx, makeDataContext, clearCtx } from '../../lib/makeDataContext'
import { getCtx } from '@packages/data-context'
import { expect } from 'chai'
let ctx

describe('lib/files', () => {
  before(async function () {
    // Clear and set up DataContext
    await clearCtx()
    // @ts-expect-error
    setCtx(makeDataContext({}))
    ctx = getCtx()

    // needed to run these tests locally
    // sinon.stub(ctx.browser, 'machineBrowsers').resolves([
    //   {
    //     channel: 'stable',
    //     displayName: 'Electron',
    //     family: 'chromium',
    //     majorVersion: '123',
    //     name: 'electron',
    //     path: 'path-to-browser-one',
    //     version: '123.45.67',
    //   },
    // ])

    FixturesHelper.scaffold()
    this.todosPath = FixturesHelper.projectPath('todos')

    await ctx.actions.project.setCurrentProjectAndTestingTypeForTestSetup(this.todosPath)

    const cfg = await ctx.lifecycleManager.getFullInitialConfig()

    this.config = cfg
    this.projectRoot = cfg.projectRoot

    await ctx.actions.project.setCurrentProjectAndTestingTypeForTestSetup(this.projectRoot)
  })

  after(() => {
    return FixturesHelper.remove()
  })

  context('#readFile', () => {
    it('returns contents and full file path', function () {
      return readFile(this.projectRoot, { file: 'tests/_fixtures/message.txt' }).then(({ contents, filePath }) => {
        expect(contents).to.eq('foobarbaz')

        expect(filePath).to.include('/cy-projects/todos/tests/_fixtures/message.txt')
      })
    })

    it('returns uses utf8 by default', function () {
      return readFile(this.projectRoot, { file: 'tests/_fixtures/ascii.foo' }).then(({ contents }) => {
        expect(contents).to.eq('\n')
      })
    })

    it('uses encoding specified in options', function () {
      return readFile(this.projectRoot, { file: 'tests/_fixtures/ascii.foo', encoding: 'ascii' }).then(({ contents }) => {
        expect(contents).to.eq('o#?\n')
      })
    })

    // https://github.com/cypress-io/cypress/issues/1558
    it('explicit null encoding is sent to driver as a Buffer', function () {
      return readFile(this.projectRoot, { file: 'tests/_fixtures/ascii.foo', encoding: null }).then(({ contents }) => {
        expect(contents).to.eql(Buffer.from('\n'))
      })
    })

    it('parses json to valid JS object', function () {
      return readFile(this.projectRoot, { file: 'tests/_fixtures/users.json' }).then(({ contents }) => {
        expect(contents).to.eql([
          {
            id: 1,
            name: 'brian',
          }, {
            id: 2,
            name: 'jennifer',
          },
        ])
      })
    })
  })

  context('#createReadFileStreamFromPath', () => {
    it('should stream large files in multiple chunks', async function () {
      const relativeFilePath = '.projects/stream_file.txt'
      const largeContents = 'stream'.repeat(16 * 1024)

      await writeFile(this.projectRoot, {
        fileName: relativeFilePath,
        contents: largeContents,
      })

      const filePath = path.resolve(this.projectRoot, relativeFilePath)
      const { stream } = await createReadFileStreamFromPath({
        filePath,
        originalFilePath: relativeFilePath,
      })
      const chunks: Buffer[] = []

      for await (const chunk of stream) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
      }

      expect(chunks.length).to.be.greaterThan(1)
      expect(Buffer.concat(chunks).toString('utf8')).to.equal(largeContents)
      expect(filePath).to.equal(`${this.projectRoot}/${relativeFilePath}`)
    })
  })

  context('#writeFile', () => {
    it('writes the file\'s contents and returns contents and full file path', function () {
      return writeFile(this.projectRoot, { fileName: '.projects/write_file.txt', contents: 'foo' }).then(() => {
        return readFile(this.projectRoot, { file: '.projects/write_file.txt' }).then(({ contents, filePath }) => {
          expect(contents).to.equal('foo')

          expect(filePath).to.include('/cy-projects/todos/.projects/write_file.txt')
        })
      })
    })

    it('uses encoding specified in options', function () {
      return writeFile(this.projectRoot, { fileName: '.projects/write_file.txt', contents: '', encoding: 'ascii' }).then(() => {
        return readFile(this.projectRoot, { file: '.projects/write_file.txt' }).then(({ contents }) => {
          expect(contents).to.equal('�')
        })
      })
    })

    // https://github.com/cypress-io/cypress/issues/1558
    it('explicit null encoding is written exactly as received', function () {
      return writeFile(this.projectRoot, { fileName: '.projects/write_file.txt', contents: Buffer.from(''), encoding: null }).then(() => {
        return readFile(this.projectRoot, { file: '.projects/write_file.txt', encoding: null }).then(({ contents }) => {
          expect(contents).to.eql(Buffer.from(''))
        })
      })
    })

    it('overwrites existing file by default', function () {
      return writeFile(this.projectRoot, { fileName: '.projects/write_file.txt', contents: 'foo' }).then(() => {
        return readFile(this.projectRoot, { file: '.projects/write_file.txt' }).then(({ contents }) => {
          expect(contents).to.equal('foo')

          return writeFile(this.projectRoot, { fileName: '.projects/write_file.txt', contents: 'bar' }).then(() => {
            return readFile(this.projectRoot, { file: '.projects/write_file.txt' }).then(({ contents }) => {
              expect(contents).to.equal('bar')
            })
          })
        })
      })
    })

    it('appends content to file when specified', function () {
      return writeFile(this.projectRoot, { fileName: '.projects/write_file.txt', contents: 'foo' }).then(() => {
        return readFile(this.projectRoot, { file: '.projects/write_file.txt' }).then(({ contents }) => {
          expect(contents).to.equal('foo')

          return writeFile(this.projectRoot, { fileName: '.projects/write_file.txt', contents: 'bar', flag: 'a+' }).then(() => {
            return readFile(this.projectRoot, { file: '.projects/write_file.txt' }).then(({ contents }) => {
              expect(contents).to.equal('foobar')
            })
          })
        })
      })
    })
  })
})
