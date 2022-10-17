<template>
  <div
    class="highlight"
    :style="highlightStyle"
  />
  <div
    class="tooltip"
    :style="tooltipStyle"
  >
    <span>{{ selector }}</span>
    <div
      class="arrow"
      :style="arrowStyle"
    />
  </div>
</template>

<script lang="ts" setup>
import type { StyleValue, CSSProperties } from 'vue'

const props = defineProps <{
  selector: string
  style: StyleValue
}>()

const highlightStyle = props.style as CSSProperties || {}
const highlightTop = parseFloat(highlightStyle.top as string)
const highlightLeft = parseFloat(highlightStyle.left as string)
const highlightHeight = parseFloat(highlightStyle.height as string)
const placeOnBottom = highlightTop < 35

const tooltipStyle =
  placeOnBottom
    ? {
      top: `${highlightTop + highlightHeight + 10}px`,
      left: `${highlightLeft}px`,
    }
    : {
      top: `${highlightTop - 33}px`,
      left: `${highlightLeft}px`,
    }

const arrowStyle =
  placeOnBottom
    ? {
      left: `8px`,
      top: `-6px`,
      transform: 'rotate(0deg)',
    }
    : {
      left: `8px`,
      top: `24px`,
      transform: 'rotate(180deg)',
    }
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
