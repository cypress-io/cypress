import { defaultSpecPattern } from '@packages/config'
import type { TestingType, FoundSpec } from '@packages/types'
import Debug from 'debug'
import _ from 'lodash'
import path from 'path'
import { getPathFromSpecPattern, getLongestCommonPrefixFromPaths } from '../ProjectDataSource'

export const isDefaultSupportFile = (supportFile: string) => {
  if (_.isNil(supportFile) || !_.isBoolean(supportFile) && supportFile.match(/(^|\.+\/)cypress\/support($|\/index($|\.(ts|js|coffee)$))/)) {
    return true
  }

  return false
}

export type FileExtension = 'js' | 'ts' | 'jsx' | 'tsx'

export async function getDefaultSpecFileName (
  { currentProject, testingType, fileExtensionToUse, specPattern, specs = [], name }:
  { currentProject: string | null, testingType: TestingType | null, fileExtensionToUse: FileExtension, specPattern: string[], specs?: FoundSpec[], name?: string },
): Promise<string> {
  const debug = Debug('cypress:data-context:sources:migration:utils')

  const defaultFilename = `${name ? name : testingType === 'e2e' ? 'spec' : 'ComponentName'}.cy.${fileExtensionToUse}`
  const defaultPathname = path.join('cypress', testingType ?? 'e2e', defaultFilename)

  if (!currentProject || !testingType) {
    debug('currentProject or testingType undefined. Error intelligently detecting default filename, using safe default %o', defaultPathname)

    return defaultPathname
  }

  try {
    let specPatternSet: string | undefined

    if (Array.isArray(specPattern)) {
      specPatternSet = specPattern[0]
    }

    // 1. If there is no spec pattern, use the default for this testing type.
    if (!specPatternSet) {
      return defaultPathname
    }

    // 2. If the spec pattern is the default spec pattern, return the default for this testing type.
    if (specPatternSet === defaultSpecPattern[testingType]) {
      return defaultPathname
    }

    const pathFromSpecPattern = getPathFromSpecPattern({ specPattern: specPatternSet, testingType, fileExtensionToUse, name })
    const filename = pathFromSpecPattern ? path.basename(pathFromSpecPattern) : defaultFilename

    // 3. If there are existing specs, return the longest common path prefix between them, if it is non-empty.
    const commonPrefixFromSpecs = getLongestCommonPrefixFromPaths(specs.map((spec) => spec.relative))

    if (commonPrefixFromSpecs) return path.join(commonPrefixFromSpecs, filename)

    // 4. Otherwise, return a path that fulfills the spec pattern.
    if (pathFromSpecPattern) return pathFromSpecPattern

    // 5. Return the default for this testing type if we cannot decide from the spec pattern.
    return defaultPathname
  } catch (err) {
    debug('Error intelligently detecting default filename, using safe default %o', err)

    return defaultPathname
  }
}
