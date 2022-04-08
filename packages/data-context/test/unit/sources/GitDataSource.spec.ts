import { expect } from 'chai'
import path from 'path'
import os from 'os'
import simpleGit from 'simple-git'
import fs from 'fs-extra'
import sinon from 'sinon'

import { createTestDataContext, scaffoldMigrationProject } from '../helper'
import { GitDataSource } from '../../../src/sources/GitDataSource'

describe('GitDataSource', () => {
  it(`gets correct status for files on ${os.platform()}`, async () => {
    const ctx = createTestDataContext()
    const projectPath = await scaffoldMigrationProject('e2e')
    const onBranchChange = sinon.stub()
    const onGitInfoChange = sinon.stub()
    const onError = sinon.stub()

    ctx.coreData.currentProject = projectPath
    const gitInfo = ctx.coreData.currentProjectGitInfo = new GitDataSource({
      projectRoot: projectPath,
      onBranchChange,
      onGitInfoChange,
      onError,
    })

    const e2eFolder = path.join(projectPath, 'cypress', 'e2e')
    const allSpecs = fs.readdirSync(e2eFolder)

    const git = simpleGit({ baseDir: projectPath })

    if (process.env.CI) {
      // need to set a user on CI
      await Promise.all([
        git.addConfig('user.name', 'Test User', true, 'global'),
        git.addConfig('user.email', 'test-user@example.com', true, 'global'),
      ])
    }

    await git.init()
    await git.add(allSpecs.map((spec) => path.join(e2eFolder, spec)))
    await git.commit('add all specs')

    // create a file and modify a file to express all
    // git states we are interested in (created, unmodified, modified)
    const fooSpec = path.join(e2eFolder, 'foo.cy.js')
    const aRecordSpec = path.join(e2eFolder, 'a_record.spec.js')
    const xhrSpec = path.join(e2eFolder, 'xhr.cy.js')

    fs.createFileSync(fooSpec)
    fs.writeFileSync(xhrSpec, 'it(\'modifies the file\', () => {})')

    process.chdir(projectPath)

    const [created, unmodified, modified] = await Promise.all([
      gitInfo.gitInfoFor(fooSpec),
      gitInfo.gitInfoFor(aRecordSpec),
      gitInfo.gitInfoFor(xhrSpec),
    ])

    expect(created.lastModifiedHumanReadable).to.match(/(a few|[0-9]) seconds? ago/)
    expect(created.statusType).to.eql('created')
    // do not want to set this explicitly in the test, since it can mess up your local git instance
    expect(created.author).not.to.be.undefined
    expect(created.lastModifiedTimestamp).not.to.be.undefined

    expect(unmodified.lastModifiedHumanReadable).to.match(/(a few|[0-9]) seconds? ago/)
    expect(unmodified.statusType).to.eql('unmodified')
    // do not want to set this explicitly in the test, since it can mess up your local git instance
    expect(unmodified.author).not.to.be.undefined
    expect(unmodified.lastModifiedTimestamp).not.to.be.undefined

    expect(modified.lastModifiedHumanReadable).to.match(/(a few|[0-9]) seconds? ago/)
    expect(modified.statusType).to.eql('modified')
    // do not want to set this explicitly in the test, since it can mess up your local git instance
    expect(modified.author).not.to.be.undefined
    expect(modified.lastModifiedTimestamp).not.to.be.undefined
  })
})
