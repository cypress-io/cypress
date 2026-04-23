/**
 * @graphql-codegen/typescript-urql-graphcache@2 still emits an import from
 * `@urql/exchange-graphcache/dist/types/ast`, which does not exist on graphcache v9.
 * Rewrite to the public CacheExchangeOpts schema type until the codegen plugin is upgraded.
 */
const fs = require('fs')
const path = require('path')

const file = path.join(__dirname, '../src/gen/graphcache-config.gen.ts')
let contents = fs.readFileSync(file, 'utf8')
const oldHeader = `import type { Resolver as GraphCacheResolver, UpdateResolver as GraphCacheUpdateResolver, OptimisticMutationResolver as GraphCacheOptimisticMutationResolver, StorageAdapter as GraphCacheStorageAdapter } from '@urql/exchange-graphcache';
import type { IntrospectionData } from '@urql/exchange-graphcache/dist/types/ast';`
const newHeader = `import type { CacheExchangeOpts, Resolver as GraphCacheResolver, UpdateResolver as GraphCacheUpdateResolver, OptimisticMutationResolver as GraphCacheOptimisticMutationResolver, StorageAdapter as GraphCacheStorageAdapter } from '@urql/exchange-graphcache';
type IntrospectionData = NonNullable<CacheExchangeOpts['schema']>;`

if (contents.includes(oldHeader)) {
  contents = contents.replace(oldHeader, newHeader)
  fs.writeFileSync(file, contents)
}
