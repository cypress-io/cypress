import { defineStore } from 'pinia'

export type ModalTypes = 'createSpec'

export interface ModalStore {
  activeModalId: ModalTypes | null
}

/**
 * Modals Store allows parts of the application to open and close modals in
 * unrelated parts of the application. This is useful for resolving
 * conflicts between timing-based and interaction-based triggers (like the
 * Growth Modals and the Create Spec modals)
 */
export const useModalStore = defineStore({
  id: 'modal',
  state: (): ModalStore => ({ activeModalId: null }),
  actions: {
    open (id: ModalTypes) {
      this.activeModalId = id
    },
    close () {
      this.activeModalId = null
    },
  },
})
