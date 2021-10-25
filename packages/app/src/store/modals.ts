import { defineStore } from 'pinia'
import type { Component } from 'vue';
import CreateSpecModal from '../specs/CreateSpecModal.vue'

export type ModalTypes = 'createSpec'

export interface ModalDefinition {
  component: Component,
  standalone: boolean
}

export interface ModalStore {
  activeModalId: ModalTypes | null

  // This should be the valid options available to StandardModal
  modalOptions: Record<string, any>

  // This should be the arguments to pass onto the specific activeModal
  componentOptions: Record<string, any>
}

export const modals: Record<ModalTypes, ModalDefinition> = {
  createSpec: {
    component: CreateSpecModal,
    standalone: true
  },
}

/**
 * Modals Store allows parts of the application to open and close modals in
 * unrelated parts of the application. This is useful for resolving
 * conflicts between timing-based and interaction-based triggers (like the
 * Growth Modals and the Create Spec modals)
 */
export const useModalStore = defineStore({
  id: 'modal',
  state: (): ModalStore => ({ activeModalId: null, modalOptions: {}, componentOptions: {} }),
  actions: {
    open (id: ModalTypes, modalOptions, componentOptions) {
      this.activeModalId = id
      this.modalOptions = modalOptions
      this.componentOptions = componentOptions
    },
    close () {
      this.activeModalId = null
      this.modalOptions = {}
      this.componentOptions = {}
    },
  },
  getters: {
    active: state => {
      const modal = state.activeModalId ? modals[state.activeModalId] : null
      const modalOptions = state.modalOptions
      const componentOptions = state.componentOptions

      return { ...modal, modalOptions, componentOptions }
    }
  }
})
