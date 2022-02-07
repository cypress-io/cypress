<template>
  <div class="text-left relative">
    <div
      class="font-medium my-8px text-gray-800 leading-24px block"
      :class="{ 'opacity-50': disabled }"
    >
      {{
        name
      }}
    </div>
    <div class="border rounded border-gray-100 p-2px inline-flex">
      <button
        v-for="opt in options"
        :key="opt.type"
        class="border-transparent border-1 py-4px px-12px hocus-default hocus:z-10 hover:bg-indigo-50 focus:outline-none first:rounded-l last:rounded-r"
        :class="opt.type === value ? 'bg-secondary-50 text-secondary-600': 'text-gray-700'"
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
