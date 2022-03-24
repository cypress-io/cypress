import { expect } from 'chai'
import path from 'path'
import os from 'os'
import simpleGit from 'simple-git'
import fs from 'fs-extra'
import { createTestDataContext, scaffoldMigrationProject } from '../helper'

describe('GitDataSource', () => {
  it(`gets correct status for files on ${os.platform()}`, async () => {
    const ctx = createTestDataContext()
    const projectPath = await scaffoldMigrationProject('e2e')

    ctx.coreData.currentProject = projectPath

    const e2eFolder = path.join(projectPath, 'cypress', 'e2e')
    const allSpecs = fs.readdirSync(e2eFolder)

    const git = simpleGit({ baseDir: projectPath })

    await git.addConfig('user.name', 'Test User', false, 'global')
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
      ctx.git.gitInfo(fooSpec),
      ctx.git.gitInfo(aRecordSpec),
      ctx.git.gitInfo(xhrSpec),
    ])

    expect(created.lastModifiedHumanReadable).to.match(/(a few|0) seconds ago/)
    expect(created.statusType).to.eql('created')
    expect(created.author).to.eql('Test User')
    expect(created.lastModifiedTimestamp).not.to.be.undefined

    expect(unmodified.lastModifiedHumanReadable).to.match(/(a few|0) seconds ago/)
    expect(unmodified.statusType).to.eql('unmodified')
    expect(unmodified.author).to.eql('Test User')
    expect(unmodified.lastModifiedTimestamp).not.to.be.undefined

    expect(modified.lastModifiedHumanReadable).to.match(/(a few|0) seconds ago/)
    expect(modified.statusType).to.eql('modified')
    expect(modified.author).to.eql('Test User')
    expect(modified.lastModifiedTimestamp).not.to.be.undefined
  })
})
