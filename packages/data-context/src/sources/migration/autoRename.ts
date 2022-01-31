import { FilePart, formatMigrationFile, OldCypressConfig } from '../../util'
import globby from 'globby'
import {
  getComponentFolder,
  getComponentTestFiles,
  getIntegrationFolder,
  getIntegrationTestFiles,
  isDefaultTestFiles,
} from '.'
import { regexps } from './regexps'
import type { MigrationFile } from '../MigrationDataSource'
import path from 'path'
import type { TestingType } from '@packages/types'

export interface MigrationSpec {
  relative: string
  usesDefaultFolder: boolean
  usesDefaultTestFiles: boolean
  testingType: TestingType
}

interface GetSpecs {
  component: MigrationSpec[]
  integration: MigrationSpec[]
}

export function substitute (part: FilePart): FilePart {
  // nothing to substitite, just a regular
  // part of the file
  if (!('group' in part)) {
    return part
  }

  // cypress/integration -> cypress/e2e
  if (part.group === 'folder' && part.text === 'integration') {
    return { ...part, text: 'e2e' }
  }

  // basic.spec.js -> basic.cy.js
  if (part.group === 'extension') {
    return { ...part, text: '.cy.' }
  }

  // support/index.js -> support/e2e.js
  if (part.group === 'name' && part.text === 'index') {
    return { ...part, text: 'e2e' }
  }

  return part
}

export function applyMigrationTransform (
  spec: MigrationSpec,
): MigrationFile {
  let regexp: RegExp

  if (spec.testingType === 'e2e' && spec.usesDefaultFolder && spec.usesDefaultTestFiles) {
    // e2e, cypress/integration, **/* (default testFiles)
    regexp = new RegExp(regexps.e2e.before.defaultFolderDefaultTestFiles)
  } else if (spec.testingType === 'e2e' && !spec.usesDefaultFolder && spec.usesDefaultTestFiles) {
    // e2e, custom-folder, **/* (default testFiles)
    regexp = new RegExp(regexps.e2e.before.customFolderDefaultTestFiles)
  } else if (spec.testingType === 'e2e' && spec.usesDefaultFolder && !spec.usesDefaultTestFiles) {
    // e2e, cypress/integration , **/*.spec.ts (custom testFiles)
    regexp = new RegExp(regexps.e2e.before.defaultFolderCustomTestFiles)
  } else if (spec.testingType === 'component' && spec.usesDefaultFolder && spec.usesDefaultTestFiles) {
    // component, cypress/component , (default testFiles)
    regexp = new RegExp(regexps.component.before.defaultFolderDefaultTestFiles)
  } else if (spec.testingType === 'component' && !spec.usesDefaultFolder && spec.usesDefaultTestFiles) {
    // component, cypress/custom-component , (default testFiles)
    regexp = new RegExp(regexps.component.before.customFolderDefaultTestFiles)
  } else {
    // custom folder AND test files pattern
    // should be impossble, we should not calling this function in the first place.
    throw Error(`Cannot use applyMigrationTransform on a project with a custom folder and custom testFiles.`)
  }

  const partsBefore = formatMigrationFile(spec.relative, regexp)
  const partsAfter = partsBefore.map(substitute)

  return {
    testingType: spec.testingType,
    before: {
      relative: spec.relative,
      parts: partsBefore,
    },
    after: {
      relative: partsAfter.map((x) => x.text).join(''),
      parts: partsAfter,
    },
  }
}

export async function getSpecs (projectRoot: string, config: OldCypressConfig): Promise<GetSpecs> {
  const integrationFolder = getIntegrationFolder(config)
  const integrationTestFiles = getIntegrationTestFiles(config)

  const componentFolder = getComponentFolder(config)
  const componentTestFiles = getComponentTestFiles(config)

  let integrationSpecs: MigrationSpec[]
  let componentSpecs: MigrationSpec[]

  if (integrationFolder === false) {
    integrationSpecs = []
  } else if (
    // don't care about the testFiles pattern, just get
    // everything in the default integration folder
    integrationFolder === 'cypress/integration' &&
    !isDefaultTestFiles(config, 'integration')
  ) {
    integrationSpecs = (await globby(integrationFolder, {
      onlyFiles: true,
      cwd: projectRoot,
    })).map((relative) => {
      return {
        relative,
        usesDefaultFolder: true,
        usesDefaultTestFiles: false,
        testingType: 'e2e',
      }
    })
  } else {
    // don't care about the testFiles pattern, just get
    // everything in the default integration folder
    const globs = integrationTestFiles.map((glob) => {
      return path.join(integrationFolder, glob)
    })

    integrationSpecs = (await globby(globs, {
      onlyFiles: true,
      cwd: projectRoot,
    })).map((relative) => {
      return {
        relative,
        usesDefaultFolder: integrationFolder === 'cypress/integration',
        usesDefaultTestFiles: isDefaultTestFiles(config, 'integration'),
        testingType: 'e2e',
      }
    })
  }

  if (componentFolder === false) {
    componentSpecs = []
  } else {
    const globs = componentTestFiles.map((glob) => {
      return path.join(componentFolder, glob)
    })

    componentSpecs = (await globby(globs, { onlyFiles: true, cwd: projectRoot })).map((relative) => {
      return {
        relative,
        usesDefaultFolder: componentFolder === 'cypress/component',
        usesDefaultTestFiles: isDefaultTestFiles(config, 'component'),
        testingType: 'component',
      }
    })
  }

  return {
    component: componentSpecs,
    integration: integrationSpecs,
  }
}
