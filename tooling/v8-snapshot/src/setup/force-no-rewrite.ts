/**
 * These modules are force no rewritten because they are rewritten in a way that
 * breaks the snapshot. For files in the project, we should include the start
 * of the path (e.g. packages/https-proxy/lib/ca.js). For files in node_modules,
 * we should include the start of the path (e.g. force-no-rewrite/index.js) so
 * that dependencies that are hoisted in other node_modules directories are also
 * not rewritten.
 */
export default [
  // recursion due to process.emit overwrites which is incorrectly rewritten
  'signal-exit/index.js',
  // recursion due to process.{chdir,cwd} overwrites which are incorrectly rewritten
  'graceful-fs/polyfills.js',
  // wx is rewritten to __get_wx__ but not available for Node.js > 0.6
  'lockfile/lockfile.js',
  // rewrites dns.lookup which conflicts with our rewrite
  'evil-dns/evil-dns.js',
  // `address instanceof (__get_URL2__())` -- right hand side not an object
  // even though function is in scope
  'ws/lib/websocket.js',
  // defers PassThroughStream which is then not accepted as a constructor
  'get-stream/buffer-stream.js',
  // deferring should be fine as it just reexports `process` which in the
  // case of cache is the stub
  'process-nextick-args/index.js',
  // Has issues depending on the architecture due to how it handles errors
  '@cypress/get-windows-proxy/src/registry.js',
  // results in recursive call to __get_fs2__
  'packages/https-proxy/lib/ca.js',
  // TODO: Figure out why these don't properly get flagged as norewrite: https://github.com/cypress-io/cypress/issues/23986
  '@cspotcode/source-map-support/source-map-support.js',
  'packages/server/lib/modes/record.ts',
  'packages/server/lib/modes/run.ts',
  'debug/src/node.js',
  'minimatch/minimatch.js',
  'packages/server/lib/open_project.ts',
  'packages/server/lib/project-base.ts',
  'packages/server/lib/socket-ct.ts',
  'packages/server/lib/browsers/utils.ts',
  'packages/server/lib/cloud/exception.ts',
  'packages/server/lib/errors.ts',
  'packages/server/lib/util/process_profiler.ts',
  'prettier/index.js',
  'prettier/parser-babel.js',
  'prettier/parser-espree.js',
  'prettier/parser-flow.js',
  'prettier/parser-meriyah.js',
  'prettier/parser-typescript.js',
  'prettier/third-party.js',
  'ci-info/index.js',
  '@babel/traverse/lib/index.js',
  '@babel/types/lib/definitions/index.js',
  'axios/lib/adapters/http.js',
]
