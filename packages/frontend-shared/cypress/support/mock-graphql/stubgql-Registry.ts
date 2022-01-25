import { stubWizard } from './stubgql-Wizard'
import type { MaybeResolver } from './clientTestUtils'
import { stubMutation } from './stubgql-Mutation'
import { stubQuery } from './stubgql-Query'
import { stubGlobalProject, stubProject } from './stubgql-Project'
import { CloudOrganizationStubs, CloudProjectStubs, CloudRecordKeyStubs, CloudRunStubs, CloudUserStubs } from './stubgql-CloudTypes'
import { stubMigration } from './stubgql-Migration'
import type { CodegenTypeMap } from '../generated/test-graphql-types.gen'

type MaybeResolveMap = {[K in keyof CodegenTypeMap]: MaybeResolver<CodegenTypeMap[K]>}

export const GQLStubRegistry = {
  Wizard: stubWizard,
  ProjectLike: stubProject,
  GlobalProject: stubGlobalProject,
  CurrentProject: stubProject,
  Migration: stubMigration,
  Mutation: stubMutation,
  Query: stubQuery,
  CloudOrganization: CloudOrganizationStubs.cyOrg,
  CloudProject: CloudProjectStubs.componentProject,
  CloudRun: CloudRunStubs.allPassing,
  CloudRecordKey: CloudRecordKeyStubs.componentProject,
  CloudUser: CloudUserStubs.me,
} as const

// Line below added so we can refer to the above as a const value, but ensure it fits the type contract
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _typeCheck: Partial<MaybeResolveMap> = GQLStubRegistry
