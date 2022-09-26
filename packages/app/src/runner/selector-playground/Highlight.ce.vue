<template>
  <div
    ref="highlightRef"
    class="highlight"
    :style="style"
  />
  <div
    ref="tooltipRef"
    class="tooltip"
  >
    <span>{{ selector }}</span>
    <div
      ref="arrow"
      class="arrow"
    />
  </div>
</template>

<script lang="ts" setup>
import { computePosition, flip, offset, arrow } from '@floating-ui/dom'
import { StyleValue, onMounted, nextTick, ref, Ref } from 'vue'

defineProps <{
  selector: string
  style: StyleValue
}>()

const highlightRef: Ref<HTMLElement | null> = ref(null)
const tooltipRef: Ref<HTMLElement | null> = ref(null)

onMounted(() => {
  nextTick(() => {
    const ref = highlightRef.value as HTMLElement
    const tooltip = tooltipRef.value as HTMLElement
    const arrowEl = tooltip.querySelector('.arrow') as HTMLElement

    computePosition(ref, tooltip, {
      placement: 'top-start',
      middleware: [flip(), offset(6), arrow({ element: arrowEl })],
    }).then(({ x, y, placement }) => {
      Object.assign(tooltip.style, {
        left: `${x}px`,
        top: `${y}px`,
      })

      Object.assign(arrowEl.style, {
        left: `8px`,
        top: placement === 'top-start' ? `24px` : `-6px`,
        transform: placement === 'top-start' ? 'rotate(180deg)' : 'rotate(0deg)',
      })
    })
  })
})
</script>

<style>
.highlight {
  background: rgba(159, 196, 231, 0.6);
  border: solid 2px #9FC4E7;
  cursor: pointer;
}
.tooltip {
  position: absolute;
  background: #333;
  border: solid 1px #333;
  border-radius: 3px;
  color: #e3e3e3;
  font-size: 12px;
  padding: 4px 6px;
  text-align: center;
}
.arrow {
  position: absolute;
  width: 0;
  height: 0;
  border-style: solid;
  border-width: 0 6px 6px 6px;
  border-color: transparent transparent #333 transparent;
}
</style>
