import { whenever, onKeyStroke, MaybeRef } from '@vueuse/core'
import { computed, onMounted, Ref, ref } from 'vue'

export const useListNavigation = (target) => {
  const selectedNode: Ref<HTMLElement> = ref()

  const elNeedsToBeScrolled = (el) => {
    const box = el.getBoundingClientRect()
    const targetBox = target.value.getBoundingClientRect()

    return box.y < 0 ||
      box.y > targetBox.height ||
      box.y > window.innerHeight
  }

  whenever(selectedNode, (node) => {
    if (node.getBoundingClientRect()) {
      if (elNeedsToBeScrolled(node)) node.scrollIntoView()
    }
  })

  onMounted(() => {
    selectedNode.value = selectedNode.value ? selectedNode.value : target.value?.children[0]
  })

  onKeyStroke('ArrowDown', (e) => {
    e.preventDefault()
    if (selectedNode.value?.nextElementSibling) {
      selectedNode.value = selectedNode.value.nextElementSibling
    } else {
      selectedNode.value = target.value?.children[0]
    }
  }, { target: target as MaybeRef<EventTarget> })

  onKeyStroke('ArrowUp', (e) => {
    e.preventDefault()
    if (selectedNode.value?.previousElementSibling) {
      selectedNode.value = selectedNode.value.previousElementSibling
    } else {
      selectedNode.value = target.value?.children[target.value?.children.length - 1]
    }
  }, { target: target as MaybeRef<EventTarget> })

  return {
    selectedNode,
    selectedIndex: computed(() => {
      return parseInt(selectedNode.value?.getAttribute('data-list-idx') || '0', 10)
    }),
  }
}
