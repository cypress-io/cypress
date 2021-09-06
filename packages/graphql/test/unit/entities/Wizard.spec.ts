import type { FullConfig } from '@packages/types'
import { expect } from 'chai'
import { LocalProject, Wizard } from '../../../src'
import { TestActions, TestContext } from '../../integration/utils'

const createActionsWithResolvedConfig = (cfg: FullConfig) => {
  const Ctor = class Actions extends TestActions {
    resolveOpenProjectConfig () {
      return cfg
    }
  }

  return Ctor
}

describe('Wizard', () => {
  describe('#shouldLaunchCt', () => {
    it('returns true if active project is configured and selected testing type is component', () => {
      const Actions = createActionsWithResolvedConfig({
        resolved: {
          component: {
            from: 'config',
            value: {
              testFiles: {
                value: '*',
                from: 'config',
              },
            },
          },
        },
      } as const)

      const ctx = new TestContext({ Actions })
      const project = new LocalProject('/', ctx)

      ctx.localProjects = [project]
      const wizard = new Wizard(ctx)

      wizard.setTestingType('component')

      expect(wizard.shouldLaunchCt).to.be.true
      expect(wizard.shouldSetupCt).to.be.false
    })

    it('false if chosenTestingType is e2e', () => {
      const Actions = createActionsWithResolvedConfig({
        resolved: {
          component: {
            from: 'config',
            value: {
              testFiles: {
                value: '*',
                from: 'config',
              },
            },
          },
        },
      } as const)

      const ctx = new TestContext({ Actions })
      const project = new LocalProject('/', ctx)

      ctx.localProjects = [project]
      const wizard = new Wizard(ctx)

      wizard.setTestingType('e2e')

      expect(wizard.shouldLaunchCt).to.be.false
    })

    // When cypress.config.ts is merged this will change to
    // if not setupDevServer is present.
    it('false if no ct specific config exists', () => {
      const Actions = createActionsWithResolvedConfig({
        resolved: {
          component: {
            from: 'config',
            value: {},
          },
        },
      } as const)

      const ctx = new TestContext({ Actions })
      const project = new LocalProject('/', ctx)

      ctx.localProjects = [project]
      const wizard = new Wizard(ctx)

      wizard.setTestingType('component')

      expect(wizard.shouldLaunchCt).to.be.false
      expect(wizard.shouldSetupCt).to.be.true
    })
  })

  describe('#shouldLaunchE2E', () => {
    it('returns true if active project is configured and selected testing type is e2e', () => {
      const Actions = createActionsWithResolvedConfig({
        resolved: {
          e2e: {
            from: 'config',
            value: {
              testFiles: {
                value: '*',
                from: 'config',
              },
            },
          },
        },
      } as const)

      const ctx = new TestContext({ Actions })
      const project = new LocalProject('/', ctx)

      ctx.localProjects = [project]
      const wizard = new Wizard(ctx)

      wizard.setTestingType('e2e')

      expect(wizard.shouldLaunchE2E).to.be.true
      expect(wizard.shouldSetupE2E).to.be.false
    })

    it('false if chosenTestingType is component', () => {
      const Actions = createActionsWithResolvedConfig({
        resolved: {
          e2e: {
            from: 'config',
            value: {
              testFiles: {
                value: '*',
                from: 'config',
              },
            },
          },
        },
      } as const)

      const ctx = new TestContext({ Actions })
      const project = new LocalProject('/', ctx)

      ctx.localProjects = [project]
      const wizard = new Wizard(ctx)

      wizard.setTestingType('component')

      expect(wizard.shouldLaunchE2E).to.be.false
    })

    // When cypress.config.ts is merged this will change to
    // if not setupDevServer is present.
    it('false if no e2e specific config exists', () => {
      const Actions = createActionsWithResolvedConfig({
        resolved: {
          e2e: {
            from: 'config',
            value: {},
          },
        },
      } as const)

      const ctx = new TestContext({ Actions })
      const project = new LocalProject('/', ctx)

      ctx.localProjects = [project]
      const wizard = new Wizard(ctx)

      wizard.setTestingType('e2e')

      expect(wizard.shouldLaunchE2E).to.be.false
      expect(wizard.shouldSetupE2E).to.be.true
    })
  })

  describe('#navigate', () => {
    context('chosenTestingType is component, component testing is not configured', () => {
      it('progresses through wizard steps', () => {
        const Actions = createActionsWithResolvedConfig({
          resolved: {
            component: {
              from: 'default',
              value: {},
            },
          },
        } as const)
        const ctx = new TestContext({ Actions })
        const project = new LocalProject('/', ctx)

        ctx.localProjects = [project]
        const wizard = new Wizard(ctx)

        wizard.setTestingType('component')

        wizard.navigate('forward')
        expect(wizard.step).to.eq('selectFramework')
        expect(wizard.history).to.eqls(['welcome', 'selectFramework'])

        wizard.navigate('forward')
        // no change - need to choose bundler/framework
        expect(wizard.step).to.eq('selectFramework')
        expect(wizard.history).to.eqls(['welcome', 'selectFramework'])

        wizard.setBundler('webpack')
        wizard.setFramework('react')
        wizard.navigate('forward')
        expect(wizard.step).to.eq('installDependencies')
        expect(wizard.history).to.eqls(['welcome', 'selectFramework', 'installDependencies'])

        wizard.navigate('forward')
        expect(wizard.step).to.eq('createConfig')
        expect(wizard.history).to.eqls(['welcome', 'selectFramework', 'installDependencies', 'createConfig'])

        wizard.navigate('forward')
        expect(wizard.step).to.eq('setupComplete')
        expect(wizard.history).to.eqls(['welcome', 'selectFramework', 'installDependencies', 'createConfig', 'setupComplete'])

        // cannot go forward again
        wizard.navigate('forward')
        expect(wizard.step).to.eq('setupComplete')
        expect(wizard.history).to.eqls(['welcome', 'selectFramework', 'installDependencies', 'createConfig', 'setupComplete'])

        wizard.navigate('back')
        expect(wizard.step).to.eq('createConfig')
        expect(wizard.history).to.eqls(['welcome', 'selectFramework', 'installDependencies', 'createConfig'])
      })
    })
  })
})
