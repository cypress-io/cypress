import { expect } from 'chai'
import { scaffoldMigrationProject as scaffoldProject } from '../helper'
import { ProjectConfigIpc } from '../../../src/data/ProjectConfigIpc'

describe('ProjectConfigIpc', () => {
  let projectConfigIpc

  beforeEach(async () => {
    const projectPath = await scaffoldProject('e2e')

    projectConfigIpc = new ProjectConfigIpc(
      undefined,
      projectPath,
      'cypress.config.js',
      false,
      (error) => {},
      () => {},
    )
  })

  afterEach(() => {
    projectConfigIpc.cleanupIpc()
  })

  context('#eventProcessPid', () => {
    it('returns id for child process', () => {
      const expectedId = projectConfigIpc._childProcess.pid

      expect(projectConfigIpc.childProcessPid).to.eq(expectedId)
    })
  })
})
