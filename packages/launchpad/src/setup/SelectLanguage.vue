<template>
  <div class="text-left relative">
    <div
      class="font-medium mt-14px mb-10px text-gray-800 block"
      :class="{ 'opacity-50': disabled }"
    >
      {{
        name
      }}
    </div>
    <div class="border rounded border-gray-100 p-3px gap-1 inline-flex">
      <button
        v-for="opt in options"
        :key="opt.type"
        class="border-transparent rounded-sm border-1 py-4px px-12px hocus-default focus:outline-none"
        :class="opt.id === value ? 'bg-secondary-50 text-secondary-600': 'text-gray-700'"
        @click="() => selectOption(opt.type)"
      >
        {{ opt.name }}
      </button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { EnvironmentSetupFragment, CodeLanguageEnum } from '../generated/graphql'

const emit = defineEmits<{
  (event: 'select', type: CodeLanguageEnum)
}>()

const props = withDefaults(defineProps<{
  name: string
  value: string
  options: EnvironmentSetupFragment['allLanguages']
  disabled?: boolean
}>(), {
  disabled: false,
})

const selectOption = (opt: CodeLanguageEnum) => {
  emit('select', opt)
}

</script>
