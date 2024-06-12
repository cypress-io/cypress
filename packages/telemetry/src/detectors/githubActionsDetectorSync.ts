import type { DetectorSync, ResourceAttributes, IResource } from '@opentelemetry/resources'
import { Resource } from '@opentelemetry/resources'

/**
 * GithubActionsDetectorSync can be used to detect the presence of and create a Resource
 * from github actions env variables.
 */
class GithubActionsDetectorSync implements DetectorSync {
  /**
   * Returns a {@link Resource} populated with attributes from the
   * circle ci environment variable.
   *
   * @param config The resource detection config -- ignored
   */
  detect (): IResource {
    const attributes: ResourceAttributes = {}

    const { GITHUB_ACTION, GH_BRANCH, GITHUB_HEAD_REF, GITHUB_REF_NAME, GITHUB_SHA, GITHUB_RUN_NUMBER } = process.env

    if (GITHUB_ACTION) {
      attributes['ci.github_action'] = GITHUB_ACTION
      attributes['ci.build-number'] = GITHUB_RUN_NUMBER
      attributes['ci.branch'] = GH_BRANCH || GITHUB_HEAD_REF || GITHUB_REF_NAME
      attributes['SHA1'] = GITHUB_SHA
    }

    return new Resource(attributes)
  }
}

export const githubActionsDetectorSync = new GithubActionsDetectorSync()
