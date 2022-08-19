import type { Metadata, Entries } from '../types'

class CircularImports {
  private readonly _visited: Set<string> = new Set()
  private _parent: string = '<root>'

  constructor (
    private readonly _inputs: Metadata['inputs'],
    private readonly _entries: Entries<Metadata['inputs']>,
  ) {}

  findCircularImports () {
    const map: Map<string, Set<string>> = new Map()

    for (const [key, { imports }] of this._entries) {
      this._parent = key
      const circs: string[] = []

      for (const p of imports.map((x) => x.path)) {
        this._visited.clear()
        if (this._leadsBackToParent(p)) circs.push(p)
      }
      if (circs.length > 0) map.set(key, new Set(circs))
    }

    return map
  }

  private _leadsBackToParent (p: string) {
    this._visited.add(p)
    const imports = this._inputs[p].imports

    // Check for direct circular import first
    if (imports.some((x) => x.path === this._parent)) return true

    // Check for indirect circular imports recursively
    for (const { path } of imports) {
      if (this._visited.has(path)) continue

      if (this._leadsBackToParent(path)) return true
    }

    return false
  }
}

/**
 * Resolves circular references in the module tree given a list of entries
 * included in the bundle.
 *
 * @param inputs map of filesincluding information about the modules they are
 * importing. See {@link Metadata} inputs.
 * @param entries iterable version of inputs
 */
export function circularImports (
  inputs: Metadata['inputs'],
  entries: Entries<Metadata['inputs']>,
) {
  return new CircularImports(inputs, entries).findCircularImports()
}
