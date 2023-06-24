<template>
  <div class="bg-gray-50 flex items-center w-[400px] h-[32px] pr-[16px] border rounded border-gray-100 text-jade-500 relative">
    <component
      :is="prefixIcon"
      class="h-[16px] w-[16px] icon-dark-gray-500 mx-[8px]"
    />
    <button
      v-if="confidential"
      class="absolute right-[8px] focus:outline-transparent"
      @click="localConfidential = !localConfidential"
    >
      <i-cy-eye-open_x16
        v-if="localConfidential"

        class="icon-dark-gray-500"
        aria-label="Record Key Visibility Toggle"
      />
      <i-cy-eye-closed_x16
        v-else
        class="icon-dark-gray-500"
        aria-label="Record Key Visibility Toggle"
      />
    </button>
    <code
      class="text-[14px]"
      :class="{ 'text-gray-500': localConfidential }"
      data-cy="code-box"
    >
      {{ localConfidential ? '*'.repeat(code.length) : code }}
    </code>
  </div>
</template>

<script lang="ts" setup>
import { FunctionalComponent, ref, SVGAttributes } from 'vue'

const props = defineProps<{
  code: string
  prefixIcon: FunctionalComponent<SVGAttributes, {}>
  confidential?: boolean
}>()

const localConfidential = ref(Boolean(props.confidential))
</script>
