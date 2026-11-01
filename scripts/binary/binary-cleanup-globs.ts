import path from 'path'

// Each entry is a list of path segments, joined onto the packed app directory
// and passed to `del`. Segments without wildcards are looked up on disk, so a
// mis-cased one still matches on the case-insensitive file systems of macOS and
// Windows but matches nothing on Linux.
export const UNNEEDED_FILE_GLOBS: string[][] = [
  ['**', 'test'],
  ['**', 'tests'],
  // What we need of prettier is entirely encapsulated within the v8 snapshot, but has a few leftover large files
  ['**', 'prettier', 'esm'],
  ['**', 'prettier', 'standalone.js'],
  ['**', 'prettier', 'bin-prettier.js'],
  // ESM files are mostly not needed currently
  ['**', '@babel', '**', 'esm'],
  ['**', 'ramda', 'es'],
  ['**', 'jimp', 'es'],
  ['**', 'nexus', 'dist-esm'],
  ['**', '@graphql-tools', '**', '*.mjs'],
  ['**', 'graphql', '**', '*.mjs'],
  ['**', '@opentelemetry', '**', 'esm'],
  ['**', '@opentelemetry', '**', 'esnext'],
  // We currently do not use any map files
  ['**', '*.map'],
  // License files need to be kept
  ['**', '!(LICENSE|license|License).md'],
  // These are type related files that are not used within the binary
  ['**', '*.d.ts'],
  ['**', '*.d.cts'],
  ['**', '*.d.mts'],
  ['**', '*.flow'],
  // Dependencies ship compiled JS; their TypeScript sources are only reachable
  // through custom export conditions (e.g. `source`) that Node and webpack don't use
  ['**', 'node_modules', '**', '*.{ts,cts,mts}'],
  // Documentation files are not needed
  ['**', 'JSV', 'jsdoc-toolkit'],
  ['**', 'JSV', 'docs'],
  ['**', 'fluent-ffmpeg', 'doc'],
  // Repository, CI, editor and linter configuration is only used to develop a dependency
  ['**', '.github'],
  ['**', '.{eslintrc,prettierrc,nycrc}*'],
  ['**', '.{eslintignore,prettierignore,npmignore,gitignore,gitattributes,gitmodules}'],
  ['**', '.{editorconfig,jshintrc,jscsrc,jscs.json,flowconfig,DS_Store,whitesource,auto-changelog}'],
  ['**', '.{travis,coveralls,airtap}.yml'],
  ['**', 'yarn.lock'],
  // Executable links of nested dependencies; nothing in the binary runs them
  ['**', 'node_modules', '.bin'],
  // Files used as part of prebuilding are not necessary
  ['**', 'node_gyp_bins'],
  ['**', 'better-sqlite3', 'bin'],
  // better-sqlite3 loads these ahead of build/Release; the Linux ones need a newer glibc than Cypress supports
  ['**', 'better-sqlite3', 'prebuilds'],
  ['**', 'registry-js', 'prebuilds'],
  ['**', '*.cc'],
  ['**', '*.o'],
  ['**', '*.c'],
  ['**', '*.h'],
  ['**', '*.{cpp,hpp,gyp,gypi,mk}'],
  ['**', 'CMakeLists.txt'],
  ['**', 'Makefile'],
  // Prebuilt addons for the Bare runtime; the binary runs on Node
  ['**', '*.bare'],
  // patch-package has already been applied by the time the binary is packaged
  ['**', '*.patch'],
  // Remove distributions that are not needed in the binary
  ['**', 'ramda', 'dist'],
  ['**', 'jimp', 'browser'],
  ['**', '@jimp', '**', 'src'],
  ['**', 'nexus', 'src'],
  ['**', 'source-map', 'dist'],
  ['**', 'source-map-js', 'dist'],
  ['**', 'pako', 'dist'],
  ['**', 'node-forge', 'dist'],
  ['**', 'pngjs', 'browser.js'],
  ['**', 'plist', 'dist'],
]

export const getUnneededFileGlobs = (buildAppDir: string) => {
  return UNNEEDED_FILE_GLOBS.map((segments) => path.join(buildAppDir, ...segments))
}
