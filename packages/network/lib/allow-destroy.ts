import net from 'net'

/**
 * `allowDestroy` adds a `destroy` method to a `net.Server`. `destroy(cb)`
 * will kill all open connections and call `cb` when the server is closed.
 *
 * Note: `server-destroy` NPM package cannot be used - it does not track
 * `secureConnection` events.
 */
export function allowDestroy (server: net.Server) {
  let connections: net.Socket[] = []

  function trackConn (conn) {
    connections.push(conn)

    conn.on('close', () => {
      connections = connections.filter((connection) => connection !== conn)
    })
  }

  server.on('connection', trackConn)
  server.on('secureConnection', trackConn)

  // @ts-ignore Property 'destroy' does not exist on type 'Server'.
  server.destroy = function (cb) {
    server.close(cb)
    connections.map((connection) => connection.destroy())
  }

  return server
}
