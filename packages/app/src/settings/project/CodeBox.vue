<template>
  <div class="border rounded flex bg-gray-50 border-gray-100 h-32px pr-16px text-jade-500 w-400px items-center relative">
    <component
      :is="prefixIcon"
      class="h-16px mx-8px w-16px icon-dark-gray-500"
    />
    <button
      v-if="confidential"
      class="right-8px absolute focus:outline-transparent"
      @click="localConfidential = !localConfidential"
    >
      <i-cy-eye-open_x16
        v-if="localConfidential"

        class="icon-dark-gray-500"
        :aria-label="`${title} Visibility Toggle`"
      />
      <i-cy-eye-closed_x16
        v-else
        class="icon-dark-gray-500"
        :aria-label="`${title} Visibility Toggle`"
      />
    </button>
    <code
      class="text-size-14px"
      :class="{ 'text-gray-500': localConfidential }"
    >
      {{ localConfidential ? '*'.repeat(code.length) : code }}
    </code>
  </div>
</template>

<script lang="ts" setup>
import { FunctionalComponent, ref, SVGAttributes } from 'vue'

const props = defineProps<{
  code: string,
  title: string,
  prefixIcon: FunctionalComponent<SVGAttributes, {}>,
  confidential?: boolean
}>()

const localConfidential = ref(Boolean(props.confidential))
</script>
