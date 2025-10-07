import { defineStore } from 'pinia'

interface GetCodeModalInfo {
  testId: string
  logId: string
}

interface MoreInfoNeededModalInfo {
  testId: string
  logId: string
  onSave: () => void
  onCancel: () => void
}

interface PromptState {
  getCodeModalIsOpen: boolean
  moreInfoNeededModalIsOpen: boolean
  currentGetCodeModalInfo: GetCodeModalInfo | null
  currentMoreInfoNeededModalInfo: MoreInfoNeededModalInfo | null
}

export const usePromptStore = defineStore('prompt', {
  state: (): PromptState => {
    return {
      getCodeModalIsOpen: false,
      moreInfoNeededModalIsOpen: false,
      currentGetCodeModalInfo: null,
      currentMoreInfoNeededModalInfo: null,
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

    openMoreInfoNeededModal (moreInfoNeededModalInfo: MoreInfoNeededModalInfo) {
      this.moreInfoNeededModalIsOpen = true
      this.currentMoreInfoNeededModalInfo = moreInfoNeededModalInfo
    },

    closeMoreInfoNeededModal () {
      this.moreInfoNeededModalIsOpen = false
      this.currentMoreInfoNeededModalInfo = null
    },

    resetState () {
      this.getCodeModalIsOpen = false
      this.moreInfoNeededModalIsOpen = false
      this.currentGetCodeModalInfo = null
      this.currentMoreInfoNeededModalInfo = null
    },
  },
})
