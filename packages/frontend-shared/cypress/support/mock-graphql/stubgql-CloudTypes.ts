/* eslint-disable no-console */
/**
 * Takes all of the "Cloud" types and creates realistic mocks,
 * indexing the types in a way that we can access them
 */
import _ from 'lodash'
import fakeUuid from 'fake-uuid'
import { connectionFromArray } from 'graphql-relay'

import type {
  Node,
  CloudUser,
  CloudRun,
  CloudOrganization,
  CloudRecordKey,
  CloudRunCommitInfo,
  CodegenTypeMap,
  CloudProject,
  Query,
  QueryCloudNodeArgs,
  QueryCloudProjectBySlugArgs,
  QueryCloudProjectsBySlugsArgs,
  CloudProjectRunsArgs,
  CloudRunStatus,
} from '../generated/test-cloud-graphql-types.gen'
import type { GraphQLResolveInfo } from 'graphql'

type ConfigFor<T> = Omit<T, 'id' | '__typename'>

export type CloudTypesWithId = {
  [K in keyof CodegenTypeMap]: 'id' extends keyof CodegenTypeMap[K] ? K : never
}[keyof CodegenTypeMap]

let nodeIdx: Partial<Record<CloudTypesWithId, number>> = {}

function getNodeIdx (type: CloudTypesWithId): number {
  return nodeIdx[type] ?? 0
}
const btoa = typeof window !== 'undefined' ? window.btoa : (val: string) => Buffer.from(val).toString('base64')

function testNodeId <T extends CloudTypesWithId> (type: T) {
  nodeIdx[type] = (nodeIdx[type] ?? 0) + 1

  return {
    __typename: type,
    id: btoa(`${type}:${nodeIdx[type]}`),
  } as const
}

const nodeRegistry: Record<string, Node> = {}
const projectsBySlug: Record<string, CloudProject> = {}

function indexNode<T extends Node> (node: T & {__typename: CloudTypesWithId}): T {
  nodeRegistry[node.id] = node
  if (node.__typename === 'CloudProject') {
    // @ts-expect-error
    projectsBySlug[node.slug] = node
  }

  return node
}

export function createCloudRunCommitInfo (config: ConfigFor<CloudRunCommitInfo>): CloudRunCommitInfo {
  const cloudRunCommitInfo: CloudRunCommitInfo = {
    __typename: 'CloudRunCommitInfo',
    sha: `d333752a1f168ccd92df2740fd640714067d243a`,
    summary: 'calculate multi-byte panel',
    branch: 'main',
    branchUrl: 'https://',
    authorName: 'John Appleseed',
    authorEmail: 'none@cypress.io',
    ...config,
  }

  return cloudRunCommitInfo
}

export function createCloudRecordKey (config: ConfigFor<CloudRecordKey>) {
  const cloudRecordKey: CloudRecordKey = {
    ...testNodeId('CloudRecordKey'),
    key: fakeUuid(getNodeIdx('CloudRecordKey')),
    ...config,
  }

  return indexNode(cloudRecordKey)
}

const STATUS_ARRAY: CloudRunStatus[] = ['CANCELLED', 'ERRORED', 'FAILED', 'NOTESTS', 'OVERLIMIT', 'PASSED', 'RUNNING', 'TIMEDOUT']

export function createCloudProject (config: ConfigFor<CloudProject>) {
  const cloudProject = {
    ...testNodeId('CloudProject'),
    recordKeys: [CloudRecordKeyStubs.componentProject],
    latestRun: CloudRunStubs.running,
    runs (args: CloudProjectRunsArgs) {
      const twentyRuns = _.times(20, (i) => {
        const statusIndex = i % STATUS_ARRAY.length
        const status = STATUS_ARRAY[statusIndex]

        return createCloudRun({
          status,
          totalPassed: i,
          url: `http://dummy.cypress.io/runs/${i}`,
          commitInfo: createCloudRunCommitInfo({
            sha: `fake-sha-${getNodeIdx('CloudRun')}`,
            summary: `fix: make gql work ${status}`,
          }),
        })
      })

      const connectionData = connectionFromArray(twentyRuns, args)

      return {
        ...connectionData,
        nodes: connectionData.edges.map((e) => e.node),
      }
    },
    ...config,
  } as CloudProject

  return indexNode(cloudProject)
}

