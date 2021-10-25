import { defineStore } from 'pinia'
import type { GeneratorId } from '../specs/generators'
import { generators } from '../specs/generators';

export interface SpecGeneratorState {
  currentGeneratorId: GeneratorId | null
  active: boolean
}

export const useSpecGenerator = defineStore({
  id: 'spec-generator',
  state: (): SpecGeneratorState => ({
    active: false,
    currentGeneratorId: null, 
  }),
  actions: {
    start(generatorId) {
      this.active = true
      this.currentGeneratorId = generatorId
    },
    createAnotherSpec() {
      this.start(null)
    },
    finish() {
      this.$reset()
    }
  },
  getters: {
    generator(state) {
      if (state.currentGeneratorId === null) return null
      const val = generators[state.currentGeneratorId]
      return 
    },
    component() { return this.generator?.component },
    header() { return this.generator?.header },
    card() { return this.generator?.card }
  }
})
