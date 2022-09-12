<template>
  <div
    ref="popper"
    class="assertion-options"
    :style="{ position: 'absolute' }"
  >
    <div
      v-for="{ name, value } in options"
      :key="`${name}${value}`"
      class="assertion-option"
      @click="_click(name, value)"
    >
      <span
        v-if="name"
        class="assertion-option-name"
      >
        {{ _truncate(name) }}:{{ ' ' }}
      </span>
      <span
        v-else
        class="assertion-option-value"
      >
        {{ _truncate(value) }}
      </span>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computePosition } from '@floating-ui/dom'
import { defineComponent } from 'vue'

defineProps<{
  type: string
  addAssertion: any
  options: any
}>()

const _truncate = (str) => {
  if (str && str.length > 80) {
    return `${str.substr(0, 77)}...`
  }

  return str
}
</script>

<script lang="ts">
export default defineComponent({
  mounted () {
    this.$nextTick(() => {
      const popper = this.$refs.popper as HTMLElement
      const reference = popper.previousElementSibling as HTMLElement

      computePosition(reference, popper, {
        placement: 'right-start',
        middleware: [],
      }).then(({ x, y }) => {
        Object.assign(popper.style, {
          left: `${x}px`,
          top: `${y}px`,
        })
      })
    })
  },

  methods: {
    _click (name, value) {
      this.addAssertion(this.type, name, value)
    },
  },
})
</script>
