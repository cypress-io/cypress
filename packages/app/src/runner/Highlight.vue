<template>
  <div
    id="highlight"
    ref="ref"
    :style="style"
    @mouseenter="mouseenter"
    @mouseleave="mouseleave"
  />
  <div
    v-if="show"
    id="tooltip"
    ref="tooltip"
  >
    {{ selector }}
    <div
      id="arrow"
      ref="arrow"
    />
  </div>
</template>

<script lang="ts">
import { computePosition, flip, offset, arrow } from '@floating-ui/dom'
import type { StyleValue } from 'vue'

export default {
  data () {
    return {
      show: false,
    }
  },
  methods: {
    mouseenter () {
      this.show = true

      setTimeout(() => {
        const ref = this.$refs.ref as HTMLElement
        const tooltip = this.$refs.tooltip as HTMLElement
        const arrowEl = this.$refs.arrow as HTMLElement

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
            top: placement === 'top-start' ? `26px` : `-6px`,
            transform: placement === 'top-start' ? 'rotate(180deg)' : 'rotate(0deg)',
          })
        })
      }, 0)
    },

    mouseleave () {
      this.show = false
    },
  },
}
</script>

<script lang="ts" setup>
withDefaults(defineProps <{
  selector: string
  style: StyleValue
}>(), {})
</script>

<style lang="scss">
#highlight {
  background: rgba(159, 196, 231, 0.6);
  border: solid 2px #9FC4E7;
  cursor: pointer;
}

#tooltip {
  // initial position
  top: -10000px;
  left: -10000px;

  position: absolute;
  background: #333;
  border: solid 1px #333;
  border-radius: 3px;
  color: #e3e3e3;
  font-size: 12px;
  padding: 4px 6px;
  text-align: center;
}

#arrow {
  position: absolute;
  width: 0;
  height: 0;
  border-style: solid;
  border-width: 0 6px 6px 6px;
  border-color: transparent transparent #333 transparent;
}
</style>
