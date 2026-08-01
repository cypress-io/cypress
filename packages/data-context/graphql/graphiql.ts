/**
 * Renders the GraphiQL IDE that is served in development at the GraphQL
 * endpoint. `express-graphql` used to bundle GraphiQL for us; `graphql-http`
 * intentionally ships no IDE, so we serve the standard GraphiQL bootstrap (the
 * same CDN-backed mechanism as `ruru`) to keep the internal "GraphiQL"
 * developer-tools menu item working.
 *
 * @param endpoint The URL GraphiQL should send operations to (the same route it is served from).
 */
export function renderGraphiQL (endpoint: string): string {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <title>GraphiQL</title>
    <style>
      body { height: 100%; margin: 0; width: 100%; overflow: hidden; }
      #graphiql { height: 100vh; }
    </style>
    <link rel="stylesheet" href="https://unpkg.com/graphiql/graphiql.min.css" />
  </head>
  <body>
    <div id="graphiql">Loading GraphiQL&hellip;</div>
    <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <script crossorigin src="https://unpkg.com/graphiql/graphiql.min.js"></script>
    <script>
      const root = ReactDOM.createRoot(document.getElementById('graphiql'))
      const fetcher = GraphiQL.createFetcher({ url: ${JSON.stringify(endpoint)} })

      root.render(React.createElement(GraphiQL, { fetcher }))
    </script>
  </body>
</html>`
}
