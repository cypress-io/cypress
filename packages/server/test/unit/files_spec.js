require('../spec_helper')

const config = require(`${root}lib/config`)
const files = require(`${root}lib/files`)
const FixturesHelper = require(`${root}/test/support/helpers/fixtures`)

describe('lib/files', () => {
  beforeEach(function () {
    FixturesHelper.scaffold()

    this.todosPath = FixturesHelper.projectPath('todos')

    return config.get(this.todosPath).then((cfg) => {
      this.config = cfg;
      ({ projectRoot: this.projectRoot } = cfg)
    })
  })

  afterEach(() => {
    return FixturesHelper.remove()
  })

  context('#readFile', () => {
    it('returns contents and full file path', function () {
      return files.readFile(this.projectRoot, 'tests/_fixtures/message.txt').then(({ contents, filePath }) => {
        expect(contents).to.eq('foobarbaz')

        expect(filePath).to.include('/.projects/todos/tests/_fixtures/message.txt')
      })
    })

    it('returns uses utf8 by default', function () {
      return files.readFile(this.projectRoot, 'tests/_fixtures/ascii.foo').then(({ contents }) => {
        expect(contents).to.eq('\n')
      })
    })

    it('uses encoding specified in options', function () {
      return files.readFile(this.projectRoot, 'tests/_fixtures/ascii.foo', { encoding: 'ascii' }).then(({ contents }) => {
        expect(contents).to.eq('o#?\n')
      })
    })

    it('parses json to valid JS object', function () {
      return files.readFile(this.projectRoot, 'tests/_fixtures/users.json').then(({ contents }) => {
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

  context('#writeFile', () => {
    it('writes the file\'s contents and returns contents and full file path', function () {
      return files.writeFile(this.projectRoot, '.projects/write_file.txt', 'foo').then(() => {
        return files.readFile(this.projectRoot, '.projects/write_file.txt').then(({ contents, filePath }) => {
          expect(contents).to.equal('foo')

          expect(filePath).to.include('/.projects/todos/.projects/write_file.txt')
        })
      })
    })

    it('uses encoding specified in options', function () {
      return files.writeFile(this.projectRoot, '.projects/write_file.txt', '', { encoding: 'ascii' }).then(() => {
        return files.readFile(this.projectRoot, '.projects/write_file.txt').then(({ contents }) => {
          expect(contents).to.equal('�')
        })
      })
    })

    it('overwrites existing file by default', function () {
      return files.writeFile(this.projectRoot, '.projects/write_file.txt', 'foo').then(() => {
        return files.readFile(this.projectRoot, '.projects/write_file.txt').then(({ contents }) => {
          expect(contents).to.equal('foo')

          return files.writeFile(this.projectRoot, '.projects/write_file.txt', 'bar').then(() => {
            return files.readFile(this.projectRoot, '.projects/write_file.txt').then(({ contents }) => {
              expect(contents).to.equal('bar')
            })
          })
        })
      })
    })

    it('appends content to file when specified', function () {
      return files.writeFile(this.projectRoot, '.projects/write_file.txt', 'foo').then(() => {
        return files.readFile(this.projectRoot, '.projects/write_file.txt').then(({ contents }) => {
          expect(contents).to.equal('foo')

          return files.writeFile(this.projectRoot, '.projects/write_file.txt', 'bar', { flag: 'a+' }).then(() => {
            return files.readFile(this.projectRoot, '.projects/write_file.txt').then(({ contents }) => {
              expect(contents).to.equal('foobar')
            })
          })
        })
      })
    })
  })
})
