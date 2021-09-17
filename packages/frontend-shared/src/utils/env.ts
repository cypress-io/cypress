// This code is meant to be executed within Vite
// which supports environment variables being injected into the client at build time

// Unsure how to get import.meta.env working
// https://vitejs.dev/guide/env-and-mode.html#intellisense
export const GRAPHQL_PORT = import.meta.env.VITE_CYPRESS_INTERNAL_GQL_PORT || `${51259}`

export const GRAPHQL_URL = `http://localhost:${GRAPHQL_PORT}/graphql`
