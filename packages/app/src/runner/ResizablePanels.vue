<template>
  <div
    class="flex h-full w-full"
    :class="{'select-none': panel1IsDragging || panel2IsDragging}"
    @mouseup="handleMouseup"
    @mousemove="handleMousemove"
  >
    <div
      v-show="showPanel1"
      class="h-full flex-shrink-0 relative"
      :style="{width: `${panel1Width}px`}"
    >
      <slot
        name="panel1"
        :isDragging="panel1IsDragging"
      />

      <div
        data-cy="panel1ResizeHandle"
        class="cursor-ew-resize h-full top-0 -right-6px w-16px z-30 absolute"
        @mousedown="handleMousedown('panel1', $event)"
      />
    </div>

    <div
      v-show="showPanel2"
      class="h-full flex-shrink-0 relative"
      :style="{width: `${panel2Width}px`}"
    >
      <slot name="panel2" />

      <div
        data-cy="panel2ResizeHandle"
        class="cursor-ew-resize h-full top-0 -right-6px w-16px z-30 absolute"
        @mousedown="handleMousedown('panel2', $event)"
      />
    </div>

    <div
      class="flex-grow h-full"
      :class="{'pointer-events-none':panel2IsDragging}"
      :style="{
        width: `${maxTotalWidth - panel1Width - panel2Width}px`
      }"
    >
      <slot name="panel3" />
    </div>
  </div>
</template>

<script lang="ts">
export default {
  name: 'ResizablePanels',
}
</script>

<script lang="ts" setup>
import { computed, ref, watchEffect } from 'vue'
import { runnerConstants } from './runner-constants'

export type ResizablePanelName = 'panel1' | 'panel2' | 'panel3'

export type DraggablePanel = Exclude<ResizablePanelName, 'panel3'>

const props = withDefaults(defineProps<{
  showPanel1?: boolean // specsList in runner
  showPanel2?: boolean // reporter in runner
  initialPanel1Width?: number
  initialPanel2Width?: number
  minPanel1Width?: number
  minPanel2Width?: number
  minPanel3Width?: number
  maxTotalWidth?: number // windowWidth in runner
  offsetLeft?: number,
}>(), {
  showPanel1: true,
  showPanel2: true,
  initialPanel1Width: runnerConstants.defaultSpecListWidth,
  initialPanel2Width: runnerConstants.defaultReporterWidth,
  minPanel1Width: 200,
  minPanel2Width: 220,
  minPanel3Width: 100,
  maxTotalWidth: window.innerWidth,
  offsetLeft: 0,
})

const emit = defineEmits<{
  (e: 'resizeEnd', value: DraggablePanel): void,
  (e: 'panelWidthUpdated', value: {panel:string, width: number}): void,
}>()

const panel1HandleX = ref(props.initialPanel1Width)
const panel2HandleX = ref(props.initialPanel2Width + props.initialPanel1Width)
const panel1IsDragging = ref(false)
const panel2IsDragging = ref(false)
const cachedPanel1Width = ref<number>(props.initialPanel1Width) // because panel 1 (the inline specs list) can be opened and closed in the UI, we cache the width
const panel2Width = ref(props.initialPanel2Width)

const handleMousedown = (panel: DraggablePanel, event: MouseEvent) => {
  if (panel === 'panel1') {
    panel1IsDragging.value = true
  } else if (panel === 'panel2') {
    panel2IsDragging.value = true
    panel2HandleX.value = event.clientX
  }
}
const handleMousemove = (event: MouseEvent) => {
  if (isNewWidthAllowed(event.clientX, 'panel1')) {
    panel1HandleX.value = event.clientX
    cachedPanel1Width.value = event.clientX - props.offsetLeft
    emit('panelWidthUpdated', { panel: 'panel1', width: panel1Width.value })
  } else if (isNewWidthAllowed(event.clientX, 'panel2')) {
    panel2HandleX.value = event.clientX
    panel2Width.value = event.clientX - props.offsetLeft - panel1Width.value
    emit('panelWidthUpdated', { panel: 'panel2', width: panel2Width.value })
  }
}
const handleMouseup = () => {
  if (panel1IsDragging.value) {
    panel1IsDragging.value = false
    handleResizeEnd('panel1')

    return
  }

  handleResizeEnd('panel2')
  panel2IsDragging.value = false
}

const maxPanel1Width = computed(() => {
  const unavailableWidth = panel2Width.value + props.minPanel3Width + props.offsetLeft

  return props.maxTotalWidth - unavailableWidth
})

const panel1Width = computed(() => {
  if (!props.showPanel1) {
    return 0
  }

  return cachedPanel1Width.value
})

const maxPanel2Width = computed(() => {
  const unavailableWidth = panel1Width.value + props.minPanel3Width + props.offsetLeft

  return props.maxTotalWidth - unavailableWidth
})

function handleResizeEnd (panel: DraggablePanel) {
  emit('resizeEnd', panel)
}

function isNewWidthAllowed (mouseClientX:number, panel: DraggablePanel) {
  if (panel === 'panel1') {
    const newWidth = mouseClientX - props.offsetLeft
    const result = panel1IsDragging.value && newWidth >= props.minPanel1Width && newWidth <= maxPanel1Width.value

    return result
  }

  const newWidth = mouseClientX - props.offsetLeft - panel1Width.value

  return panel2IsDragging.value && newWidth >= props.minPanel2Width && newWidth <= maxPanel2Width.value
}

watchEffect(() => {
  if (!props.showPanel1) {
    emit('panelWidthUpdated', { panel: 'panel1', width: 0 })
  } else if (props.showPanel1) {
    emit('panelWidthUpdated', { panel: 'panel1', width: cachedPanel1Width.value })
  }
})

</script>
