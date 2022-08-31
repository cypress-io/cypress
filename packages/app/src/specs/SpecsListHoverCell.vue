<template>
  <div
    ref="columnRef"
    class="relative"
  >
    <TransitionQuickFade>
      <slot
        v-if="!shouldShowHover"
        name="content"
      />
      <div
        v-else
        ref="hoverButton"
        class="inset-y-1 right-0 absolute"
      >
        <slot
          name="hover"
        />
      </div>
    </TransitionQuickFade>
  </div>
</template>

/**
  SpecsListHoverCell

  Enables a cell in the SpecsList to have content switched out if the cell is hovered.

  It contains two slots.  One for the main `content` and one for the `hover` content.

  Note: This component contains styling specific for the SpecsList.
 */
<script setup lang="ts">
import { ref, watch } from 'vue'
import { useTimeoutFn, useElementHover, Stoppable } from '@vueuse/core'
import TransitionQuickFade from '../../../frontend-shared/src/components/transitions/TransitionQuickFade.vue'

const props = defineProps<{
  isHoverDisabled?: boolean
}>()

const columnRef = ref()
const hoveredItem = ref()

const shouldShowHover = ref(false)

const isHoveredColumn = useElementHover(columnRef)
const isHoveredItem = useElementHover(hoveredItem)

let controls: Stoppable

watch([isHoveredColumn, isHoveredItem], () => {
  if (props.isHoverDisabled) {
    return
  }

  if (controls) {
    controls.stop()
  }

  if (isHoveredItem.value) {
    isHoveredColumn.value = false
  }

  if (isHoveredColumn.value || isHoveredItem.value) {
    if (shouldShowHover.value) return

    controls = useTimeoutFn(() => {
      shouldShowHover.value = true
    }, 200)
  } else if (!isHoveredColumn.value && !isHoveredItem.value) {
    shouldShowHover.value = false
  }
})

</script>
