<template>
  <Select
    :model-value="selectedOptionObject"
    :placeholder="props.placeholder"
    :options="props.options"
    item-value="name"
    @update:model-value="selectOption"
  >
    <template #label>
      <div class="mt-18px mb-11px text-16px">
        {{ props.label }}
      </div>
    </template>
    <template
      v-if="value"
      #input-prefix="{ value: itemValue }"
    >
      <img
        class="w-16px"
        :src="FrameworkBundlerLogos[itemValue?.type]"
      >
    </template>

    <template #item-prefix="{ value: itemValue }">
      <img
        class="w-16px"
        :src="FrameworkBundlerLogos[itemValue?.type]"
      >
    </template>
  </Select>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import type { EnvironmentSetupFragment, FrontendFrameworkEnum, SupportedBundlers } from '../generated/graphql'
import { FrameworkBundlerLogos } from '../utils/icons'
import Select from '@cy/components/Select.vue'

export interface Option {
  name: string;
  description?: string;
  id: string;
}

const emit = defineEmits<{
  (event: 'select', type: string)
}>()

const props = withDefaults(defineProps<{
  name: string
  value?: string
  placeholder?: string
  options: EnvironmentSetupFragment['frameworks']
  disabled?: boolean
  label?: string
}>(), {
  disabled: false,
  value: undefined,
  placeholder: undefined,
  label: undefined,
})

const selectedOptionObject = computed(() => {
  return props.options.find((opt) => opt.id === props.value)
})

const selectOption = (opt) => {
  emit('select', opt.type)
}

</script>
