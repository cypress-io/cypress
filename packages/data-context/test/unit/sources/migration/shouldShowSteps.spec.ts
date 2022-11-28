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
  it('true when testFiles is custom, but default integration folder', async () => {
    const cwd = await scaffoldMigrationProject('migration')
    const config = fs.readJsonSync(path.join(cwd, 'cypress.json'))
    const actual = await shouldShowAutoRenameStep(cwd, config)

    expect(actual).to.be.true
  })

  it('true when testFiles is custom, but default integration folder', async () => {
    const cwd = await scaffoldMigrationProject('migration-e2e-component-default-test-files')
    const config = fs.readJsonSync(path.join(cwd, 'cypress.json'))
    const actual = await shouldShowAutoRenameStep(cwd, config)

    expect(actual).to.be.true
  })

  it('false when integrationFolder and testFiles are custom', async () => {
    const cwd = await scaffoldMigrationProject('migration-e2e-fully-custom')
    const config = fs.readJsonSync(path.join(cwd, 'cypress.json'))
    const actual = await shouldShowAutoRenameStep(cwd, config)

    expect(actual).to.be.false
  })

  it('true when integrationFolder custom and testFiles default', async () => {
    const cwd = await scaffoldMigrationProject('migration-e2e-custom-integration')
    const config = fs.readJsonSync(path.join(cwd, 'cypress.json'))
    const actual = await shouldShowAutoRenameStep(cwd, config)

    expect(actual).to.be.true
  })

  it('true when integrationFolder default and testFiles custom', async () => {
    const cwd = await scaffoldMigrationProject('migration-e2e-custom-test-files')
    const config = fs.readJsonSync(path.join(cwd, 'cypress.json'))
    const actual = await shouldShowAutoRenameStep(cwd, config)

    expect(actual).to.be.true
  })

  it('true when integrationFolder and testFiles default and spec exists', async () => {
    const cwd = await scaffoldMigrationProject('migration-e2e-defaults')
    const config = fs.readJsonSync(path.join(cwd, 'cypress.json'))
    const actual = await shouldShowAutoRenameStep(cwd, config)

    expect(actual).to.be.true
  })

  it('false when integrationFolder and testFiles default by no spec to migrate', async () => {
    const cwd = await scaffoldMigrationProject('migration-e2e-defaults-no-specs')
    const config = fs.readJsonSync(path.join(cwd, 'cypress.json'))
    const actual = await shouldShowAutoRenameStep(cwd, config)

    expect(actual).to.be.false
  })
})

describe('getStepsForMigration', () => {
  it('only returns configFile step for highly custom project', async () => {
    const cwd = await scaffoldMigrationProject('migration-e2e-fully-custom')
    const config = fs.readJsonSync(path.join(cwd, 'cypress.json'))

    const actual = await getStepsForMigration(cwd, config, true)
    const expected: Step[] = ['configFile']

    expect(actual).to.eql(expected)
  })

  it('returns all e2e steps for project with all defaults', async () => {
    const cwd = await scaffoldMigrationProject('migration-e2e-defaults')
    const config = fs.readJsonSync(path.join(cwd, 'cypress.json'))

    const actual = await getStepsForMigration(cwd, config, true)
    const expected: Step[] = ['renameAuto', 'renameSupport', 'configFile']

    expect(actual).to.eql(expected)
  })

  it('returns all e2e steps for project with all defaults + custom testFiles', async () => {
    const cwd = await scaffoldMigrationProject('migration-e2e-custom-test-files')
    const config = fs.readJsonSync(path.join(cwd, 'cypress.json'))

    const actual = await getStepsForMigration(cwd, config, true)
    const expected: Step[] = ['renameAuto', 'renameSupport', 'configFile']

    expect(actual).to.eql(expected)
  })

  it('returns all steps for default integrationFolder, custom testFiles', async () => {
    const cwd = await scaffoldMigrationProject('migration')
    const config = fs.readJsonSync(path.join(cwd, 'cypress.json'))

    const actual = await getStepsForMigration(cwd, config, true)
    const expected: Step[] = ['renameAuto', 'renameSupport', 'configFile', 'setupComponent']

    expect(actual).to.eql(expected)
  })

  it('returns all steps except supportFile for default CT project', async () => {
    const cwd = await scaffoldMigrationProject('migration-component-testing-defaults')
    const config = fs.readJsonSync(path.join(cwd, 'cypress.json'))

    const actual = await getStepsForMigration(cwd, config, true)
    const expected: Step[] = ['renameAuto', 'renameManual', 'configFile', 'setupComponent']

    expect(actual).to.eql(expected)
  })

  it('returns component steps for component testing project (no e2e)', async () => {
    const cwd = await scaffoldMigrationProject('migration-component-testing-customized')
    const config = fs.readJsonSync(path.join(cwd, 'cypress.json'))

    const actual = await getStepsForMigration(cwd, config, true)
    const expected: Step[] = ['configFile', 'setupComponent']

    expect(actual).to.eql(expected)
  })
})
