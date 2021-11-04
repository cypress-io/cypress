import type { ModalTypes } from '../store'
import type { Component } from 'vue'
import TestModal from './TestModal.vue'
import SwitchTestingTypeModal from '../navigation/SwitchTestingTypeModal.vue'

export const modals: Record<ModalTypes, Component | Promise<Component>> = {
  createSpec: TestModal,
  switchTestingType: SwitchTestingTypeModal,
}
