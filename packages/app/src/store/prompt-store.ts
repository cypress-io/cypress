import { defineStore } from 'pinia'

// TODO: Share this
interface GetCodeModalInfo {
  testId: string
  logId: string
}

interface PromptState {
  getCodeModalIsOpen: boolean
  currentGetCodeModalInfo: GetCodeModalInfo | null
}

export const usePromptStore = defineStore('prompt', {
  state: (): PromptState => {
    return {
      getCodeModalIsOpen: false,
      currentGetCodeModalInfo: null,
    }
  },
  actions: {
    openGetCodeModal (getCodeModalInfo: GetCodeModalInfo) {
      this.getCodeModalIsOpen = true
      this.currentGetCodeModalInfo = getCodeModalInfo
    },

    closeGetCodeModal () {
      this.getCodeModalIsOpen = false
      this.currentGetCodeModalInfo = null
    },
  },
})
