import type { TestingType } from '@packages/types'

/**
 * Manages the "config" of the Cypress project.
 *
 * This is meant to be fully self-contained, torn down when the
 * testing type is changed, and
 */
export class ProjectConfigManager {
  constructor (
    private projectConfigPath: string,
    private currentTestingType: TestingType,
  ) {}

  private loadEnvFile () {
    //
  }

  private sourceConfig () {
    //
  }

  private setupEventsIpc () {
    //
  }
}
