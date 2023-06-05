import type { CacheExchangeOpts } from '@urql/exchange-graphcache'
import { relayPagination } from '@urql/exchange-graphcache/extras'

import type { GraphCacheConfig } from '../gen/graphcache-config.gen'

/**
 * Create a new type that overrides the keys, instead of using GraphCacheConfig
 * directly; if we try to use it, creates a TS error on the cacheExchange
 * related with "Types of property 'updates' are incompatible.""
 */
type UrqlCacheKeys = Omit<CacheExchangeOpts, 'keys'> & { keys: GraphCacheConfig['keys'] }

/**
 * These are located in data-context, because we use them in the
 * both the server-side and client-side urql, since we cache & hydrate
 * the page on load
 *
 * We want to to keep the key definitions in sync between the
 * server & client so we only define them once
 */
export const urqlCacheKeys: Partial<UrqlCacheKeys> = {
  keys: {
    DevState: (data) => data.__typename,
    Wizard: (data) => data.__typename,
    Migration: (data) => data.__typename,
    CloudRunCommitInfo: () => null,
    GitInfo: () => null,
    MigrationFile: () => null,
    MigrationFilePart: () => null,
    CodeFrame: () => null,
    ProjectPreferences: (data) => data.__typename,
    VersionData: () => null,
    ScaffoldedFile: () => null,
    SpecDataAggregate: () => null,
    LocalSettings: (data) => data.__typename,
    LocalSettingsPreferences: () => null,
    AuthState: () => null,
    CloudProjectNotFound: (data) => data.__typename,
    CloudProjectSpecNotFound: (data) => null,
    CloudProjectUnauthorized: (data) => data.__typename,
    CloudLatestRunUpdateSpecData: (data) => null,
    CloudProjectSpecFlakyStatus: (data) => null,
    CloudPollingIntervals: (data) => null,
    GeneratedSpecError: () => null,
    GenerateSpecResponse: (data) => data.__typename,
    CloudFeatureNotEnabled: () => null,
    UsageLimitExceeded: () => null,
  },
  resolvers: {
    CloudProject: {
      runs: relayPagination({ mergeMode: 'outwards' }),
    },
  },
}
