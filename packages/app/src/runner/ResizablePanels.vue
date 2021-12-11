<template>
  <div
    class="flex h-full"
    :class="{'select-none': panel1IsDragging || panel1IsDragging}"
    @mouseup="handleMouseup"
    @mousemove="handleMousemove"
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
        data-cy="panel1ResizeHandle"
        class="cursor-ew-resize h-full top-0 -right-6px w-16px z-30 absolute"
        @mousedown="handleMousedown('panel1', $event)"
      />
    </div>

    <div
      v-show="showPanel2"
      class="h-full relative"
      :style="{width: `${panel2Width}px`}"
    >
      <slot name="panel2">
        Width: {{ panel2Width }}
        HandleX: {{ panel2HandleX }}
      </slot>

      <div
        data-cy="panel2ResizeHandle"
        class="cursor-ew-resize h-full top-0 -right-6px w-16px z-30 absolute"
        @mousedown="handleMousedown('panel2', $event)"
      />
    </div>

    <div class="flex-grow h-full">
      <slot name="panel3">
        Panel 3 default content
      </slot>
    </div>
  </div>
</template>

<script lang="ts">
export default {
  name: 'ResizablePanels',
}
</script>

<script lang="ts" setup>
import { computed, ref } from 'vue'

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

const panel1HandleX = ref(props.initialPanel1Width)
const panel2HandleX = ref(props.initialPanel2Width + props.initialPanel1Width)
const panel1IsDragging = ref(false)
const panel2IsDragging = ref(false)
const cachedPanel2Width = ref(props.initialPanel2Width)

const handleMousedown = (panel: 'panel1' | 'panel2', event) => {
  if (panel === 'panel1') {
    panel1IsDragging.value = true
  } else {
    panel2IsDragging.value = true
    panel2HandleX.value = event.clientX
  }
}
const handleMousemove = (event: MouseEvent) => {
  if (panel1IsDragging.value && event.clientX < maxPanel1Width.value) {
    panel1HandleX.value = event.clientX
  } else if (panel2IsDragging.value && event.clientX < (panel1Width.value + maxPanel2Width.value)) {
    panel2HandleX.value = event.clientX
    cachedPanel2Width.value = panel2Width.value
  }
}
const handleMouseup = () => {
  panel1IsDragging.value = false
  panel2IsDragging.value = false
}

const maxPanel1Width = computed(() => {
  const unavailableWidth = panel2Width.value + props.minPanel3Width

  return props.maxTotalWidth - unavailableWidth
})

const panel1Width = computed(() => {
  if (!props.showPanel1) {
    return 0
  }

  if (panel1HandleX.value <= maxPanel1Width.value && panel1HandleX.value > props.minPanel1Width) {
    return panel1HandleX.value
  }

  if (panel1HandleX.value > maxPanel1Width.value) {
    return maxPanel1Width.value
  }

  return props.minPanel1Width
})

const maxPanel2Width = computed(() => {
  const unavailableWidth = panel1Width.value + props.minPanel3Width

  return props.maxTotalWidth - unavailableWidth
})

const panel2Width = computed(() => {
  if (!panel2IsDragging.value) {
    return cachedPanel2Width.value
  }

  const currentPanel2Width = panel2HandleX.value - panel1Width.value

  if (!maxPanel2Width.value || !currentPanel2Width) {
    return props.initialPanel2Width
  }

  if (currentPanel2Width <= maxPanel2Width.value && currentPanel2Width > props.minPanel2Width) {
    return currentPanel2Width
  }

  if (currentPanel2Width > maxPanel2Width.value) {
    return maxPanel2Width.value
  }

  if (currentPanel2Width < props.minPanel2Width) {
    return props.minPanel2Width
  }

  return currentPanel2Width
})

function handleResizeEnd (panel: 'panel1' | 'panel2') {
  // TODO: emit events to save the state
  if (panel === 'panel1') {
    //    preferences.update('reporterWidth', Math.round(reporterWidth.value))
  } else {
    //   preferences.update('specsListWidth', Math.round(specsListWidth.value))
  }
}

</script>
