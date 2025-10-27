import { defineStore } from 'pinia'

const SPEC_DIRTY_DATA_MODULES = Object.freeze({
  STUDIO: {
    name: 'Studio',
  },
})

export type SpecDirtyDataModule = (typeof SPEC_DIRTY_DATA_MODULES)[keyof typeof SPEC_DIRTY_DATA_MODULES]

export type SpecDirtyDataModuleKey = keyof typeof SPEC_DIRTY_DATA_MODULES

export interface SpecDirtyDataState {
  dirtyData: Record<SpecDirtyDataModuleKey, boolean>
}

export const useSpecDirtyDataStore = defineStore('specDirtyData', {
  state: (): SpecDirtyDataState => {
    return {
      dirtyData: {} as Record<SpecDirtyDataModuleKey, boolean>,
    }
  },
  actions: {
    setDirtyStateForKey (key: SpecDirtyDataModuleKey, isDirty: boolean) {
      this.dirtyData[key] = isDirty
    },
    getDirtyStateForKey (key: SpecDirtyDataModuleKey) {
      return this.dirtyData[key]
    },
    isDirty () {
      return Object.values(this.dirtyData).some((isDirty) => isDirty)
    },
    getDirtyModules () {
      return Object.keys(this.dirtyData).filter((key) => this.dirtyData[key as SpecDirtyDataModuleKey]).map((key) => SPEC_DIRTY_DATA_MODULES[key as SpecDirtyDataModuleKey])
    },
    resetDirtyState () {
      this.dirtyData = {} as Record<SpecDirtyDataModuleKey, boolean>
    },
  },
})

export type SpecDirtyDataStore = ReturnType<typeof useSpecDirtyDataStore>
