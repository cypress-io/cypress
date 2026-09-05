import { computed, ref, watch } from 'vue'
import type { ComputedRef } from 'vue'
import { debouncedWatch } from '@vueuse/core'
import { useMutation, gql } from '@urql/vue'
import { getSeparator } from './useCollapsibleTree'
import { TreeExpansionCache_SetPreferencesDocument } from '../../generated/graphql'

gql`
mutation TreeExpansionCache_SetPreferences ($value: String!) {
  setPreferences (value: $value, type: project) {
    currentProject {
      id
      savedState
    }
  }
}`

const debounce = 200

// Every directory in the tree is a path prefix of the specs inside it, so the prefixes of the
// current specs are the directory ids the tree can produce.
function currentDirectories (specs: readonly { relative: string }[]) {
  const separator = getSeparator()
  const directories = new Set<string>()

  for (const { relative } of specs) {
    const segments = relative.split(separator)

    for (let i = 1; i < segments.length; i++) {
      directories.add(segments.slice(0, i).join(separator))
    }
  }

  return directories
}

// Directories are expanded by default, so only the collapsed ones carry information. Dropping the
// expanded entries, along with directories the project no longer has, keeps the saved state from
// growing by an entry for every directory that has ever been toggled.
function toPersistedState (cache: Record<string, boolean>, specs: readonly { relative: string }[]) {
  const directories = currentDirectories(specs)

  return Object.fromEntries(Object.entries(cache).filter(([id, expanded]) => !expanded && directories.has(id)))
}

// Persists directory collapse/expand state via saved_state.ts (disk-backed, per-project)
// rather than localStorage, since a new-tab relaunch (e.g. "Run all specs") clears all
// browser storage for the app's own origin before the new tab mounts.
export function useTreeExpansionCache (
  savedState: Record<string, boolean> | undefined,
  specFilter: () => string | undefined,
  specs: () => readonly { relative: string }[],
): ComputedRef<Record<string, boolean>> {
  const persisted = ref<Record<string, boolean>>({ ...savedState })
  const setTreeExpansionCache = useMutation(TreeExpansionCache_SetPreferencesDocument)

  // Each write is a read-modify-write of the project's state.json on the server, so collapsing
  // several directories in a row is coalesced into a single save.
  debouncedWatch(persisted, (value) => {
    setTreeExpansionCache.executeMutation({ value: JSON.stringify({ specsListTreeExpansion: toPersistedState(value, specs()) }) })
  }, { deep: true, debounce })

  // A filtered tree ignores the persisted state so that every match stays visible. Toggles made
  // while filtering go to a throwaway cache instead, which keeps them across the rebuilds that
  // happen as spec data loads without overwriting what the user collapsed in the full list.
  const whileFiltering = ref<Record<string, boolean>>({})

  watch(specFilter, () => whileFiltering.value = {})

  return computed(() => specFilter() ? whileFiltering.value : persisted.value)
}
