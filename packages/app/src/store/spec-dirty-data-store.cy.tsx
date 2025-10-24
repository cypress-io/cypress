import { defineComponent } from 'vue'
import { useSpecDirtyDataStore } from './spec-dirty-data-store'

// Test component that uses the store
const TestComponent = defineComponent({
  setup () {
    const store = useSpecDirtyDataStore()

    return () => (
      <div>
        <div data-cy="is-dirty">{store.isDirty().toString()}</div>
        <div data-cy="dirty-modules">{JSON.stringify(store.getDirtyModules())}</div>
        <div data-cy="studio-dirty">{store.getDirtyStateForKey('STUDIO')?.toString() || 'undefined'}</div>
        <button
          data-cy="set-studio-dirty"
          onClick={() => store.setDirtyStateForKey('STUDIO', true)}
        >
          Set Studio Dirty
        </button>
        <button
          data-cy="set-studio-clean"
          onClick={() => store.setDirtyStateForKey('STUDIO', false)}
        >
          Set Studio Clean
        </button>
        <button
          data-cy="reset-dirty-state"
          onClick={() => store.resetDirtyState()}
        >
          Reset Dirty State
        </button>
      </div>
    )
  },
})

describe('spec-dirty-data-store', () => {
  beforeEach(() => {
    cy.mount(<TestComponent />)
  })

  describe('initial state', () => {
    it('should initialize with clean state', () => {
      cy.get('[data-cy="is-dirty"]').should('contain', 'false')
      cy.get('[data-cy="dirty-modules"]').should('contain', '[]')
      cy.get('[data-cy="studio-dirty"]').should('contain', 'undefined')
    })
  })

  describe('setDirtyStateForKey', () => {
    it('should set STUDIO module as dirty', () => {
      cy.get('[data-cy="set-studio-dirty"]').click()

      cy.get('[data-cy="is-dirty"]').should('contain', 'true')
      cy.get('[data-cy="studio-dirty"]').should('contain', 'true')
      cy.get('[data-cy="dirty-modules"]').should('contain', 'Studio')
    })

    it('should set STUDIO module as clean', () => {
      // First set it dirty
      cy.get('[data-cy="set-studio-dirty"]').click()
      cy.get('[data-cy="is-dirty"]').should('contain', 'true')

      // Then set it clean
      cy.get('[data-cy="set-studio-clean"]').click()

      cy.get('[data-cy="is-dirty"]').should('contain', 'false')
      cy.get('[data-cy="studio-dirty"]').should('contain', 'false')
      cy.get('[data-cy="dirty-modules"]').should('contain', '[]')
    })

    it('should handle multiple state changes', () => {
      // Set dirty
      cy.get('[data-cy="set-studio-dirty"]').click()
      cy.get('[data-cy="is-dirty"]').should('contain', 'true')

      // Set clean
      cy.get('[data-cy="set-studio-clean"]').click()
      cy.get('[data-cy="is-dirty"]').should('contain', 'false')

      // Set dirty again
      cy.get('[data-cy="set-studio-dirty"]').click()
      cy.get('[data-cy="is-dirty"]').should('contain', 'true')
    })
  })

  describe('getDirtyStateForKey', () => {
    it('should return undefined for unset module initially', () => {
      cy.get('[data-cy="studio-dirty"]').should('contain', 'undefined')
    })

    it('should return true for dirty module', () => {
      cy.get('[data-cy="set-studio-dirty"]').click()
      cy.get('[data-cy="studio-dirty"]').should('contain', 'true')
    })

    it('should return false for clean module', () => {
      cy.get('[data-cy="set-studio-dirty"]').click()
      cy.get('[data-cy="set-studio-clean"]').click()
      cy.get('[data-cy="studio-dirty"]').should('contain', 'false')
    })
  })

  describe('isDirty', () => {
    it('should return false when no modules are dirty', () => {
      cy.get('[data-cy="is-dirty"]').should('contain', 'false')
    })

    it('should return true when any module is dirty', () => {
      cy.get('[data-cy="set-studio-dirty"]').click()
      cy.get('[data-cy="is-dirty"]').should('contain', 'true')
    })
  })

  describe('getDirtyModules', () => {
    it('should return empty array when no modules are dirty', () => {
      cy.get('[data-cy="dirty-modules"]').should('contain', '[]')
    })

    it('should return module objects for dirty modules', () => {
      cy.get('[data-cy="set-studio-dirty"]').click()
      cy.get('[data-cy="dirty-modules"]').should('contain', 'Studio')
    })

    it('should filter out clean modules', () => {
      cy.get('[data-cy="set-studio-dirty"]').click()
      cy.get('[data-cy="set-studio-clean"]').click()
      cy.get('[data-cy="dirty-modules"]').should('contain', '[]')
    })
  })

  describe('resetDirtyState', () => {
    it('should clear all dirty data', () => {
      // Set dirty first
      cy.get('[data-cy="set-studio-dirty"]').click()
      cy.get('[data-cy="is-dirty"]').should('contain', 'true')

      // Reset
      cy.get('[data-cy="reset-dirty-state"]').click()

      cy.get('[data-cy="is-dirty"]').should('contain', 'false')
      cy.get('[data-cy="dirty-modules"]').should('contain', '[]')
      cy.get('[data-cy="studio-dirty"]').should('contain', 'undefined')
    })

    it('should make isDirty return false after reset', () => {
      cy.get('[data-cy="set-studio-dirty"]').click()
      cy.get('[data-cy="reset-dirty-state"]').click()
      cy.get('[data-cy="is-dirty"]').should('contain', 'false')
    })

    it('should make getDirtyModules return empty array after reset', () => {
      cy.get('[data-cy="set-studio-dirty"]').click()
      cy.get('[data-cy="reset-dirty-state"]').click()
      cy.get('[data-cy="dirty-modules"]').should('contain', '[]')
    })
  })

  describe('integration scenarios', () => {
    it('should handle complete workflow: set dirty -> check dirty -> reset -> check clean', () => {
      // Set dirty
      cy.get('[data-cy="set-studio-dirty"]').click()
      cy.get('[data-cy="is-dirty"]').should('contain', 'true')
      cy.get('[data-cy="dirty-modules"]').should('contain', 'Studio')

      // Reset
      cy.get('[data-cy="reset-dirty-state"]').click()
      cy.get('[data-cy="is-dirty"]').should('contain', 'false')
      cy.get('[data-cy="dirty-modules"]').should('contain', '[]')
    })

    it('should maintain state consistency across multiple operations', () => {
      cy.get('[data-cy="set-studio-dirty"]').click()
      cy.get('[data-cy="studio-dirty"]').should('contain', 'true')
      cy.get('[data-cy="is-dirty"]').should('contain', 'true')
      cy.get('[data-cy="dirty-modules"]').should('contain', 'Studio')

      cy.get('[data-cy="set-studio-clean"]').click()
      cy.get('[data-cy="studio-dirty"]').should('contain', 'false')
      cy.get('[data-cy="is-dirty"]').should('contain', 'false')
      cy.get('[data-cy="dirty-modules"]').should('contain', '[]')
    })
  })
})
