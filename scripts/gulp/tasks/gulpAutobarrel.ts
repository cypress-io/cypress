import { resolveAutobarrelConfig, autobarrelWatch } from 'autobarrel'
import path from 'path'
import { monorepoPaths } from '../monorepoPaths'

/**
 * Creates "barrel" files according to config in autobarrel.json:
 * https://github.com/tgriesser/autobarrel
 * Particularly useful in @packages/graphql because we want to import all
 * types into the root schema
 */
export async function autobarrelWatcher () {
  await autobarrelWatch(
    await resolveAutobarrelConfig({
      path: path.join(monorepoPaths.root, 'autobarrel.json'),
    }),
  )
}
