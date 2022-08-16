import { stubWizard } from './stubgql-Wizard'
import type { MaybeResolver } from './clientTestUtils'
import { stubMutation } from './stubgql-Mutation'
import { stubQuery } from './stubgql-Query'
import { stubGlobalProject, stubProject } from './stubgql-Project'
import { CloudOrganizationStubs, CloudProjectStubs, CloudRecordKeyStubs, CloudRunStubs, CloudUserStubs } from '@packages/graphql/test/stubCloudTypes'
import { stubMigration } from './stubgql-Migration'
import type { CodegenTypeMap } from '../generated/test-graphql-types.gen'
import { StubErrorWrapper } from './stubgql-ErrorWrapper'

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
  CloudProjectSpecResult: CloudProjectStubs.specResult,
  CloudRun: CloudRunStubs.allPassing,
  CloudRecordKey: CloudRecordKeyStubs.componentProject,
  CloudUser: CloudUserStubs.me,
  ErrorWrapper: StubErrorWrapper,
} as const

// For Type checking
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _x: Partial<MaybeResolveMap> = GQLStubRegistry
