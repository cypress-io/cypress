<template>
  <div class="relative flex w-full gap-16px">
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
          class="mr-[-0.75rem] h-40px outline-none hover:(bg-indigo-50 text-indigo-500) transition-all rounded-r-md group"
          aria-live="polite"
          @click="emit('showSpecPatternModal')"
        >
          <span
            class="block border-l h-24px px-16px border-l-gray-100 group-hover:border-none"
          >
            {{ resultCount }} {{ resultCount === 1 ? t('specPage.matchSingular') : t('specPage.matchPlural') }}
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
}>(), {
  resultCount: 0,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void,
  (e: 'showSpecPatternModal'): void
  (e: 'showCreateSpecModal'): void
}>()

const onInput = (e: Event) => {
  const value = (e.target as HTMLInputElement).value

  emit('update:modelValue', value)
}
</script>
