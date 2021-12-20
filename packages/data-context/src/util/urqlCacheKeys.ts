import type { CacheExchangeOpts } from '@urql/exchange-graphcache'

/**
 * These are located in data-context, because we use them in the
 * both the server-side and client-side urql, since we cache & hydrate
 * the page on load
 *
 * We want to to keep the key definitions in sync between the
 * server & client so we only define them once
 */
export const urqlCacheKeys: Partial<CacheExchangeOpts> = {
  keys: {
    App: (data) => data.__typename,
    DevState: (data) => data.__typename,
    Wizard: (data) => data.__typename,
    CloudRunCommitInfo: () => null,
    GitInfo: () => null,
    BaseError: () => null,
    ProjectPreferences: (data) => data.__typename,
    VersionData: () => null,
    LocalSettings: (data) => data.__typename,
    LocalSettingsPreferences: () => null,
  },
}
