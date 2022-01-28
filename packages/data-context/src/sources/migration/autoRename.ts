import { FilePart, formatMigrationFile, OldCypressConfig } from '../../util'
import globby from 'globby'
import {
  getComponentFolder,
  getComponentTestFiles,
  getIntegrationFolder,
  getIntegrationTestFiles,
  isDefaultTestFiles,
} from '.'
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

const specExtRe = '[._-]?[s|S]pec.|[.])(?=[j|t]s[x]?'

export const regexps = {
  e2e: {
    before: {
      defaultFolderDefaultTestFiles: `cypress\/(?<main>integration)\/.*?(?<ext>${specExtRe})`,
      defaultFolderCustomTestFiles: /cypress\/(?<main>integration)\/.*/,
      customFolderDefaultTestFiles: `.*?(?<ext>${specExtRe})`,
    },
  },
  component: {
    before: {
      defaultFolderDefaultTestFiles: `cypress\/component\/.*?(?<ext>${specExtRe})`,
    },
  },
} as const

function substitute (part: FilePart): FilePart {
  if (part.group === 'folder' && part.text === 'integration') {
    return { ...part, text: 'e2e' }
  }

  if (part.group === 'extension') {
    return { ...part, text: '.cy.' }
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

  if (integrationFolder === false || !isDefaultTestFiles(config, 'integration')) {
    integrationSpecs = []
  } else {
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

  if (componentFolder === false || !isDefaultTestFiles(config, 'component')) {
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
