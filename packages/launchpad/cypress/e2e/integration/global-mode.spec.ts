import defaultMessages from '@packages/frontend-shared/src/locales/en-US.json'
import path from 'path'

const scaffoldProject = (projectName) => {
  cy.task('scaffoldProject', projectName).then((projectPath) => {
    cy.withCtx(async (ctx, o) => {
      ctx.actions.project.addProject({ path: o.projectPath as string, open: false })
    }, { projectPath })
  })
}

describe('Launchpad: Global Mode', () => {
  beforeEach(() => {
    cy.setupE2E()
  })

  describe('when no projects', () => {
  })

  describe("when projects have been added", () => {
  })
})