require('../../spec_helper')

const fs = require(`${root}../lib/util/fs`)
const scaffold = require(`${root}../lib/modes/init/scaffold`)
const { defaultValues } = require(`${root}../lib/modes/init/scaffold/option_info`)

describe('/lib/modes/init', () => {
  describe('scaffold', () => {
    beforeEach(() => {
      sinon.stub(fs, 'writeFile').resolves()
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
                noFixtures: true,
                fixturesPath: 'great/tool' })
            }).to.throw('Conflicting Arguments')
          })

          it('throws when no-support is true and support-path is given', () => {
            expect(() => {
              scaffold.option.checkArgs({
                noSupport: true,
                supportPath: 'awesome/day.js' })
            }).to.throw('Conflicting Arguments')
          })

          it('throws when no-plugins is true and plugins-path is given', () => {
            expect(() => {
              scaffold.option.checkArgs({
                noPlugins: true,
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

            // eslint-disable-next-line no-console
            expect(console.warn).to.have.been.calledWith(`Fixtures folder path, '${defaultValues['fixturesFolder']}', is the default value. It'll be ignored.`)
          })

          it('warns when support-path is the default value', () => {
            scaffold.option.checkArgs({
              supportPath: defaultValues['supportFile'],
            })

            // eslint-disable-next-line no-console
            expect(console.warn).to.have.been.calledWith(`Support file path, '${defaultValues['supportFile']}', is the default value. It'll be ignored.`)
          })

          it('warns when integration-path is the default value', () => {
            scaffold.option.checkArgs({
              integrationPath: defaultValues['integrationFolder'],
            })

            // eslint-disable-next-line no-console
            expect(console.warn).to.have.been.calledWith(`Integration folder path, '${defaultValues['integrationFolder']}', is the default value. It'll be ignored.`)
          })

          it('warns when plugins-path is the default value', () => {
            scaffold.option.checkArgs({
              pluginsPath: defaultValues['pluginsFile'],
            })

            // eslint-disable-next-line no-console
            expect(console.warn).to.have.been.calledWith(`Plugins file path, '${defaultValues['pluginsFile']}', is the default value. It'll be ignored.`)
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
        describe('config options', () => {
          it('noFixtures', () => {
            const option = scaffold.option.fromCommandArgs({
              noFixtures: true,
            })

            expect(option).to.deep.eq({
              config: {
                fixturesFolder: false,
              },
            })
          })

          it('fixturesPath', () => {
            const option = scaffold.option.fromCommandArgs({
              fixturesPath: 'hello/path',
            })

            expect(option).to.deep.eq({
              config: {
                fixturesFolder: 'hello/path',
              },
            })
          })

          it('fixturesPath is ignored if default', () => {
            const option = scaffold.option.fromCommandArgs({
              fixturesPath: defaultValues['fixturesFolder'],
            })

            expect(option).to.deep.eq({
              config: { },
            })
          })

          it('noSupport', () => {
            const option = scaffold.option.fromCommandArgs({
              noSupport: true,
            })

            expect(option).to.deep.eq({
              config: {
                supportFile: false,
              },
            })
          })

          it('supportPath', () => {
            const option = scaffold.option.fromCommandArgs({
              supportPath: 'hi/path.js',
            })

            expect(option).to.deep.eq({
              config: {
                supportFile: 'hi/path.js',
              },
            })
          })

          it('supportPath is ignored if default', () => {
            const option = scaffold.option.fromCommandArgs({
              supportPath: defaultValues['supportFile'],
            })

            expect(option).to.deep.eq({
              config: { },
            })
          })

          it('noPlugins', () => {
            const option = scaffold.option.fromCommandArgs({
              noPlugins: true,
            })

            expect(option).to.deep.eq({
              config: {
                pluginsFile: false,
              },
            })
          })

          it('pluginsPath', () => {
            const option = scaffold.option.fromCommandArgs({
              pluginsPath: 'good/plugin.js',
            })

            expect(option).to.deep.eq({
              config: {
                pluginsFile: 'good/plugin.js',
              },
            })
          })

          it('pluginsPath is ignored if default', () => {
            const option = scaffold.option.fromCommandArgs({
              pluginsPath: defaultValues['pluginsFile'],
            })

            expect(option).to.deep.eq({
              config: { },
            })
          })

          it('integrationPath', () => {
            const option = scaffold.option.fromCommandArgs({
              integrationPath: 'int/egra/tion',
            })

            expect(option).to.deep.eq({
              config: {
                integrationFolder: 'int/egra/tion',
              },
            })
          })

          it('integrationPath is ignored if default', () => {
            const option = scaffold.option.fromCommandArgs({
              integrationPath: defaultValues['integrationFolder'],
            })

            expect(option).to.deep.eq({
              config: { },
            })
          })

          it('noVideo', () => {
            const option = scaffold.option.fromCommandArgs({
              noVideo: true,
            })

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
          })

          expect(option).to.deep.eq({
            config: {},
            example: true,
          })
        })

        it('typescript', () => {
          const option = scaffold.option.fromCommandArgs({
            typescript: true,
          })

          expect(option).to.deep.eq({
            config: {},
            typescript: true,
          })
        })
      })
    })

    describe('create', () => {
      it('generates cypress.json with empty object', () => {
        const projRoot = '/home/user/src/cypress'

        scaffold.create(projRoot, { config: {} })

        expect(fs.writeFile).to.be.calledWith(`${projRoot}/cypress.json`, '{}')
      })
    })
  })
})
