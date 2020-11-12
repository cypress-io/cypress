"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * `allowDestroy` adds a `destroy` method to a `net.Server`. `destroy(cb)`
 * will kill all open connections and call `cb` when the server is closed.
 *
 * Note: `server-destroy` NPM package cannot be used - it does not track
 * `secureConnection` events.
 */
function allowDestroy(server) {
    var connections = [];
    function trackConn(conn) {
        connections.push(conn);
        conn.on('close', function () {
            connections = connections.filter(function (connection) { return connection !== conn; });
        });
    }
    server.on('connection', trackConn);
    server.on('secureConnection', trackConn);
    // @ts-ignore Property 'destroy' does not exist on type 'Server'.
    server.destroy = function (cb) {
        server.close(cb);
        connections.map(function (connection) { return connection.destroy(); });
    };
    return server;
}
exports.allowDestroy = allowDestroy;
