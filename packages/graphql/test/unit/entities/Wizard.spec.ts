import { expect } from 'chai'
import { Project, Wizard } from '../../../src'
import { TestActions, TestContext } from '../../integration/utils'

const createActionsWithResolvedConfig = () => {
  const Ctor = class Actions extends TestActions {
    isFirstTime (projectRoot: string, testingType: Cypress.TestingType) {
      return true
    }
  }

  return Ctor
}

describe('Wizard', () => {
  describe('#navigate', () => {
    context('chosenTestingType is component, component testing is not configured', () => {
      it('progresses through wizard steps', () => {
        const Actions = createActionsWithResolvedConfig()
        const ctx = new TestContext({ Actions })
        const project = new Project('/', ctx)

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
        expect(wizard.step).to.eq('initializePlugins')
        expect(wizard.history).to.eqls(['welcome', 'selectFramework', 'installDependencies', 'createConfig', 'initializePlugins'])

        // plugins are not initialized, so cannot move forward
        wizard.navigate('forward')
        expect(wizard.step).to.eq('initializePlugins')

        // simulate plugins having initialized
        ctx.activeProject.setCtPluginsInitialized(true)

        wizard.navigate('forward')
        expect(wizard.step).to.eq('setupComplete')
        expect(wizard.history).to.eqls(['welcome', 'selectFramework', 'installDependencies', 'createConfig', 'initializePlugins', 'setupComplete'])

        // cannot go forward again
        wizard.navigate('forward')
        expect(wizard.step).to.eq('setupComplete')
        expect(wizard.history).to.eqls(['welcome', 'selectFramework', 'installDependencies', 'createConfig', 'initializePlugins', 'setupComplete'])

        wizard.navigate('back')
        expect(wizard.step).to.eq('initializePlugins')
        expect(wizard.history).to.eqls(['welcome', 'selectFramework', 'installDependencies', 'createConfig', 'initializePlugins'])
      })
    })
  })
})
