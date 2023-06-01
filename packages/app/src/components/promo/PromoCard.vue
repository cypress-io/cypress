<template>
  <div
    class="p-[40px]"
    :class="gridClasses"
  >
    <div>
      <h2 class="text-xl font-semibold text-gray-900">
        {{ title }}
      </h2>
      <p class="text-gray-700">
        {{ body }}
      </p>
      <slot name="content" />
    </div>
    <div class="row-end-[span_2] xl:col-start-2">
      <slot name="image" />
    </div>
    <div class="self-end">
      <slot name="action" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, useSlots } from 'vue'

defineProps<{
  title: string
  body: string
}>()

const slots = useSlots()

const gridClasses = computed(() => {
  const classes = ['grid', 'grid-cols-[480px]', 'gap-y-[16px]']

  // If `content` and `image` are defined then lay out side-by-side on xl viewport,
  // any other combination of slots should flow vertically
  if (slots.image) {
    classes.push('xl:grid-cols-[300px_470px]', 'gap-x-[100px]')
  }

  return classes
})

</script>
