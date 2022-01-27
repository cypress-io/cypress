import { scaffoldMigrationProject } from '../../helper'
import path from 'path'
import fs from 'fs-extra'
import {
  getStepsForMigration,
  shouldShowAutoRenameStep,
  Step,
} from '../../../../src/sources/migration/shouldShowSteps'
import { expect } from 'chai'

describe('shouldShowAutoRenameStep', () => {
  it('false when integrationFolder and testFiles are custom', async () => {
    const cwd = scaffoldMigrationProject('migration-e2e-fully-custom')
    const config = fs.readJsonSync(path.join(cwd, 'cypress.json'))
    const actual = await shouldShowAutoRenameStep(cwd, config)

    expect(actual).to.be.false
  })

  it('true when integrationFolder custom and testFiles default', async () => {
    const cwd = scaffoldMigrationProject('migration-e2e-custom-integration')
    const config = fs.readJsonSync(path.join(cwd, 'cypress.json'))
    const actual = await shouldShowAutoRenameStep(cwd, config)

    expect(actual).to.be.true
  })

  it('true when integrationFolder default and testFiles custom', async () => {
    const cwd = scaffoldMigrationProject('migration-e2e-custom-test-files')
    const config = fs.readJsonSync(path.join(cwd, 'cypress.json'))
    const actual = await shouldShowAutoRenameStep(cwd, config)

    expect(actual).to.be.true
  })

  it('true when integrationFolder and testFiles default and spec exists', async () => {
    const cwd = scaffoldMigrationProject('migration-e2e-defaults')
    const config = fs.readJsonSync(path.join(cwd, 'cypress.json'))
    const actual = await shouldShowAutoRenameStep(cwd, config)

    expect(actual).to.be.true
  })

  it('false when integrationFolder and testFiles default by no spec to migrate', async () => {
    const cwd = scaffoldMigrationProject('migration-e2e-defaults-no-specs')
    const config = fs.readJsonSync(path.join(cwd, 'cypress.json'))
    const actual = await shouldShowAutoRenameStep(cwd, config)

    expect(actual).to.be.false
  })
})

describe('getStepsForMigration', () => {
  it('only returns configFile step for highly custom project', async () => {
    const cwd = scaffoldMigrationProject('migration-e2e-fully-custom')
    const config = fs.readJsonSync(path.join(cwd, 'cypress.json'))

    const actual = await getStepsForMigration(cwd, config)
    const expected: Step[] = ['configFile']

    expect(actual).to.eql(expected)
  })

  it('returns all e2e steps for project with all defaults', async () => {
    const cwd = scaffoldMigrationProject('migration-e2e-defaults')
    const config = fs.readJsonSync(path.join(cwd, 'cypress.json'))

    const actual = await getStepsForMigration(cwd, config)
    const expected: Step[] = ['renameAuto', 'renameSupport', 'configFile']

    expect(actual).to.eql(expected)
  })

  it('returns all e2e steps for project with all defaults + custom testFiles', async () => {
    const cwd = scaffoldMigrationProject('migration-e2e-custom-test-files')
    const config = fs.readJsonSync(path.join(cwd, 'cypress.json'))

    const actual = await getStepsForMigration(cwd, config)
    const expected: Step[] = ['renameAuto', 'renameSupport', 'configFile']

    expect(actual).to.eql(expected)
  })

  it('skips renameAuto for customized integrationFolder+tesFiles, but returns all steps', async () => {
    const cwd = scaffoldMigrationProject('migration')
    const config = fs.readJsonSync(path.join(cwd, 'cypress.json'))

    const actual = await getStepsForMigration(cwd, config)
    const expected: Step[] = ['renameManual', 'renameSupport', 'configFile', 'setupComponent']

    expect(actual).to.eql(expected)
  })

  it('returns component steps for component testing project (no e2e)', async () => {
    const cwd = scaffoldMigrationProject('migration-component-testing')
    const config = fs.readJsonSync(path.join(cwd, 'cypress.json'))

    const actual = await getStepsForMigration(cwd, config)
    const expected: Step[] = ['renameManual', 'configFile', 'setupComponent']

    expect(actual).to.eql(expected)
  })
})
