<template>
  <teleport
    to="#tooltip-target"
  >
    <div
      class="bg-gray-1000 text-gray-50 rounded
                  absolute left-64px
                  w-160px p-8px px-16px mx-16px
                  text-center
                  leading-24px text-size-16px
                  content
                  before:block before:absolute before:right-full before:top-12px
                  before:border-solid before:border-transparent
                  before:border-width-8px before:border-transparent before:border-r-gray-900 before:border-l-0
                  need-content"
      :style="`top: ${tooltipTop}px`"
    >
      <slot>
        {{ name }}
      </slot>
    </div>
  </teleport>
</template>

<script lang="ts" setup>import { useSlots } from 'vue-demi'

defineProps<{
  tooltipTop: number,
  name?: string
}>()
</script>

<style lang="scss" scoped>
// This issue needs this line
// https://github.com/windicss/windicss/issues/419
.need-content:before{
  content: ''
}
</style>
