import globby from 'globby'
import type { TestingType } from '@packages/types'
import {
  FilePart,
  formatMigrationFile,
  getFolder,
  getTestFilesGlobs,
  isDefaultTestFiles,
  OldCypressConfig,
  OLD_NAMES,
  specRegexps,
} from '.'
import type { MigrationFile } from '../MigrationDataSource'
import Debug from 'debug'

const debug = Debug('cypress:data-context:sources:migration:autoRename')

export interface MigrationSpec {
  relative: string
  usesDefaultFolder: boolean
  usesDefaultTestFiles: boolean
  testingType: TestingType
}

export function substitute (part: FilePart): FilePart {
  // nothing to substitute, just a regular
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
    regexp = new RegExp(specRegexps.e2e.before.defaultFolderDefaultTestFiles)
  } else if (spec.testingType === 'e2e' && !spec.usesDefaultFolder && spec.usesDefaultTestFiles) {
    // e2e, custom-folder, **/* (default testFiles)
    regexp = new RegExp(specRegexps.e2e.before.customFolderDefaultTestFiles)
  } else if (spec.testingType === 'e2e' && spec.usesDefaultFolder && !spec.usesDefaultTestFiles) {
    // e2e, cypress/integration , **/*.spec.ts (custom testFiles)
    regexp = new RegExp(specRegexps.e2e.before.defaultFolderCustomTestFiles)
  } else if (spec.testingType === 'component' && spec.usesDefaultFolder && spec.usesDefaultTestFiles) {
    // component, cypress/component , (default testFiles)
    regexp = new RegExp(specRegexps.component.before.defaultFolderDefaultTestFiles)
  } else if (spec.testingType === 'component' && !spec.usesDefaultFolder && spec.usesDefaultTestFiles) {
    // component, cypress/custom-component , (default testFiles)
    regexp = new RegExp(specRegexps.component.before.customFolderDefaultTestFiles)
  } else {
    // custom folder AND test files pattern
    // should be impossible, we should not call this function in the first place.
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

export async function getSpecs (projectRoot: string, config: OldCypressConfig, testingType: TestingType): Promise<MigrationSpec[]> {
  debug('getSpecs', { projectRoot, config, testingType })
  const oldTestingTypeName = OLD_NAMES[testingType]
  const oldDefaultFolderName = `cypress/${oldTestingTypeName}`

  const folder = getFolder(config, testingType)
  const testFiles = getTestFilesGlobs(config, oldTestingTypeName)

  let specFiles: MigrationSpec[] = []

  debug('getSpecs', { folder, testFiles })

  const globs = folder === false
    ? []
    : folder === 'cypress/integration'
      ? ['**/*'].map((glob) => `${folder}/${glob}`)
      : testFiles.map((glob) => `${folder}/${glob}`)

  let specs = folder === false
    ? []
    : (await globby(globs, { onlyFiles: true, cwd: projectRoot }))

  const fullyCustom = folder !== oldDefaultFolderName && !isDefaultTestFiles(config, oldTestingTypeName)

  debug('getSpecs', { specs, fullyCustom })

  // we cannot do a migration if either integrationFolder is false,
  // or if both the integrationFolder and testFiles are custom.
  if (specs.length === 0 || fullyCustom) {
    debug('getSpecs: no spec found, or custom folder')
    specFiles = []
  } else {
    specFiles = specs.map((relative) => {
      debug('getSpecs: relative', relative)

      return {
        relative,
        usesDefaultFolder: folder === oldDefaultFolderName,
        usesDefaultTestFiles: isDefaultTestFiles(config, oldTestingTypeName),
        testingType,
      }
    })
  }

  debug('getSpecs', { specFiles })

  return specFiles
}
