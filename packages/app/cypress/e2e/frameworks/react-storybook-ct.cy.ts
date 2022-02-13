import type { SinonStub } from 'sinon'

describe('react-storybook-ct', () => {
  it('visits the launchpad, going through the setup & scaffolding correct dependencies', () => {
    cy.preserveProjectDirectoriesBetweenTests()
    cy.scaffoldProject('react-with-storybook')
    cy.scaffoldProjectNodeModules('react-with-storybook')
    cy.openProject('react-with-storybook')
    cy.visitLaunchpad()
    cy.tabUntil((el) => el.text().includes('Component Testing'))
    cy.focused().click()
    cy.findByRole('button', { name: 'Next Step' }).click()
    cy.withCtx((ctx, o) => {
      o.sinon.stub(ctx.actions.electron, 'copyToClipboard')
    })

    cy.findByRole('button', { name: 'Copy' }).click()
    cy.withRetryableCtx((ctx) => {
      expect(ctx.actions.electron.copyToClipboard).to.have.been.called

      return (ctx.actions.electron.copyToClipboard as SinonStub).lastCall.lastArg
    }).then((val) => {
      const toInstall = val.split('-D')[1].split(' ').filter((f) => f) as string[]

      expect(toInstall.length).to.eq(3)

      expect(val).to.include('storybook')

      cy.log('... install node modules, this might take a bit ...')
      cy.installNodeModulesInProject({
        projectName: 'react-with-storybook',
        toInstall,
        target: 'devDependencies',
      })

      cy.findByRole('button', { name: 'Continue' }).click()
      cy.findByRole('button', { name: 'Continue' }).click()
      cy.findByRole('button', { name: 'Start Component Testing in Chrome', timeout: 20 * 1000 })
    })
  })

  it('visits the app, creating & executing a story created from the app', { retries: 0 }, () => {
    cy.openProject('react-with-storybook')
    cy.startAppServer('component')
    cy.visitApp()
    cy.contains('Create from story').click()
    cy.contains('MyCoolComponent.stories.js').click()
    cy.contains('Okay, run the spec').click()
    cy.get('.passed > .num').should('contain.text', '1')
  })
})
