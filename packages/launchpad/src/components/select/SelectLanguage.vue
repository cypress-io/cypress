<template>
  <div class="text-left relative">
    <label
      class="text-gray-800 text-sm my-3 block"
      :class="{ 'opacity-50': disabled }"
    >
      {{
        name
      }}
    </label>
    <div class="inline-flex gap-1 border border-gray-200 rounded p-1">
      <button
        v-for="opt in options"
        :key="opt.type"
        class="px-2 py-1 rounded-sm focus:outline-secondary-600"
        :class="opt.id === value ? 'bg-secondary-50 text-secondary-600': 'text-gray-700'"
        @click="() => selectOption(opt.type)"
      >
        {{ opt.name }}
      </button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { EnvironmentSetupFragment, CodeLanguageEnum } from '../../generated/graphql'

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
