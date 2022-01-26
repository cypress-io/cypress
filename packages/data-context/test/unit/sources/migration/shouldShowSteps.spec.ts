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
    const actual = shouldShowAutoRenameStep(config)

    expect(actual).to.be.false
  })

  it('true when integrationFolder custom and testFiles default', async () => {
    const cwd = scaffoldMigrationProject('migration-e2e-custom-integration')
    const config = fs.readJsonSync(path.join(cwd, 'cypress.json'))
    const actual = shouldShowAutoRenameStep(config)

    expect(actual).to.be.true
  })

  it('true when integrationFolder default and testFiles custom', async () => {
    const cwd = scaffoldMigrationProject('migration-e2e-custom-test-files')
    const config = fs.readJsonSync(path.join(cwd, 'cypress.json'))
    const actual = shouldShowAutoRenameStep(config)

    expect(actual).to.be.true
  })

  it('true when integrationFolder and testFiles default', async () => {
    const cwd = scaffoldMigrationProject('migration-e2e-defaults')
    const config = fs.readJsonSync(path.join(cwd, 'cypress.json'))
    const actual = shouldShowAutoRenameStep(config)

    expect(actual).to.be.true
  })
})

describe('getStepsForMigration', () => {
  it('only returns configFile step for highly custom project', async () => {
    const cwd = scaffoldMigrationProject('migration-e2e-fully-custom')
    const config = fs.readJsonSync(path.join(cwd, 'cypress.json'))

    const actual = getStepsForMigration(config)
    const expected: Step[] = ['configFile']

    expect(actual).to.eql(expected)
  })

  it('returns all e2e steps for project with all defaults', async () => {
    const cwd = scaffoldMigrationProject('migration-e2e-defaults')
    const config = fs.readJsonSync(path.join(cwd, 'cypress.json'))

    const actual = getStepsForMigration(config)
    const expected: Step[] = ['renameAuto', 'renameSupport', 'configFile']

    expect(actual).to.eql(expected)
  })

  it('returns all e2e steps for project with all defaults + custom testFiles', async () => {
    const cwd = scaffoldMigrationProject('migration-e2e-custom-test-files')
    const config = fs.readJsonSync(path.join(cwd, 'cypress.json'))

    const actual = getStepsForMigration(config)
    const expected: Step[] = ['renameAuto', 'renameSupport', 'configFile']

    expect(actual).to.eql(expected)
  })

  it('returns all steps for project with e2e and component set up', async () => {
    const cwd = scaffoldMigrationProject('migration')
    const config = fs.readJsonSync(path.join(cwd, 'cypress.json'))

    const actual = getStepsForMigration(config)
    const expected: Step[] = ['renameAuto', 'renameManual', 'renameSupport', 'configFile', 'setupComponent']

    expect(actual).to.eql(expected)
  })
})
