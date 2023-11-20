import type { Metadata } from '../types'
import type { DependencyMapArray, DependencyNode } from '@packages/v8-snapshot-require'

/**
 * Builds a dependency map from the inputs of the {@link
 * https://esbuild.github.io/api/#metafile | esbuild metadata}.
 *
 * This map is embedded into the snapshot in order to allow quickly determine
 * direct and transitive dependencies of a module.
 *
 * The map's keys are the module keys.
 * The map's values are {@link DependencyNode}s.
 *
 * This dependency map is queried when modules load in order to determine if
 * they can be loaded from the cache or if they need to be refreshed to respect
 * Node.js module cache modifications.
 *
 * @param inputs a hashmap of modules included with the snapshot along with
 * their imports
 */
export function buildDependencyMap (
  inputs: Metadata['inputs'],
): Map<string, DependencyNode> {
  const dependencyMap: Map<string, DependencyNode> = new Map()

  for (const key of Object.keys(inputs)) {
    const imports = inputs[key].imports.map((x) => x.path)

    dependencyMap.set(key, {
      directDeps: new Set(imports),
      allDeps: new Set(imports),
    })
  }

  for (const [id, node] of dependencyMap.entries()) {
    node.allDeps = allDependencies(
      id,
      dependencyMap,
      node,
      node.allDeps,
      new Set(),
    )
  }

  return dependencyMap
}

/**
 * Determines all dependencies, direct or indirect of a given module.
 * It calls itself recursively to traverse the dependency tree depth-first
 * until all its deps were visited.
 *
 * @param rootId the id of the module for which we gather dependencies
 * @param map the map of all dependencies
 * @param node the node we're currently processing
 * @param acc the set of collected dependencies
 * @param visited the set of dependencies we've visited already
 *
 * @private
 */
function allDependencies (
  rootId: string,
  map: Map<string, DependencyNode>,
  node: DependencyNode,
  acc: Set<string>,
  visited: Set<string>,
) {
  for (const x of node.directDeps) {
    if (visited.has(x)) continue

    visited.add(x)
    if (x !== rootId) acc.add(x)

    allDependencies(rootId, map, map.get(x)!, acc, visited)
  }

  return acc
}

/**
 * Converts the {@link Map} DependencyMap into a {@link DependencyMapArray}.
 *
 * @param dependencyMap the map of dependencies
 * @private
 */
function dependencyMapToArray (dependencyMap: Map<string, DependencyNode>) {
  const arr: DependencyMapArray = []

  for (const [k, { directDeps, allDeps }] of dependencyMap.entries()) {
    arr.push([
      k,
      { directDeps: Array.from(directDeps), allDeps: Array.from(allDeps) },
    ])
  }

  return arr
}

/**
 * Convenience function that creates a map from the provided inputs, converts
 * it to an array representation and returns it to be embedded into the
 * snapshot.
 * @param inputs a hashmap of modules included with the snapshot along with
 * their imports
 */
export function dependencyMapArrayFromInputs (inputs: Metadata['inputs']) {
  const map = buildDependencyMap(inputs)
  const arr = dependencyMapToArray(map)

  return arr
}
