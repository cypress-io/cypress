// This code is meant to be executed within Vite
// which supports environment variables being injected into the client at build time

export const GRAPHQL_PORT = import.meta.env.VITE_CYPRESS_INTERNAL_GQL_PORT || `${51259}`

export const GRAPHQL_URL = `http://localhost:${GRAPHQL_PORT}/graphql`
