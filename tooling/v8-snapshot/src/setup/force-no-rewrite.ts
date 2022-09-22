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

  // TODO: This should be temporary. Will address with https://github.com/cypress-io/cypress/issues/22986
  // 'packages/server/lib/routes-e2e.ts',
]
