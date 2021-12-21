<template>
  <div class="flex w-full gap-16px relative">
    <Input
      type="search"
      class="flex-grow h-full min-w-200px"
      prefix-icon-classes="icon-light-gray-50 icon-dark-gray-500"
      :prefix-icon="IconMagnifyingGlass"
      :model-value="props.modelValue"
      :placeholder="t('specPage.searchPlaceholder')"
      @input="onInput"
    >
      <template #suffix>
        <div
          class="text-gray-500 border-l border-l-gray-100 pl-16px"
          aria-live="polite"
        >
          {{ resultCount }} {{ resultCount === 1 ? t('specPage.matchSingular') : t('specPage.matchPlural') }}
        </div>
      </template>
    </Input>

    <div class="flex h-40px gap-16px min-w-127px">
      <Button
        data-cy="new-spec-button"
        :prefix-icon="IconAdd"
        prefix-icon-class="justify-center text-lg text-center icon-light-transparent icon-dark-white"
        class="min-w-127px"
        size="lg"
        @click="emit('newSpec')"
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
  (e: 'newSpec'): void
}>()

const onInput = (e: Event) => {
  const value = (e.target as HTMLInputElement).value

  emit('update:modelValue', value)
}
</script>
