import { GraphQLError } from 'graphql'
import type { ASTVisitor, GraphQLObjectType, ValidationContext, ValidationRule } from 'graphql'

type OperationKind = 'query' | 'mutation' | 'subscription'

/**
 * Root fields a client may select, per operation type. An omitted operation
 * type is unrestricted.
 */
type AllowedRootFields = Partial<Record<OperationKind, ReadonlySet<string>>>

function allowRootFields (allowed: AllowedRootFields, client: string): ValidationRule {
  return (context: ValidationContext): ASTVisitor => {
    const schema = context.getSchema()
    const rootTypes: [OperationKind, GraphQLObjectType | null | undefined][] = [
      ['query', schema.getQueryType()],
      ['mutation', schema.getMutationType()],
      ['subscription', schema.getSubscriptionType()],
    ]

    return {
      Field (node) {
        const fieldName = node.name.value
        const kind = rootTypes.find(([, type]) => type && type === context.getParentType())?.[0]
        const allowedFields = kind && allowed[kind]

        if (!allowedFields || fieldName.startsWith('__') || allowedFields.has(fieldName)) {
          return
        }

        context.reportError(new GraphQLError(`The "${fieldName}" ${kind} is not available from ${client}.`, node))
      },
    }
  }
}

/**
 * The mutations the runner app sends. The runner server is reachable from the
 * page under test, so it only accepts these; desktop controls the runner never
 * uses, such as switching projects or opening a directory in the IDE, stay on
 * the Launchpad server.
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

export const runnerMutationRule = allowRootFields({ mutation: RUNNER_MUTATIONS }, 'the test runner')

/**
 * The root query fields the `cypress tap` CLI selects.
 */
export const TAP_QUERIES: ReadonlySet<string> = new Set([
  'currentProject',
])

/**
 * The mutations the `cypress tap` CLI sends.
 */
export const TAP_MUTATIONS: ReadonlySet<string> = new Set([
  'runSpec',
])

export const tapOperationRule = allowRootFields({ query: TAP_QUERIES, mutation: TAP_MUTATIONS, subscription: new Set() }, '`cypress tap`')
