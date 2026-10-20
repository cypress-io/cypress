import { GraphQLError } from 'graphql'
import type { ASTVisitor, ValidationContext } from 'graphql'

/**
 * The mutations the runner app and the `cypress tap` CLI send. The runner server
 * is reachable from the page under test, so it only accepts these; desktop
 * controls the runner never uses, such as switching projects or opening a
 * directory in the IDE, stay on the Launchpad server.
 */
export const RUNNER_MUTATIONS: ReadonlySet<string> = new Set([
  'clearAutoProvisionedProjectId',
  'clearCurrentProject',
  'cloudProjectCreate',
  'cloudProjectRequestAccess',
  'copyTextToClipboard',
  'determineCohort',
  'e2eExamples',
  'generateSpecFromSource',
  'getReactComponentsFromFile',
  'initializeCtFrameworks',
  'launchOpenProject',
  'launchpadSetBrowser',
  'loadRemoteFetchables',
  'login',
  'logout',
  'matchesSpecPattern',
  'moveToRelevantRun',
  'openExternal',
  'openFileInIDE',
  'recordEvent',
  'refetchRemote',
  'refreshCloudViewer',
  'resetAuthState',
  'resetErrorAndLoadConfig',
  'retryStudio',
  'runSpec',
  'setPreferences',
  'setProjectIdInConfigFile',
  'setPromptShown',
  'setRunAllSpecs',
  'setTestsForRun',
  'showDebugForCloudRun',
  'showSystemNotification',
  'signup',
  'switchTestingTypeAndRelaunch',
  'testsForRun',
])

export function runnerMutationRule (context: ValidationContext): ASTVisitor {
  return {
    Field (node) {
      const fieldName = node.name.value

      if (context.getParentType() !== context.getSchema().getMutationType() || fieldName.startsWith('__') || RUNNER_MUTATIONS.has(fieldName)) {
        return
      }

      context.reportError(new GraphQLError(`The "${fieldName}" mutation is not available from the test runner.`, node))
    },
  }
}
