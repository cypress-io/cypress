<template>
  <div class="flex w-full gap-16px relative">
    <Input
      type="search"
      class="flex-grow h-full min-w-200px"
      prefix-icon-classes="icon-light-gray-50 icon-dark-gray-500"
      :prefix-icon="IconMagnifyingGlass"
      :model-value="props.modelValue"
      :placeholder="t('specPage.searchPlaceholder')"
      :aria-label="t('specPage.searchPlaceholder')"
      @input="onInput"
    >
      <template #suffix>
        <button
          class="rounded-r-md outline-none h-38px mr-[-0.75rem] group"
          aria-live="polite"
          @click="emit('showSpecPatternModal')"
        >
          <span
            class="bg-white border-transparent rounded-r flex h-full border-t-1 border-b-1 border-r-1 mr-1px px-16px transition-all items-center matches-button group-hocus:bg-indigo-50 group-hocus:text-indigo-500"
          >
            <span v-if="props.modelValue">
              {{ t('components.fileSearch.matchesIndicator', { count: specCount, denominator: specCount, numerator: resultCount}) }}
            </span>
            <span v-else>
              {{ t('components.fileSearch.matchesIndicatorEmptyFileSearch', { count: specCount, denominator: specCount}) }}
            </span>
            <span class="sr-only">{{ t(`createSpec.viewSpecPatternButton`) }} </span>
          </span>
        </button>
      </template>
    </Input>

    <div class="flex h-40px min-w-127px gap-16px">
      <Button
        data-cy="new-spec-button"
        :prefix-icon="IconAdd"
        prefix-icon-class="justify-center text-lg text-center icon-light-transparent icon-dark-white"
        class="min-w-127px"
        size="lg"
        @click="emit('showCreateSpecModal')"
      >
        {{ t('specPage.newSpecButton') }}
      </Button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useI18n } from '@cy/i18n'
import Button from '@cy/components/Button.vue'
import Input from '@cy/components/Input.vue'
import IconMagnifyingGlass from '~icons/cy/magnifying-glass_x16'
import IconAdd from '~icons/cy/add-large_x16'

const { t } = useI18n()

const props = withDefaults(defineProps<{
  modelValue: string
  resultCount?: number
  specCount?: number
}>(), {
  resultCount: 0,
  specCount: 0,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'showSpecPatternModal'): void
  (e: 'showCreateSpecModal'): void
}>()

const onInput = (e: Event) => {
  const value = (e.target as HTMLInputElement).value

  emit('update:modelValue', value)
}
</script>

<style scoped>

.matches-button:before {
  @apply h-full bg-gray-100 transform transition w-1px
  scale-y-50 duration-150 group-hocus:bg-transparent;
  display: block;
  position: absolute;
  left: 0;
  top: 0;
  content: '';
}
</style>