export function createCloudUser (config: ConfigFor<CloudUser>): CloudUser {
  const cloudUser: CloudUser = {
    ...testNodeId('CloudUser'),
    email: 'test@example.com',
    fullName: 'Test User',
    ...config,
  }

  return indexNode(cloudUser)
}

export function createCloudRun (config: Partial<CloudRun>): CloudRun {
  const cloudRunData: CloudRun = {
    ...testNodeId('CloudRun'),
    status: 'PASSED',
    totalFailed: 0,
    totalSkipped: 0,
    totalPending: 0,
    totalRunning: 0,
    totalTests: 10,
    totalPassed: 10,
    ...config,
    createdAt: new Date().toISOString(),
  }

  return indexNode(cloudRunData)
}

export function createCloudOrganization (config: Partial<CloudOrganization>): CloudOrganization {
  const cloudOrgData: CloudOrganization = {
    ...testNodeId('CloudOrganization'),
    name: `Cypress Test Account ${getNodeIdx('CloudOrganization')}`,
    ...config,
  }

  return indexNode(cloudOrgData)
}

export const CloudRecordKeyStubs = {
  e2eProject: createCloudRecordKey({}),
  componentProject: createCloudRecordKey({}),
} as const

export const CloudRunCommitInfoStubs = {
  commit: createCloudRunCommitInfo({}),
} as const

export const CloudRunStubs = {
  allPassing: createCloudRun({ status: 'PASSED', commitInfo: CloudRunCommitInfoStubs.commit }),
  failing: createCloudRun({ status: 'FAILED', totalPassed: 8, totalFailed: 2 }),
  running: createCloudRun({ status: 'RUNNING', totalRunning: 2, totalPassed: 8 }),
  someSkipped: createCloudRun({ status: 'PASSED', totalPassed: 7, totalSkipped: 3 }),
  allSkipped: createCloudRun({ status: 'ERRORED', totalPassed: 0, totalSkipped: 10 }),
} as const

export const CloudUserStubs = {
  me: createCloudUser({ userIsViewer: true }),
  // meAsAdmin: createCloudUser({ userIsViewer: true }), TODO(tim): add when we have roles
} as const

export const CloudOrganizationStubs = {
  cyOrg: createCloudOrganization({}),
} as const

export const CloudProjectStubs = {
  e2eProject: createCloudProject({ slug: 'efgh', name: 'e2e-project' }),
  componentProject: createCloudProject({ slug: 'abcd', name: 'component-project' }),
} as const

interface CloudTypesContext {
  __server__?: NexusGen['context']
}

type MaybeResolver<T> = {
  [K in keyof T]: K extends 'id' | '__typename' ? T[K] : T[K] | ((args: any, ctx: CloudTypesContext, info: GraphQLResolveInfo) => MaybeResolver<T[K]>)
}

export const CloudRunQuery: MaybeResolver<Query> = {
  __typename: 'Query',
  cloudNode (args: QueryCloudNodeArgs) {
    return nodeRegistry[args.id] ?? null
  },
  cloudProjectBySlug (args: QueryCloudProjectBySlugArgs) {
    return CloudProjectStubs.componentProject
  },
  cloudProjectsBySlugs (args: QueryCloudProjectsBySlugsArgs) {
    return args.slugs.map((s) => projectsBySlug[s] ?? createCloudProject({ slug: s, name: `cloud-project-${s}` }))
  },
  cloudViewer (args, ctx) {
    if (ctx.__server__) {
      return ctx.__server__.user ? {
        ...CloudUserStubs.me,
        email: ctx.__server__.user.email,
        fullName: ctx.__server__.user.name,
      } : null
    }

    return CloudUserStubs.me
  },
}
