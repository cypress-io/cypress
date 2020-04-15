require('../../spec_helper')

const fs = require(`${root}../lib/util/fs`)
const scaffold = require(`${root}../lib/modes/init/scaffold`)
const cypressEx = require('@packages/example')
const { join, basename, dirname } = require('path')
const { defaultValues } = require(`${root}../lib/modes/init/scaffold/option_info`)
const spawn = require(`${root}../lib/modes/init/scaffold/fs/spawn`)
const log = require(`${root}../lib/modes/init/scaffold/fs/log`)
const install = require(`${root}../lib/modes/init/scaffold/fs/install`)

describe('/lib/modes/init', () => {
  describe('scaffold', () => {
    beforeEach(() => {
      sinon.stub(fs, 'writeFile').resolves()
      sinon.stub(fs, 'ensureDir').resolves()
      sinon.stub(fs, 'copy').resolves()
      sinon.stub(spawn, 'spawn').resolves()
      sinon.stub(log, 'log').resolves()
      sinon.stub(log, 'warn').resolves()
      sinon.stub(install, 'isYarn').resolves(false)
    })

    describe('options', () => {
      describe('checkArgs', () => {
        describe('empty path', () => {
          it('throws when fixtures-path is empty', () => {
            expect(() => scaffold.option.checkArgs({ fixturesPath: '' })).to.throw('Empty Path')
          })

          it('throws when support-path is empty', () => {
            expect(() => scaffold.option.checkArgs({ supportPath: '' })).to.throw('Empty Path')
          })

          it('throws when integration-path is empty', () => {
            expect(() => scaffold.option.checkArgs({ integrationPath: '' })).to.throw('Empty Path')
          })

          it('throws when plugins-path is empty', () => {
            expect(() => scaffold.option.checkArgs({ pluginsPath: '' })).to.throw('Empty Path')
          })
        })

        describe('conflicting arguments', () => {
          it('throws when no-fixtures is true and fixtures-path is given', () => {
            expect(() => {
              scaffold.option.checkArgs({
                fixtures: false,
                fixturesPath: 'great/tool' })
            }).to.throw('Conflicting Arguments')
          })

          it('throws when no-support is true and support-path is given', () => {
            expect(() => {
              scaffold.option.checkArgs({
                support: false,
                supportPath: 'awesome/day.js' })
            }).to.throw('Conflicting Arguments')
          })

          it('throws when no-plugins is true and plugins-path is given', () => {
            expect(() => {
              scaffold.option.checkArgs({
                plugins: false,
                pluginsPath: 'my/plugin.js' })
            }).to.throw('Conflicting Arguments')
          })
        })

        describe('default value warning', () => {
          beforeEach(() => {
            sinon.stub(console, 'warn')
          })

          it('warns when fixtures-path is the default value', () => {
            scaffold.option.checkArgs({
              fixturesPath: defaultValues['fixturesFolder'],
            })

            expect(log.warn).to.have.been.calledWith(`Fixtures folder path, '${defaultValues['fixturesFolder']}', is the default value. It'll be ignored.`)
          })

          it('warns when support-path is the default value', () => {
            scaffold.option.checkArgs({
              supportPath: defaultValues['supportFile'],
            })

            expect(log.warn).to.have.been.calledWith(`Support file path, '${defaultValues['supportFile']}', is the default value. It'll be ignored.`)
          })

          it('warns when integration-path is the default value', () => {
            scaffold.option.checkArgs({
              integrationPath: defaultValues['integrationFolder'],
            })

            expect(log.warn).to.have.been.calledWith(`Integration folder path, '${defaultValues['integrationFolder']}', is the default value. It'll be ignored.`)
          })

          it('warns when plugins-path is the default value', () => {
            scaffold.option.checkArgs({
              pluginsPath: defaultValues['pluginsFile'],
            })

            expect(log.warn).to.have.been.calledWith(`Plugins file path, '${defaultValues['pluginsFile']}', is the default value. It'll be ignored.`)
          })
        })

        describe('duplicate path values', () => {
          const cases = [
            ['fixturesFolder', 'supportFile'],
            ['fixturesFolder', 'integrationFolder'],
            ['fixturesFolder', 'pluginsFile'],
            ['supportFile', 'integrationFolder'],
            ['supportFile', 'pluginsFile'],
            ['integrationFolder', 'pluginsFile'],
          ]

          cases.forEach(([p1, p2]) => {
            it(`${p1} & ${p2}`, () => {
              expect(() => {
                const options = {}

                options[p1] = 'path/to/the/file'
                options[p2] = 'path/to/the/file'

                scaffold.option.checkArgs(options)
              }).to.throw('Duplicate Paths')
            })
          })
        })
      })

      describe('fromCommandArgs', () => {
        const result = () => ({ config: {} })

        describe('config options', () => {
          it('noFixtures', () => {
            const option = scaffold.option.fromCommandArgs({
              fixtures: false,
            }, result())

            expect(option).to.deep.eq({
              config: {
                fixturesFolder: false,
              },
            })
          })

          it('fixturesPath', () => {
            const option = scaffold.option.fromCommandArgs({
              fixturesPath: 'hello/path',
            }, result())

            expect(option).to.deep.eq({
              config: {
                fixturesFolder: 'hello/path',
              },
            })
          })

          it('fixturesPath is ignored if default', () => {
            const option = scaffold.option.fromCommandArgs({
              fixturesPath: defaultValues['fixturesFolder'],
            }, result())

            expect(option).to.deep.eq({
              config: { },
            })
          })

          it('noSupport', () => {
            const option = scaffold.option.fromCommandArgs({
              support: false,
            }, result())

            expect(option).to.deep.eq({
              config: {
                supportFile: false,
              },
            })
          })

          it('supportPath', () => {
            const option = scaffold.option.fromCommandArgs({
              supportPath: 'hi/path.js',
            }, result())

            expect(option).to.deep.eq({
              config: {
                supportFile: 'hi/path.js',
              },
            })
          })

          it('supportPath is ignored if default', () => {
            const option = scaffold.option.fromCommandArgs({
              supportPath: defaultValues['supportFile'],
            }, result())

            expect(option).to.deep.eq({
              config: { },
            })
          })

          it('noPlugins', () => {
            const option = scaffold.option.fromCommandArgs({
              plugins: false,
            }, result())

            expect(option).to.deep.eq({
              config: {
                pluginsFile: false,
              },
            })
          })

          it('pluginsPath', () => {
            const option = scaffold.option.fromCommandArgs({
              pluginsPath: 'good/plugin.js',
            }, result())

            expect(option).to.deep.eq({
              config: {
                pluginsFile: 'good/plugin.js',
              },
            })
          })

          it('pluginsPath is ignored if default', () => {
            const option = scaffold.option.fromCommandArgs({
              pluginsPath: defaultValues['pluginsFile'],
            }, result())

            expect(option).to.deep.eq({
              config: { },
            })
          })

          it('integrationPath', () => {
            const option = scaffold.option.fromCommandArgs({
              integrationPath: 'int/egra/tion',
            }, result())

            expect(option).to.deep.eq({
              config: {
                integrationFolder: 'int/egra/tion',
              },
            })
          })

          it('integrationPath is ignored if default', () => {
            const option = scaffold.option.fromCommandArgs({
              integrationPath: defaultValues['integrationFolder'],
            }, result())

            expect(option).to.deep.eq({
              config: { },
            })
          })

          it('noVideo', () => {
            const option = scaffold.option.fromCommandArgs({
              video: false,
            }, result())

            expect(option).to.deep.eq({
              config: {
                video: false,
              },
            })
          })
        })

        it('example', () => {
          const option = scaffold.option.fromCommandArgs({
            example: true,
          }, result())

          expect(option).to.deep.eq({
            config: {},
            example: true,
          })
        })

        it('typescript', () => {
          const option = scaffold.option.fromCommandArgs({
            typescript: true,
          }, result())

          expect(option).to.deep.eq({
            config: {},
            typescript: true,
          })
        })
      })
    })

    describe('create', () => {
      const projRoot = '/home/user/src/cypress'

      it('generates cypress.json with empty object', async () => {
        await scaffold.create(projRoot, { config: {} })

        expect(fs.writeFile).to.be.calledWith(`${projRoot}/cypress.json`, '{}')
      })

      describe('integration folder', () => {
        it('generates at the default path when it is undefined', async () => {
          await scaffold.create(projRoot, { config: {} })

          expect(fs.ensureDir).to.be.calledWith(`${projRoot}/${defaultValues['integrationFolder']}`)
        })

        it('generates at the given path', async () => {
          await scaffold.create(projRoot, {
            config: {
              integrationFolder: '/home/user/given/cypress',
            },
          })

          expect(fs.ensureDir).to.be.calledWith('/home/user/given/cypress')
        })

        it('examples are not generated without example option', async () => {
          await scaffold.create(projRoot, {
            config: {
              integrationFolder: '/home/user/int',
            },
          })

          expect(fs.ensureDir).to.not.be.calledWith('/home/user/int/examples')
        })

        it('examples are generated with example option', async () => {
          await scaffold.create(projRoot, {
            config: {
              integrationFolder: '/home/user/int',
            },
            example: true,
          })

          expect(fs.ensureDir).to.be.calledWith(join('/home/user/int/', 'examples'))

          const paths = await cypressEx.getPathToExamples()

          paths.forEach((path) => {
            expect(fs.copy).to.be.calledWith(path, join('/home/user/int/examples', basename(path)))
          })
        })

        it('examples are generated in ts files with example and typescript options', async () => {
          await scaffold.create(projRoot, {
            config: {
              integrationFolder: '/home/user/int',
            },
            example: true,
            typescript: true,
          })

          expect(fs.ensureDir).to.be.calledWith(join('/home/user/int/', 'examples'))

          const paths = await cypressEx.getPathToExamples()

          paths.forEach((path) => {
            const filename = basename(path).replace('.js', '.ts')

            expect(fs.copy).to.be.calledWith(path, join('/home/user/int/examples', filename))
          })
        })
      })

      describe('fixtures folder', () => {
        const fixturesFolderDefault = `${projRoot}/${defaultValues['fixturesFolder']}`

        it('generates folder at the default path when it is undefined', async () => {
          await scaffold.create(projRoot, { config: {} })

          expect(fs.ensureDir).to.be.calledWith(fixturesFolderDefault)
        })

        it('skips when the given path is not the default path', async () => {
          await scaffold.create(projRoot, {
            config: {
              fixturesFolder: '/home/user/given/fixtures',
            },
          })

          expect(fs.ensureDir).to.not.be.calledWith('/home/user/given/fixtures')
        })

        it('generates folder when the given path is the default path (relative)', async () => {
          await scaffold.create(projRoot, {
            config: {
              fixturesFolder: defaultValues['fixturesFolder'],
            },
          })

          expect(fs.ensureDir).to.be.calledWith(fixturesFolderDefault)
        })

        it('generates folder when the given path is the default path (absolute)', async () => {
          await scaffold.create(projRoot, {
            config: {
              fixturesFolder: `${projRoot}/${defaultValues['fixturesFolder']}`,
            },
          })

          expect(fs.ensureDir).to.be.calledWith(fixturesFolderDefault)
        })

        it('does not generate folder when fixturesFolder is false', async () => {
          await scaffold.create(projRoot, { config: {
            fixturesFolder: false,
          } })

          expect(fs.ensureDir).to.not.be.calledWith(fixturesFolderDefault)
          expect(fs.ensureDir).to.not.be.calledWith('/home/user/given/fixtures')
        })

        it('example.json is not generated without example option', async () => {
          await scaffold.create(projRoot, {
            config: { },
          })

          expect(fs.copy).to.not.be.calledWith(
            join(__dirname, '../../../', 'lib/scaffold/fixtures/example.json'),
            `${fixturesFolderDefault}/example.json`,
          )
        })

        it('example.json is generated with example option', async () => {
          await scaffold.create(projRoot, {
            config: { },
            example: true,
          })

          expect(fs.copy).to.be.calledWith(
            join(__dirname, '../../../', 'lib/scaffold/fixtures/example.json'),
            join(fixturesFolderDefault, 'example.json'),
          )
        })

        it('example.json is generated with example option and custom fixturesFolder path', async () => {
          await scaffold.create(projRoot, {
            config: {
              fixturesFolder: '/home/user/given/fixtures',
            },
            example: true,
          })

          expect(fs.copy).to.not.be.calledWith(
            join(__dirname, '../../../', 'lib/scaffold/fixtures/example.json'),
            '/home/user/given/fixtures/example.json',
          )
        })

        it('example.json is not generated with example option but fixturesFolder is false', async () => {
          await scaffold.create(projRoot, {
            config: {
              fixturesFolder: false,
            },
            example: true,
          })

          expect(fs.copy).to.not.be.calledWith(
            join(__dirname, '../../../', 'lib/scaffold/fixtures/example.json'),
            '/home/user/given/fixtures/example.json',
          )
        })
      })

      describe('support file', () => {
        const supportFileDefault = `${projRoot}/${defaultValues['supportFile']}`
        const supportFileDefaultDir = dirname(`${projRoot}/${defaultValues['supportFile']}`)

        it('generates files at the default path when it is undefined', async () => {
          await scaffold.create(projRoot, { config: {} })

          expect(fs.copy).to.be.calledWith(
            join(__dirname, '../../..', 'lib/scaffold/support/index.js'),
            join(supportFileDefaultDir, 'index.js'),
          )

          expect(fs.copy).to.be.calledWith(
            join(__dirname, '../../..', 'lib/scaffold/support/commands.js'),
            join(supportFileDefaultDir, 'commands.js'),
          )
        })

        it('skips when the given path is not the default', async () => {
          await scaffold.create(projRoot, {
            config: {
              supportFile: '/home/user/given/path/to/support.js',
            },
          })

          expect(fs.ensureDir).to.not.be.calledWith('/home/user/given/path/to/')
        })

        it('generates files when the given path is the default (relative)', async () => {
          await scaffold.create(projRoot, {
            config: {
              supportFile: defaultValues['supportFile'],
            },
          })

          expect(fs.copy).to.be.calledWith(
            join(__dirname, '../../..', 'lib/scaffold/support/index.js'),
            join(supportFileDefaultDir, 'index.js'),
          )

          expect(fs.copy).to.be.calledWith(
            join(__dirname, '../../..', 'lib/scaffold/support/commands.js'),
            join(supportFileDefaultDir, 'commands.js'),
          )
        })

        it('generates files when the given path is the default (absolute)', async () => {
          await scaffold.create(projRoot, {
            config: {
              supportFile: supportFileDefault,
            },
          })

          expect(fs.copy).to.be.calledWith(
            join(__dirname, '../../..', 'lib/scaffold/support/index.js'),
            join(supportFileDefaultDir, 'index.js'),
          )

          expect(fs.copy).to.be.calledWith(
            join(__dirname, '../../..', 'lib/scaffold/support/commands.js'),
            join(supportFileDefaultDir, 'commands.js'),
          )
        })

        it('does not generate when supportFile is false', async () => {
          await scaffold.create(projRoot, { config: {
            supportFile: false,
          } })

          expect(fs.copy).to.not.be.calledWith(
            join(__dirname, '../../..', 'lib/scaffold/support/index.js'),
            join(supportFileDefaultDir, 'index.js'),
          )

          expect(fs.copy).to.not.be.calledWith(
            join(__dirname, '../../..', 'lib/scaffold/support/commands.js'),
            join(supportFileDefaultDir, 'commands.js'),
          )
        })

        it('generates ts file when typescript option is given', async () => {
          await scaffold.create(projRoot, {
            typescript: true,
            config: {},
          })

          expect(fs.copy).to.be.calledWith(
            join(__dirname, '../../..', 'lib/scaffold/support/index.js'),
            join(supportFileDefaultDir, 'index.ts'),
          )

          expect(fs.copy).to.be.calledWith(
            join(__dirname, '../../..', 'lib/scaffold/support/commands.js'),
            join(supportFileDefaultDir, 'commands.ts'),
          )
        })
      })

      describe('plugins file', () => {
        const pluginsFileDefault = `${projRoot}/${defaultValues['pluginsFile']}`
        const pluginsFileDefaultDir = dirname(`${projRoot}/${defaultValues['pluginsFile']}`)

        it('generates files at the default path when it is undefined', async () => {
          await scaffold.create(projRoot, { config: {} })

          expect(fs.copy).to.be.calledWith(
            join(__dirname, '../../..', 'lib/scaffold/plugins/index.js'),
            join(pluginsFileDefaultDir, 'index.js'),
          )
        })

        it('skips when the given path is not the default', async () => {
          await scaffold.create(projRoot, {
            config: {
              pluginsFile: '/home/user/given/path/to/plugins.js',
            },
          })

          expect(fs.ensureDir).to.not.be.calledWith('/home/user/given/path/to/')
        })

        it('generates files when the given path is the default (relative)', async () => {
          await scaffold.create(projRoot, {
            config: {
              pluginsFile: defaultValues['pluginsFile'],
            },
          })

          expect(fs.copy).to.be.calledWith(
            join(__dirname, '../../..', 'lib/scaffold/plugins/index.js'),
            join(pluginsFileDefaultDir, 'index.js'),
          )
        })

        it('generates files when the given path is the default (absolute)', async () => {
          await scaffold.create(projRoot, {
            config: {
              pluginsFile: pluginsFileDefault,
            },
          })

          expect(fs.copy).to.be.calledWith(
            join(__dirname, '../../..', 'lib/scaffold/plugins/index.js'),
            join(pluginsFileDefaultDir, 'index.js'),
          )
        })

        it('does not generate when pluginsFile is false', async () => {
          await scaffold.create(projRoot, { config: {
            pluginsFile: false,
          } })

          expect(fs.copy).to.not.be.calledWith(
            join(__dirname, '../../..', 'lib/scaffold/plugins/index.js'),
            join(pluginsFileDefaultDir, 'index.js'),
          )
        })

        it('generates ts file when typescript option is given', async () => {
          await scaffold.create(projRoot, {
            typescript: true,
            config: {},
          })

          expect(fs.copy).to.be.calledWith(
            join(__dirname, '../../..', 'lib/scaffold/plugins/index.js'),
            join(pluginsFileDefaultDir, 'index.ts'),
          )
        })
      })

      describe('install packages', () => {
        it('no install', async () => {
          await scaffold.create(projRoot, {
            config: {},
            eslint: false,
          })

          expect(log.log).to.be.calledWith('Nothing to install.')
          expect(spawn.spawn).to.not.be.calledWith('npm', ['i', '-D', 'eslint', 'eslint-plugin-cypress'])
        })

        it('installs eslint', async () => {
          await scaffold.create(projRoot, {
            config: {},
          })

          expect(spawn.spawn).to.be.calledWith('npm', ['i', '-D', 'eslint', 'eslint-plugin-cypress'])
        })

        it('installs typescript', async () => {
          await scaffold.create(projRoot, {
            config: {},
            eslint: false,
            typescript: true,
          })

          expect(spawn.spawn).to.be.calledWith('npm', ['i', '-D', 'typescript'])
        })

        it('installs eslint-plugin-chai-friendly', async () => {
          await scaffold.create(projRoot, {
            config: {},
            chaiFriendly: true,
          })

          expect(spawn.spawn).to.be.calledWith('npm', ['i', '-D', 'eslint', 'eslint-plugin-cypress', 'eslint-plugin-chai-friendly'])
        })

        it('installs all', async () => {
          await scaffold.create(projRoot, {
            config: {},
            typescript: true,
            chaiFriendly: true,
          })

          expect(spawn.spawn).to.be.calledWith('npm', ['i', '-D', 'typescript', 'eslint', 'eslint-plugin-cypress', 'eslint-plugin-chai-friendly'])
        })

        it('installs with yarn', async () => {
          install.isYarn.restore()
          sinon.stub(install, 'isYarn').resolves(true)

          await scaffold.create(projRoot, {
            config: {},
          })

          expect(spawn.spawn).to.be.calledWith('yarn', ['add', '--dev', 'eslint', 'eslint-plugin-cypress'])
        })
      })
    })
  })
})
