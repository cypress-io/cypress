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
      @click="e => _click(e, name, value)"
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
    _click (e, name, value) {
      this.addAssertion(this.type, name, value)
      e.stopPropagation()
    },
  },
})
</script>

<style lang="scss">
@import './assertions-style.scss';

.assertion-options {
  @include menu-style;

  font-size: 14px;
  max-width: 150px;
  overflow: hidden;
  overflow-wrap: break-word;

  .assertion-option {
    cursor: pointer;
    padding: 0.4rem 0.6rem;

    &:hover {
      background-color: #e9ecef;
    }

    .assertion-option-value {
      font-weight: 600;
    }
  }
}
</style>
