<template>
  <Select
    :model-value="selectedOptionObject"
    :placeholder="props.placeholder"
    :options="props.options"
    item-key="id"
    :label-id="props.selectorType"
    @update:model-value="selectOption"
  >
    <template #label>
      <div class="mt-[16px] mb-[8px] text-[16px] leading-[24px]">
        <span :id="props.selectorType">
          {{ props.label }}
        </span>
        <span
          v-if="props.description"
          class="ml-[4px] text-gray-500"
        >
          {{ props.description }}
        </span>
      </div>
    </template>
    <template
      v-if="value"
      #input-prefix="{ value: itemValue }"
    >
      <component
        :is="FrameworkBundlerLogos[itemValue?.type]"
        v-if="!itemValue?.icon"
        class="h-[16px] w-[16px]"
      />
      <div
        v-else
        class="h-[16px] w-[16px]"
        v-html="itemValue.icon"
      />
    </template>

    <template #selected>
      <span class="text-gray-800 inline-block">
        {{ selectedOptionName }}
      </span>
      <AlphaLabel v-if="selectedFrameworkOptionObject?.supportStatus === 'alpha'" />
      <CommunityLabel v-if="selectedFrameworkOptionObject?.supportStatus === 'community'" />
      <span
        v-if="isDetected"
        class="ml-[4px] text-gray-400 inline-block"
      >
        {{ t('setupPage.projectSetup.detected') }}
      </span>
    </template>

    <template #item-body="{ value: itemValue }">
      <span class="text-gray-800 inline-block">
        {{ itemValue.name }}
      </span>
      <AlphaLabel v-if="itemValue.supportStatus === 'alpha'" />
      <CommunityLabel v-else-if="itemValue.supportStatus === 'community'" />
      <span
        v-if="itemValue.isDetected"
        class="ml-[4px] text-gray-400 inline-block"
      >
        {{ t('setupPage.projectSetup.detected') }}
      </span>
    </template>
    <template #item-prefix="{ value: itemValue }">
      <component
        :is="FrameworkBundlerLogos[itemValue?.type]"
        v-if="!itemValue?.icon"
        class="h-[16px] w-[16px]"
      />
      <div
        v-else
        class="h-[16px] w-[16px]"
        v-html="itemValue.icon"
      />
    </template>
    <template
      v-if="selectorType === 'framework'"
      #footer
    >
      <FrameworkOptionsFooter />
    </template>
  </Select>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { FrameworkBundlerLogos } from '@packages/frontend-shared/src/utils/icons'
import type { Option, FrameworkOption } from './types'
import Select from '@cy/components/Select.vue'
import type {
  SupportedBundlers,
} from '../generated/graphql'
import { useI18n } from '@cy/i18n'
import AlphaLabel from './AlphaLabel.vue'
import CommunityLabel from './CommunityLabel.vue'
import FrameworkOptionsFooter from './FrameworkOptionsFooter.vue'

const { t } = useI18n()

const props = withDefaults(defineProps<{
  value?: string
  placeholder?: string
  options: readonly Option[]
  label?: string
  description?: string
  selectorType: 'framework' | 'bundler'
}>(), {
  value: undefined,
  placeholder: undefined,
  label: undefined,
  description: undefined,
})

const emit = defineEmits<{
  (event: 'selectFramework', type: string)
  (event: 'selectBundler', type: SupportedBundlers)
}>()

const selectedOptionObject = computed(() => {
  return props.options.find((opt) => opt.type === props.value)
})

const selectedFrameworkOptionObject = computed(() => {
  const found = props.options.find((opt) => opt.type === props.value)

  return found ? found as FrameworkOption : undefined
})

const selectedOptionName = ref(selectedOptionObject.value?.name || '')
const isDetected = ref(selectedOptionObject.value?.isDetected)

watch(selectedOptionObject, () => {
  if (selectedOptionObject.value) {
    selectedOptionName.value = selectedOptionObject.value.name
    isDetected.value = selectedOptionObject.value.isDetected
  }
})

const selectOption = (opt) => {
  selectedOptionName.value = opt.name
  isDetected.value = opt.isDetected
  if (props.selectorType === 'framework') {
    emit('selectFramework', opt.type)
  } else {
    emit('selectBundler', opt.type)
  }
}
</script>
