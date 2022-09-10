<template>
  <div
    ref="reference"
    :class="['assertion-type', { 'single-assertion': !hasOptions }]"
    @click="!hasOptions ? () => addAssertion(type) : null"
    @mouseover="_open"
    @mouseout="_close"
  >
    <div class="assertion-type-text">
      <span>
        {{ type.replace(/\./g, ' ') }}
      </span>
      <span
        v-if="hasOptions"
        class="dropdown-arrow"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="12"
          height="12"
          fill="currentColor"
          viewBox="0 0 16 16"
        >
          <path
            fillRule="evenodd"
            d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"
          />
        </svg>
      </span>
    </div>
  </div>
  <AssertionOptions
    v-if="hasOptions && isOpen"
    :type="type"
    :add-assertion="addAssertion"
    :options="options"
  />
</template>

<script lang="ts" setup>
import { defineComponent } from 'vue'
import AssertionOptions from './AssertionOptions.ce.vue'

const props = defineProps<{
  type: string
  addAssertion: any
  options: any
}>()

const hasOptions = props.options && !!props.options.length
</script>

<script lang="ts">
export default defineComponent({
  data () {
    return {
      isOpen: false,
    }
  },

  methods: {
    _open () {
      this.isOpen = true
    },

    _close (e) {
      const popperEl = this.$refs.popper as HTMLElement

      if (popperEl && popperEl.contains(e.relatedTarget)) {
        return
      }

      this.isOpen = false
    },
  },
})
</script>
