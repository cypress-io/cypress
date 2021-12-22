<template>
  <Select
    :model-value="selectedOptionObject"
    :placeholder="props.placeholder"
    :options="props.options"
    item-value="name"
    @update:model-value="selectOption"
  >
    <template #label>
      <div class="my-8px text-16px leading-24px">
        {{ props.label }}
      </div>
    </template>
    <template
      v-if="value"
      #input-prefix="{ value: itemValue }"
    >
      <component
        :is="FrameworkBundlerLogos[itemValue?.type]"
        class="h-16px w-16px"
      />
    </template>

    <template #item-prefix="{ value: itemValue }">
      <component
        :is="FrameworkBundlerLogos[itemValue?.type]"
        class="h-16px w-16px"
      />
    </template>
  </Select>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { FrameworkBundlerLogos } from '../utils/icons'
import Select from '@cy/components/Select.vue'
import type {
  FrontendFrameworkEnum,
  SupportedBundlers,
} from '../generated/graphql'

export interface Option {
  name: string;
  description?: string;
  id: string;
  type?: string
  isSelected?: boolean
  disabled?: boolean
}

const props = withDefaults(defineProps<{
  value?: string
  placeholder?: string
  options: readonly Option[]
  label?: string
  selectorType: 'framework' | 'bundler'
}>(), {
  value: undefined,
  placeholder: undefined,
  label: undefined,
})

const emit = defineEmits<{
  (event: 'selectFramework', type: FrontendFrameworkEnum)
  (event: 'selectBundler', type: SupportedBundlers)
}>()

const selectedOptionObject = computed(() => {
  return props.options.find((opt) => opt.type === props.value)
})

const selectOption = (opt) => {
  if (props.selectorType === 'framework') {
    emit('selectFramework', opt.type)
  } else {
    emit('selectBundler', opt.type)
  }
}

</script>
