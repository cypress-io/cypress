import { ref } from 'vue'
import type { Router } from 'vue-router'
import type { SpecDirtyDataStore } from '../store/spec-dirty-data-store'

type UnsavedChangesCallback = ((resume: () => void) => void) | null

const unsavedChangesCallback = ref<UnsavedChangesCallback>(null)

export function setUnsavedChangesCallback (cb: UnsavedChangesCallback) {
  unsavedChangesCallback.value = cb
}

/**
 * Checks if there are unsaved changes and, if so, calls the callback.
 * Returns true if the action was blocked (dirty + callback registered),
 * false if the caller should proceed normally.
 */
export function guardUnsavedStudioChanges (store: SpecDirtyDataStore, resume: () => void): boolean {
  if (!store.isDirty()) return false

  if (!unsavedChangesCallback.value) return false

  unsavedChangesCallback.value(resume)

  return true
}

export function installStudioExitNavigationGuard (router: Router, getSpecDirtyDataStore: () => SpecDirtyDataStore) {
  router.beforeEach((to, from) => {
    const isLeavingRunner = from.path === '/specs/runner' && to.path !== '/specs/runner'

    if (!isLeavingRunner) return true

    const store = getSpecDirtyDataStore()

    const blocked = guardUnsavedStudioChanges(store, () => {
      store.resetDirtyState()
      router.push(to)
    })

    return !blocked
  })
}
