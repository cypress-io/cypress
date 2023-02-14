import path from 'path'
import type { DependencyMapArray, DependencyNode } from './types'
import { strict as assert } from 'assert'

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
  // NOTE: using path.resolve here guarantees that map keys/values are native slashed
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
