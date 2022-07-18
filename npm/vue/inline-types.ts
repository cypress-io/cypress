import fs from 'fs-extra'
import globby from 'globby'
import path from 'path'

// We depend on @vue/test-utils and inline this library in the
// @cypress/vue bundle.
// Unfortunately, although rollup can inline libraries like this,
// TypeScript doesn't do the same for d.ts files - it mains imports
// to the original library, which we do not actually ship in the binary.

// This script copies the `d.ts` files into the `dist` directory
// then modifies the `index.d.ts` to reference the copied type definitions
// instead of the ones from the local node_modules directory that we don't
// actually bundle in the binary.

function rewriteSourceForInlineTypes (src: string) {
  return src
  // Need to modify these lines:
  //   import type { MountingOptions, VueWrapper } from '@vue/test-utils';
  //   import * as _VueTestUtils from '@vue/test-utils';
  // to
  //   import type { MountingOptions, VueWrapper } from './@vue/test-utils';
  //   import * as _VueTestUtils from './@vue/test-utils';
  .replaceAll(`'@vue/test-utils';`, `'./@vue/test-utils';`)

  // Need to modify this line:
  //   config: import("@vue/test-utils/config).GlobalConfigOptions;
  // to
  //   config: import("./@vue/test-utils/config").GlobalConfigOptions;
  .replaceAll(`@vue/test-utils/dist/config`, `./@vue/test-utils/config`)
}

async function inlineTestUtilsTypes () {
  console.log('[npm/vue] Inline type definitions for @vue/test-utils and rewriting source') // eslint-disable-line no-console

  // get the directory with the type definitions we want to inline
  const vtuDir = path.dirname(require.resolve('@vue/test-utils'))

  // grab the type definitions
  const typeDefs = await globby('**/*.d.ts', { cwd: vtuDir })

  // make a directory for them in npm/vue/dist
  const typeDefDir = path.join(__dirname, 'dist', '@vue', 'test-utils')

  await fs.mkdir(typeDefDir, { recursive: true })

  // copy the type definitions
  await Promise.all(
    typeDefs.map((tds) => {
      const from = path.join(vtuDir, tds)
      const to = path.join(typeDefDir, tds)

      return fs.copy(from, to, { recursive: true })
    }),
  )

  const cypressVueMainTypeDef = path.join(__dirname, 'dist', 'index.d.ts')

  // modify index.d.ts to reference relative type definitions instead of ones from
  // node_modules
  const updateWithRelativeImports = rewriteSourceForInlineTypes(
    await fs.readFile(cypressVueMainTypeDef, 'utf-8'),
  )

  // rewrite index.d.ts, now modified to point at local type definitions.
  await fs.writeFile(cypressVueMainTypeDef, updateWithRelativeImports)
}

inlineTestUtilsTypes()
