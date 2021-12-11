<template>
  <div
    class="flex h-full"
    :class="{'select-none': panel1IsDragging || panel1IsDragging}"
  >
    <div
      v-show="showPanel1"
      class="h-full relative"
      :style="{width: `${panel1Width}px`}"
    >
      <slot name="panel1">
        Width: {{ panel1Width }}
        HandleX: {{ panel1HandleX }}
      </slot>

      <div
        ref="panel1ResizeHandle"
        class="cursor-ew-resize h-full bg-teal-400 top-0 -right-6px w-16px z-30 absolute"
      />
    </div>

    <div
      v-show="showPanel1"
      class="h-full relative"
      :style="{width: `${panel2Width}px`}"
    >
      <slot name="panel1">
        Width: {{ panel2Width }}
        HandleX: {{ panel2HandleX }}
      </slot>

      <div
        ref="panel2ResizeHandle"
        class="cursor-ew-resize h-full bg-teal-400 top-0 -right-6px w-16px z-30 absolute"
      />
    </div>

    <div class="h-full">
      <slot name="panel3">
        Panel 3 default content
      </slot>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'

import { useDraggable } from '@vueuse/core'

const props = withDefaults(defineProps<{
  showPanel1?: boolean // specsList in runner
  showPanel2?: boolean // reporter in runner
  initialPanel1Width?: number
  initialPanel2Width?: number
  minPanel1Width?: number
  minPanel2Width?: number
  minPanel3Width?: number
  maxTotalWidth?: number // windowWidth in runner
}>(), {
  showPanel1: true,
  showPanel2: true,
  initialPanel1Width: 280,
  initialPanel2Width: 320,
  minPanel1Width: 200,
  minPanel2Width: 200,
  minPanel3Width: 100,
  maxTotalWidth: window.innerWidth,
})

const panel1ResizeHandle = ref<HTMLElement | null>(null)
const panel2ResizeHandle = ref<HTMLElement | null>(null)
const lastPanel1Width = ref(props.initialPanel1Width)
const lastPanel2Width = ref(props.initialPanel2Width)

const { x: panel1HandleX, isDragging: panel1IsDragging } = useDraggable(panel1ResizeHandle, {
  initialValue: { x: props.initialPanel1Width, y: 0 },
  exact: true,
  preventDefault: true,
  onMove: () => {
    lastPanel1Width.value = panel1Width.value
  },
  onEnd: () => {
    // console.log('end drag specs list x val', panel1HandleX.value)
    // console.log('end drag specs list width val', specsListWidth.value)
    panel1HandleX.value = panel1Width.value
    handleResizeEnd('panel1')
  },
})

const { x: panel2HandleX, isDragging: panel2IsDragging } = useDraggable(panel2ResizeHandle, {
  initialValue: { x: props.initialPanel2Width + props.initialPanel1Width, y: 0 },
  exact: true,
  preventDefault: true,
  onMove: () => {
    lastPanel2Width.value = panel2Width.value
  },
  onEnd: () => {
    panel2HandleX.value = panel2Width.value + panel1Width.value
    lastPanel2Width.value = panel2Width.value
    handleResizeEnd('panel2')
  },
})

const panel1Width = computed(() => {
  if (!props.showPanel1) {
    return 0
  }

  if (!panel1IsDragging.value) {
    return lastPanel1Width.value
  }

  const nonSpecsListWidth = panel2Width.value + props.minPanel3Width
  const maxSpecsListWidth = props.maxTotalWidth - nonSpecsListWidth

  if (panel1HandleX.value <= maxSpecsListWidth && panel1HandleX.value > props.minPanel1Width) {
    return panel1HandleX.value
  }

  if (panel1HandleX.value > maxSpecsListWidth) {
    return maxSpecsListWidth
  }

  return props.minPanel1Width
})

const panel2Width = computed(() => {
  if (!panel2IsDragging.value) {
    // console.log('Panel2 is not dragging, using last value ', lastPanel2Width.value)

    return lastPanel2Width.value
  }

  const unavailableWidth = panel1Width.value + props.minPanel3Width
  const maxPanel2Width = props.maxTotalWidth - unavailableWidth
  const currentPanel2Width = panel2HandleX.value - panel1Width.value

  if (!maxPanel2Width || !currentPanel2Width) {
    // console.log('missing maxPanel2Width or currentPanel2Width')

    return props.initialPanel2Width
  }

  if (currentPanel2Width <= maxPanel2Width && currentPanel2Width > props.minPanel2Width) {
    // console.log('safe zone, currentPanel2Width was less than maxPanel2Width and greater than 200', currentPanel2Width)

    return currentPanel2Width
  }

  if (currentPanel2Width > maxPanel2Width) {
    // console.log('currentPanel2Width was greater than maxPanel2Width, return max')

    return maxPanel2Width
  }

  if (currentPanel2Width < props.minPanel2Width) {
    // console.log('currentPanel2Width less than 200')

    return props.minPanel2Width
  }

  // console.log('something else')

  return currentPanel2Width
})

function handleResizeEnd (panel: 'panel1' | 'panel2') {
  // console.log('persist size', panel)
  // emit events to save the state
  if (panel === 'panel1') {
    //    preferences.update('reporterWidth', Math.round(reporterWidth.value))
  } else {
    //   preferences.update('specsListWidth', Math.round(specsListWidth.value))
  }
}

</script>
