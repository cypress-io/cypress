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
  CloudProjectSpec,
  CloudRunStatus,
  CloudSpecRun,
} from '../src/gen/test-cloud-graphql-types.gen'
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
  const cloudRecordKey: Required<CloudRecordKey> = {
    ...testNodeId('CloudRecordKey'),
    createdAt: new Date('1995-12-17T03:20:00').toISOString(),
    lastUsedAt: new Date('1995-12-17T03:22:00').toISOString(),
    key: fakeUuid(getNodeIdx('CloudRecordKey')),
    ...config,
  }

  return indexNode(cloudRecordKey)
}

const STATUS_ARRAY: CloudRunStatus[] = ['CANCELLED', 'ERRORED', 'FAILED', 'NOTESTS', 'OVERLIMIT', 'PASSED', 'RUNNING', 'TIMEDOUT']

export function createCloudProject (config: Partial<ConfigFor<CloudProject>>) {
  const cloudProject = {
    ...testNodeId('CloudProject'),
    recordKeys: [CloudRecordKeyStubs.componentProject],
    latestRun: CloudRunStubs.running,
    runs (args: CloudProjectRunsArgs) {
      if (args.before) {
        return {
          pageInfo: {
            hasNextPage: true,
            hasPreviousPage: false,
          },
          nodes: [
            createCloudRun({ status: 'RUNNING' }),
            createCloudRun({ status: 'RUNNING' }),
          ],
        }
      }

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

export function createCloudUser (config: ConfigFor<CloudUser>): Required<CloudUser> {
  const cloudUser: Required<CloudUser> = {
    ...testNodeId('CloudUser'),
    email: 'test@example.com',
    fullName: 'Test User',
    cloudProfileUrl: 'http://dummy.cypress.io/profile',
    cloudOrganizationsUrl: 'http://dummy.cypress.io/organizations',
    createCloudOrganizationUrl: 'http://dummy.cypress.io/organizations/create',
    organizations: {
      __typename: 'CloudOrganizationConnection',
      nodes: [createCloudOrganization({})],
      edges: [{
        __typename: 'CloudOrganizationEdge',
        cursor: 'cursor',
        node: createCloudOrganization({}),
      }],
      pageInfo: {
        __typename: 'PageInfo',
        hasNextPage: false,
        hasPreviousPage: false,
      },
    },
    ...config,
  }

  return indexNode(cloudUser)
}

export function createCloudRun (config: Partial<CloudRun>): Required<CloudRun> {
  const cloudRunData: Required<CloudRun> = {
    ...testNodeId('CloudRun'),
    status: 'PASSED',
    runNumber: 432,
    totalFailed: 0,
    totalSkipped: 0,
    totalPending: 0,
    totalRunning: 0,
    totalTests: 10,
    totalPassed: 10,
    totalDuration: 1000 * 60,
    totalFlakyTests: 0,
    tags: [],
    url: 'http://dummy.cypress.io/runs/1',
    createdAt: new Date(Date.now() - 1000 * 60 * 61).toISOString(),
    completedAt: null,
    commitInfo: createCloudRunCommitInfo({
      sha: `fake-sha-${getNodeIdx('CloudRun')}`,
      summary: `fix: make gql work ${config.status ?? 'PASSED'}`,
    }),
    ...config,
  }

  return indexNode(cloudRunData)
}

export function createCloudOrganization (config: Partial<CloudOrganization>): Required<CloudOrganization> {
  const cloudOrgData: Required<CloudOrganization> = {
    ...testNodeId('CloudOrganization'),
    name: `Cypress Test Account ${getNodeIdx('CloudOrganization')}`,
    projects: {
      __typename: 'CloudProjectConnection' as const,
      pageInfo: {} as any,
      edges: [] as any,
      nodes: [] as CloudProject[],
    },
    ...config,
  }

  return indexNode(cloudOrgData)
}

export function createCloudProjectSpecResult (config: Partial<CloudProjectSpec>): Required<CloudProjectSpec> {
  const specResult: Required<CloudProjectSpec> = {
    ...testNodeId('CloudProjectSpec'),
    averageDuration: 1234,
    isConsideredFlaky: false,
    retrievedAt: new Date().toISOString(),
    specPath: '/test.cy.ts',
    specRuns: {
      __typename: 'CloudSpecRunConnection' as const,
      pageInfo: {} as any,
      edges: [] as any,
      nodes: [] as CloudSpecRun[],
    },
    flakyStatus: {
      __typename: 'CloudProjectSpecFlakyStatus',
      severity: 'NONE',
    },
    ...config,
  }

  return indexNode(specResult)
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
  somePending: createCloudRun({ status: 'PASSED', totalPassed: 100, totalSkipped: 3000, totalPending: 20 }),
  allSkipped: createCloudRun({ status: 'ERRORED', totalPassed: 0, totalSkipped: 10 }),
} as Record<string, Required<CloudRun>>

export const CloudUserStubs = {
  me: createCloudUser({ userIsViewer: true }),
  // meAsAdmin: createCloudUser({ userIsViewer: true }), TODO(tim): add when we have roles
} as Record<string, Required<CloudUser>>

export const CloudOrganizationStubs = {
  cyOrg: createCloudOrganization({}),
} as Record<string, Required<CloudOrganization>>

export const CloudOrganizationConnectionStubs = {
  __typename: 'CloudOrganizationConnection' as const,
  nodes: [
    // Created out of alphabetical order to verify that components visually sort them by name
    createCloudOrganization({
      id: '2',
      name: 'Test Org 2',
    }),
    createCloudOrganization({
      id: '1',
      name: 'Test Org 1',
      projects: {
        __typename: 'CloudProjectConnection' as const,
        edges: [] as any,
        pageInfo: {} as any,
        nodes: [
          createCloudProject({
            name: 'Test Project 2',
            slug: 'test-project-2',
          }),
          createCloudProject({
            name: 'Test Project 1',
            slug: 'test-project',
          }),
        ],
      },
    }),
    // Organization with single project for auto select test
    createCloudOrganization({
      id: '3',
      name: 'Test Org 3',
      projects: {
        __typename: 'CloudProjectConnection' as const,
        edges: [] as any,
        pageInfo: {} as any,
        nodes: [
          createCloudProject({
            name: 'Test Project 3',
            slug: 'test-project-3',
          }),
        ],
      },
    }),
  ],
}

export const CloudProjectStubs = {
  e2eProject: createCloudProject({
    slug: 'efgh',
    name: 'e2e-project',
    cloudProjectSettingsUrl: 'http:/test.cloud/e2e/settings',
    cloudProjectUrl: 'http:/test.cloud/e2e/settings',
  }),
  componentProject: createCloudProject({
    slug: 'abcd',
    name: 'component-project',
    cloudProjectSettingsUrl: 'http:/test.cloud/component/settings',
    cloudProjectUrl: 'http:/test.cloud/component/settings',
  }),
  specResult: createCloudProjectSpecResult({}),
} as const

interface CloudTypesContext {
  __server__?: NexusGen['context']
}

 type MaybeResolver<T> = {
   [K in keyof T]: K extends 'id' | '__typename' ? T[K] : T[K] | ((args: any, ctx: CloudTypesContext, info: GraphQLResolveInfo) => MaybeResolver<T[K]>)
 }

export const CloudQuery: MaybeResolver<Query> = {
  __typename: 'Query',
  cloudNode (args: QueryCloudNodeArgs) {
    return nodeRegistry[args.id] ?? null
  },
  cloudProjectBySlug (args: QueryCloudProjectBySlugArgs) {
    return projectsBySlug[args.slug] ?? createCloudProject({
      slug: args.slug,
      name: `cloud-project-${args.slug}`,
      cloudProjectSettingsUrl: 'http:/test.cloud/cloud-project/settings',
      cloudProjectUrl: 'http:/test.cloud/cloud-project/settings',
    })
  },
  cloudProjectsBySlugs (args: QueryCloudProjectsBySlugsArgs) {
    return args.slugs.map((s) => {
      return projectsBySlug[s] ?? createCloudProject({
        slug: s,
        name: `cloud-project-${s}`,
        cloudProjectSettingsUrl: 'http:/test.cloud/cloud-project/settings',
        cloudProjectUrl: 'http:/test.cloud/cloud-project/settings',
      })
    })
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
  cloudNodesByIds ({ ids }) {
    return ids.map((id) => nodeRegistry[id] ?? null)
  },
  cloudSpecByPath ({ path }) {
    return createCloudProjectSpecResult({
      specPath: path,
    })
  },
}
