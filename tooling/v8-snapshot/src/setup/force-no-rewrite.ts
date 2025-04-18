export default [
  // recursion due to process.{chdir,cwd} overwrites which are incorrectly rewritten
  'node_modules/graceful-fs/polyfills.js',

  // Has issues depending on the architecture due to how it handles errors
  'node_modules/@cypress/get-windows-proxy/src/registry.js',

  // results in recursive call to __get_fs2__
  'packages/https-proxy/lib/ca.js',

  // TODO: Figure out why these don't properly get flagged as norewrite: https://github.com/cypress-io/cypress/issues/23986
  'node_modules/@cspotcode/source-map-support/source-map-support.js',
  'packages/server/lib/modes/record.ts',
  'packages/server/lib/modes/run.ts',
  '{node_modules,packages}/**/debug/src/node.js',
  '{node_modules,packages}/**/minimatch/minimatch.js',
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
  'node_modules/is-ci/index.js',
  'node_modules/ci-info/index.js',
  'node_modules/@babel/traverse/lib/index.js',
  'node_modules/@babel/types/lib/definitions/index.js',
  'packages/server/node_modules/axios/lib/adapters/http.js',
]
