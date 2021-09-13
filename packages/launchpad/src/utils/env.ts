export const GRAPHQL_PORT = import.meta.env.VITE_CYPRESS_INTERNAL_GQL_PORT || 51259

export const GRAPHQL_URL = `http://localhost:${GRAPHQL_PORT}/graphql`
