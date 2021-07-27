process.env.CYPRESS_INTERNAL_ENV = 'development'
process.env.GRAPHQL_CODEGEN = 'true'
require('@packages/ts/register')
require('../../server/lib/graphql/schema')
