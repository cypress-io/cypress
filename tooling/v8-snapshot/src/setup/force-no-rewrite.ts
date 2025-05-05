/**
 * These modules are force no rewritten because they are rewritten in a way that
 * breaks the snapshot but is not detected automatically by the snapshot builder.
 * When run through the snapshot generator, these strings
 * will be compared to the file's path and if they match, the given
 * file will be marked as force no rewritten. If we want to match the full path, we
 * should include the full relative path with respect to the project base (e.g.
 * packages/https-proxy/lib/ca.js). For files where we want to match multiple hoisted
 * locations, we should specify the dependency starting with `* /` (e.g.
 * `* /node_modules/signal-exit/index.js`)
 */
export default [
  // recursion due to process.emit overwrites which is incorrectly rewritten
  '*/node_modules/signal-exit/index.js',
  // wx is rewritten to __get_wx__ but not available for Node.js > 0.6
  '*/node_modules/lockfile/lockfile.js',
  // rewrites dns.lookup which conflicts with our rewrite
  '*/node_modules/evil-dns/evil-dns.js',
  // `address instanceof (__get_URL2__())` -- right hand side not an object
  // even though function is in scope
  '*/node_modules/ws/lib/websocket.js',
  // defers PassThroughStream which is then not accepted as a constructor
  '*/node_modules/get-stream/buffer-stream.js',
  // deferring should be fine as it just reexports `process` which in the
  // case of cache is the stub
  '*/node_modules/process-nextick-args/index.js',
  // Has issues depending on the architecture due to how it handles errors
  '*/node_modules/@cypress/get-windows-proxy/src/registry.js',
  // results in recursive call to __get_fs2__
  'packages/https-proxy/lib/ca.js',
  // TODO: Figure out why these don't properly get flagged as norewrite: https://github.com/cypress-io/cypress/issues/23986
  '*/node_modules/@cspotcode/source-map-support/source-map-support.js',
  'packages/server/lib/modes/run.ts',
  '*/node_modules/debug/src/node.js',
  '*/node_modules/minimatch/minimatch.js',
  '*/node_modules/js-yaml/lib/js-yaml/type/js/function.js',
  'packages/server/lib/open_project.ts',
  'packages/server/lib/project-base.ts',
  'packages/server/lib/socket-ct.ts',
  'packages/server/lib/browsers/utils.ts',
  'packages/server/lib/cloud/exception.ts',
  'packages/server/lib/errors.ts',
  'packages/server/lib/util/process_profiler.ts',
  '*/node_modules/prettier/index.js',
  '*/node_modules/prettier/parser-babel.js',
  '*/node_modules/prettier/parser-espree.js',
  '*/node_modules/prettier/parser-flow.js',
  '*/node_modules/prettier/parser-meriyah.js',
  '*/node_modules/prettier/parser-typescript.js',
  '*/node_modules/prettier/third-party.js',
  '*/node_modules/ci-info/index.js',
  '*/node_modules/@babel/traverse/lib/index.js',
  '*/node_modules/@babel/types/lib/definitions/index.js',
  '*/node_modules/axios/lib/adapters/http.js',
]
