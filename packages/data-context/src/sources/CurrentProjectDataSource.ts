import type { DataContext } from '..'
import { matchedSpecs } from './ProjectDataSource'

/**
 * The "current project"
 */
export class CurrentProjectDataSource {
  constructor (
    private ctx: DataContext,
    readonly projectRoot: string,
  ) {}

  async findSpecs (
    testingType: Cypress.TestingType,
    specPattern: string[],
    excludeSpecPattern: string[],
    globToRemove: string[],
  ): Promise<FoundSpec[]> {
    const specAbsolutePaths = await this.ctx.file.getFilesByGlob(
      this.projectRoot,
      specPattern, {
        absolute: true,
        ignore: [...excludeSpecPattern, ...globToRemove],
      },
    )

    const matched = matchedSpecs({
      projectRoot: this.projectRoot,
      testingType,
      specAbsolutePaths,
      specPattern,
    })

    return matched
  }
}
