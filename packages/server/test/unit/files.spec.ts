import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { readFile, writeFile } from '../../lib/files'
import FixturesHelper from '@tooling/system-tests'

describe('lib/files', () => {
  let projectRoot: string

  beforeAll(() => {
    FixturesHelper.scaffold()
    projectRoot = FixturesHelper.projectPath('todos')
  })

  afterAll(() => {
    return FixturesHelper.remove()
  })

  describe('#readFile', () => {
    it('returns contents and full file path', () => {
      return readFile(projectRoot, { file: 'tests/_fixtures/message.txt' }).then(({ contents, filePath }) => {
        expect(contents).toBe('foobarbaz')

        expect(filePath).toContain('/cy-projects/todos/tests/_fixtures/message.txt')
      })
    })

    it('returns uses utf8 by default', () => {
      return readFile(projectRoot, { file: 'tests/_fixtures/ascii.foo' }).then(({ contents }) => {
        expect(contents).toBe('\n')
      })
    })

    it('uses encoding specified in options', () => {
      return readFile(projectRoot, { file: 'tests/_fixtures/ascii.foo', encoding: 'ascii' }).then(({ contents }) => {
        expect(contents).toBe('o#?\n')
      })
    })

    // https://github.com/cypress-io/cypress/issues/1558
    it('explicit null encoding is sent to driver as a Buffer', () => {
      return readFile(projectRoot, { file: 'tests/_fixtures/ascii.foo', encoding: null }).then(({ contents }) => {
        expect(contents).toEqual(Buffer.from('\n'))
      })
    })

    it('parses json to valid JS object', () => {
      return readFile(projectRoot, { file: 'tests/_fixtures/users.json' }).then(({ contents }) => {
        expect(contents).toEqual([
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

  describe('#writeFile', () => {
    it('writes the file\'s contents and returns contents and full file path', () => {
      return writeFile(projectRoot, { fileName: '.projects/write_file.txt', contents: 'foo' }).then(() => {
        return readFile(projectRoot, { file: '.projects/write_file.txt' }).then(({ contents, filePath }) => {
          expect(contents).toBe('foo')

          expect(filePath).toContain('/cy-projects/todos/.projects/write_file.txt')
        })
      })
    })

    it('uses encoding specified in options', () => {
      return writeFile(projectRoot, { fileName: '.projects/write_file.txt', contents: '', encoding: 'ascii' }).then(() => {
        return readFile(projectRoot, { file: '.projects/write_file.txt' }).then(({ contents }) => {
          expect(contents).toBe('�')
        })
      })
    })

    // https://github.com/cypress-io/cypress/issues/1558
    it('explicit null encoding is written exactly as received', () => {
      return writeFile(projectRoot, { fileName: '.projects/write_file.txt', contents: Buffer.from(''), encoding: null }).then(() => {
        return readFile(projectRoot, { file: '.projects/write_file.txt', encoding: null }).then(({ contents }) => {
          expect(contents).toEqual(Buffer.from(''))
        })
      })
    })

    it('overwrites existing file by default', () => {
      return writeFile(projectRoot, { fileName: '.projects/write_file.txt', contents: 'foo' }).then(() => {
        return readFile(projectRoot, { file: '.projects/write_file.txt' }).then(({ contents }) => {
          expect(contents).toBe('foo')

          return writeFile(projectRoot, { fileName: '.projects/write_file.txt', contents: 'bar' }).then(() => {
            return readFile(projectRoot, { file: '.projects/write_file.txt' }).then(({ contents }) => {
              expect(contents).toBe('bar')
            })
          })
        })
      })
    })

    it('appends content to file when specified', () => {
      return writeFile(projectRoot, { fileName: '.projects/write_file.txt', contents: 'foo' }).then(() => {
        return readFile(projectRoot, { file: '.projects/write_file.txt' }).then(({ contents }) => {
          expect(contents).toBe('foo')

          return writeFile(projectRoot, { fileName: '.projects/write_file.txt', contents: 'bar', flag: 'a+' }).then(() => {
            return readFile(projectRoot, { file: '.projects/write_file.txt' }).then(({ contents }) => {
              expect(contents).toBe('foobar')
            })
          })
        })
      })
    })
  })
})
