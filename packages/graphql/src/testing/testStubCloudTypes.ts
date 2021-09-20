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
} from '../gen/cloud-source-types.gen'
import { base64Encode } from '../util/relayConnectionUtils'
import type { NxsCtx } from 'nexus-decorators'
import type { GraphQLResolveInfo } from 'graphql'

type ConfigFor<T> = Omit<T, 'id' | '__typename'>

export type CloudTypesWithId = {
  [K in keyof CodegenTypeMap]: 'id' extends keyof CodegenTypeMap[K] ? K : never
}[keyof CodegenTypeMap]

let nodeIdx: Partial<Record<CloudTypesWithId, number>> = {}

function getNodeIdx (type: CloudTypesWithId): number {
  return nodeIdx[type] ?? 0
}

function testNodeId <T extends CloudTypesWithId> (type: T) {
  nodeIdx[type] = (nodeIdx[type] ?? 0) + 1

  return {
    __typename: type,
    id: base64Encode(`${type}:${nodeIdx[type]}`),
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

export function createCloudProject (config: ConfigFor<CloudProject>) {
  const cloudProject = {
    ...testNodeId('CloudProject'),
    recordKeys: [CloudRecordKeyStubs.componentProject],
    latestRun: CloudRunStubs.running,
    runs (args: CloudProjectRunsArgs) {
      const twentyRuns = _.times(20, (i) => {
        return createCloudRun({
          status: 'PASSED',
          totalPassed: i,
          commitInfo: createCloudRunCommitInfo({ sha: `fake-sha-${getNodeIdx('CloudRun')}` }),
        })
      })

      return {
        ...connectionFromArray(twentyRuns, args),
        nodes: twentyRuns,
      }
    },
    ...config,
  } as CloudProject

  return indexNode(cloudProject)
}

export function createCloudUser (config: ConfigFor<CloudUser>): CloudUser {
  const cloudUser: CloudUser = {
    ...testNodeId('CloudUser'),
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
  e2eProject: createCloudProject({ slug: 'efgh' }),
  componentProject: createCloudProject({ slug: 'abcd' }),
} as const

type MaybeResolver<T> = {
  [K in keyof T]: K extends 'id' | '__typename' ? T[K] : T[K] | ((args: any, ctx: NxsCtx, info: GraphQLResolveInfo) => MaybeResolver<T[K]>)
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
    return args.slugs.map((s) => projectsBySlug[s] ?? null)
  },
  cloudViewer (args, ctx) {
    return CloudUserStubs.me
  },
}
