import path from 'path'
import type { Metadata } from '../types'
import { strict as assert } from 'assert'

/**
 * Represents dependencies of a module.
 *
 * @property directDeps are all dependencies which are directly imported by the module
 * @property allDeps are all dependencies imported by the module as well as by
 * its dependencies transitively
 */
export type DependencyNode = { directDeps: Set<string>, allDeps: Set<string> }

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
 * The array representation of the dependency map which is used to embed it
 * into the snapshot.
 */
export type DependencyMapArray = Array<
  [string, { directDeps: string[], allDeps: string[] }]
>

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

const resolvedPathCache = new Map()
const getResolvedPathForKey = (projectBaseDir: string, key: string) => {
  let resolvedPath = resolvedPathCache.get(key)

  if (!resolvedPath) {
    resolvedPath = path.resolve(projectBaseDir, key)
    resolvedPathCache.set(key, resolvedPath)
  }

  return resolvedPath
}

/**
 * Converts the array representation that was embedded into the snapshot back
 * into a dependency map.
 *
 * @param arr array representation of the dependency map
 * @param projectBaseDir the root of the project the map is for
 */
function dependencyArrayToResolvedMap (
  arr: DependencyMapArray,
  projectBaseDir: string,
) {
  // NOTE: using path.resolve here guarantess that map keys/values are native slashed
  // even though the included dependency map array uses always forward slashes
  const map: Map<string, DependencyNode> = new Map()

  for (const [k, { directDeps, allDeps }] of arr) {
    const resolvedKey = getResolvedPathForKey(projectBaseDir, k)
    const resolvedDirectDeps = directDeps.map((x) => {
      return getResolvedPathForKey(projectBaseDir, x)
    })
    const resolvedAllDeps = allDeps.map((x) => {
      return getResolvedPathForKey(projectBaseDir, x)
    })

    map.set(resolvedKey, {
      directDeps: new Set(resolvedDirectDeps),
      allDeps: new Set(resolvedAllDeps),
    })
  }

  return map
}

/**
 * Wraps a {@link Map} of dependencies and adds methods to query it.
 */
export class DependencyMap {
  /**
   * Creates an instance of a {@link DependencyMap}.
   *
   * @param dependencyMap  the mapped dependencies
   */
  constructor (private readonly dependencyMap: Map<string, DependencyNode>) {}

  /**
   * Get all dependencies of a particular module.
   *
   * @param nodeId the id of the module
   */
  allDepsOf (nodeId: string) {
    const node = this.dependencyMap.get(nodeId)

    assert(node != null, `Node with ${nodeId} needs to be in map`)

    return Array.from(node.allDeps)
  }

  /**
   * Get all direct dependencies of a particular module, meaning the `import`
   * or `require` for those deps are found inside the module.
   *
   * @param nodeId the id of the module
   */
  directDepsOf (nodeId: string) {
    const node = this.dependencyMap.get(nodeId)

    assert(node != null, `Node with ${nodeId} needs to be in map`)

    return Array.from(node.directDeps)
  }

  /**
   * Determines if a particular module is inside the set of loaded modules, but
   * not inside the Node.js module cache.
   *
   * @param id the module id
   * @param loaded the set of loaded modules
   * @param cache the Node.js module cache
   */
  loadedButNotCached (
    id: string,
    loaded: Set<string>,
    cache: Record<string, NodeModule>,
  ) {
    if (!loaded.has(id)) return false

    return cache[id] == null
  }

  /**
   * Determines if a critical dependency of the given module is inside the
   * Node.js module cache, but not inside the loaded set.
   *
   * @param id the module id
   * @param loaded the set of loaded modules
   * @param cache the Node.js module cache
   */
  criticalDependencyLoadedButNotCached (
    id: string,
    loaded: Set<string>,
    cache: Record<string, NodeModule>,
  ) {
    assert(cache[id] == null, 'Should not query for modules that are in cache')

    const node = this.dependencyMap.get(id)

    // Shouldn't be invoked for with a module that isn't in the snapshot, since then it wouldn't
    // be in snapshot exports either
    assert(
      node != null,
      `should not check dependencies that are not inside the snapshot: ${id}`,
    )

    // 1. Determine if any of direct deps should be reloaded
    for (const childId of node.directDeps) {
      if (this.loadedButNotCached(childId, loaded, cache)) return true
    }

    // 2. Determine if any of the indirect deps of the module should be reloaded

    // Unfortunately this most likely case is also the most expensive.
    const indirectsToReach: Set<string> = new Set()

    for (const childId of node.allDeps) {
      if (this.loadedButNotCached(childId, loaded, cache)) {
        indirectsToReach.add(childId)
      }
    }
    if (indirectsToReach.size > 0) {
      const visited: Set<string> = new Set()

      return this._reachableWithoutHittingCache(
        node,
        indirectsToReach,
        loaded,
        cache,
        visited,
      )
    }

    // 3. We determined that the module does not need to be reloaded

    // This is the most common case as we only return `true` above if the
    // Node.js module cache has been modified.
    // But unfortunately we're required to traverse all of a module's
    // dependencies EVERY time to detect those few edge cases.
    return false
  }

  /**
   * Determines if we can walk to a module following the dependency tree
   * without hitting a module that is inside the Node.js module cache.
   */
  private _reachableWithoutHittingCache (
    node: DependencyNode,
    toReach: Set<string>,
    loaded: Set<string>,
    cache: Record<string, NodeModule>,
    visited: Set<string>,
  ) {
    // Walk the tree until we either hit a module that is cached or is one of the modules we try to reach
    for (const child of node.directDeps) {
      if (visited.has(child)) continue

      visited.add(child)
      if (toReach.has(child)) return true

      if (cache[child] == null) {
        const childNode = this.dependencyMap.get(child)

        if (
          childNode != null &&
          this._reachableWithoutHittingCache(
            childNode,
            toReach,
            loaded,
            cache,
            visited,
          )
        ) {
          return true
        }
      }
    }

    return false
  }

  /**
   * Creates an instance of a {@link DependencyMap} from a dependency map
   * {@link Array} representation that was embedded in the snapshot.
   *
   * @param arr the dependency map
   * @param projectBaseDir the root of the project the map is for
   */
  static fromDepArrayAndBaseDir (
    arr: DependencyMapArray,
    projectBaseDir: string,
  ) {
    const map = dependencyArrayToResolvedMap(arr, projectBaseDir)

    return new DependencyMap(map)
  }
}
