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
  'node_modules/@cypress/get-windows-proxy/src/registry.js',

  // results in recursive call to __get_fs2__
  'packages/https-proxy/lib/ca.js',

  // TODO: Figure out why these don't properly get flagged as norewrite: https://github.com/cypress-io/cypress/issues/23986
  'node_modules/@cspotcode/source-map-support/source-map-support.js',
  'packages/server/lib/modes/record.js',
  'packages/server/lib/modes/run.ts',
  'node_modules/debug/src/node.js',
  'node_modules/body-parser/node_modules/debug/src/node.js',
  'node_modules/compression/node_modules/debug/src/node.js',
  'node_modules/express/node_modules/debug/src/node.js',
  'node_modules/finalhandler/node_modules/debug/src/node.js',
  'node_modules/get-package-info/node_modules/debug/src/node.js',
  'node_modules/mocha-junit-reporter/node_modules/debug/src/node.js',
  'node_modules/mocha/node_modules/debug/src/node.js',
  'node_modules/morgan/node_modules/debug/src/node.js',
  'node_modules/send/node_modules/debug/src/node.js',
  'node_modules/stream-parser/node_modules/debug/src/node.js',
  'node_modules/@cypress/commit-info/node_modules/debug/src/node.js',
  'node_modules/@cypress/get-windows-proxy/node_modules/debug/src/node.js',
  'node_modules/mocha-7.0.1/node_modules/debug/src/node.js',
  'node_modules/tcp-port-used/node_modules/debug/src/node.js',
  'packages/data-context/node_modules/debug/src/node.js',
  'packages/graphql/node_modules/debug/src/node.js',
  'packages/net-stubbing/node_modules/debug/src/node.js',
  'packages/server/node_modules/mocha/node_modules/debug/src/node.js',
  'node_modules/minimatch/minimatch.js',
  'node_modules/mocha-7.0.1/node_modules/glob/node_modules/minimatch/minimatch.js',
  'packages/data-context/node_modules/minimatch/minimatch.js',
  'packages/network/node_modules/minimatch/minimatch.js',
  'packages/server/node_modules/glob/node_modules/minimatch/minimatch.js',
  'node_modules/js-yaml/lib/js-yaml/type/js/function.js',
  'packages/server/lib/open_project.ts',
  'packages/server/lib/project-base.ts',
  'packages/server/lib/socket-ct.ts',
  'packages/server/lib/browsers/utils.ts',
  'packages/server/lib/cloud/exception.ts',
  'packages/server/lib/errors.ts',
  'packages/server/lib/util/process_profiler.ts',
  'node_modules/prettier/index.js',
  'node_modules/prettier/parser-babel.js',
  'node_modules/prettier/parser-espree.js',
  'node_modules/prettier/parser-flow.js',
  'node_modules/prettier/parser-meriyah.js',
  'node_modules/prettier/parser-typescript.js',
  'node_modules/prettier/third-party.js',
  'packages/server/node_modules/is-ci/index.js',
  'packages/server/node_modules/ci-info/index.js',
  'node_modules/@babel/traverse/lib/index.js',
  'node_modules/@babel/types/lib/definitions/index.js',
]
