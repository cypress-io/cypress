<template>
  <div class="flex w-full gap-[16px] relative">
    <Input
      id="spec-filter"
      :input-ref="props.specsListInputRefFn"
      type="search"
      class="grow h-full min-w-[200px]"
      prefix-icon-classes="icon-light-gray-50 icon-dark-gray-500"
      :prefix-icon="IconMagnifyingGlass"
      :model-value="props.modelValue"
      :placeholder="t('specPage.searchPlaceholder')"
      :aria-label="t('specPage.searchPlaceholder')"
      @input="onInput"
    >
      <template #suffix>
        <button
          v-if="props.modelValue"
          type="button"
          data-cy="clear-search-button"
          class="border-transparent rounded-md flex outline-none h-[24px] mr-[16px] w-[24px] duration-300 items-center justify-center group hocus-default hocus:ring-0 hocus:bg-indigo-50"
          :aria-label="t('specPage.clearSearch')"
          @click="clearInput"
        >
          <i-cy-delete_x16 class="icon-light-gray-50 icon-dark-gray-500 group-hocus:icon-dark-indigo-500" />
        </button>
        <button
          class="rounded-r-md outline-none h-[38px] mr-[-0.75rem] group relative"
          aria-live="polite"
          @click="emit('showSpecPatternModal')"
        >
          <span
            class="bg-white border-transparent rounded-r flex h-full border-t border-b border-r mr-[1px] px-[16px] transition-all items-center matches-button group-hocus:bg-indigo-50 group-hocus:text-indigo-500"
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

    <div class="flex h-[40px] min-w-[127px] gap-[16px]">
      <Button
        data-cy="new-spec-button"
        :prefix-icon="IconAdd"
        prefix-icon-class="justify-center text-lg text-center icon-light-transparent icon-dark-white"
        class="min-w-[134px]"
        size="lg"
        @click="emit('showCreateSpecModal')"
      >
        {{ t('specPage.newSpecButton') }}
      </Button>
      <div class="flex h-[40px] min-w-[127px] gap-[16px]">
        <Button
          data-cy="new-spec-button"
          :prefix-icon="IconExport"
          prefix-icon-class="justify-center text-lg text-center icon-light-transparent icon-dark-white"
          class="min-w-[134px]"
          size="lg"
          @click="() => executeSystemNotificationMutation('Hi! Notification triggered from App', 'Clicking this notification will focus the active browser window')"
        >
          Trigger Notification
        </Button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
</script>

<script lang="ts" setup>
import type { Ref } from 'vue'
import { gql, useMutation } from '@urql/vue'
import { useI18n } from '@cy/i18n'
import Button from '@cy/components/Button.vue'
import Input from '@cy/components/Input.vue'
import IconMagnifyingGlass from '~icons/cy/magnifying-glass_x16'
import IconAdd from '~icons/cy/add-large_x16'
import IconExport from '~icons/cy/export_x16.svg'
import { ShowSystemNotificationDocument } from '../generated/graphql'

const { t } = useI18n()

gql`
mutation ShowSystemNotification($title: String!, $body: String) {
  showSystemNotification(title: $title, body: $body)
}
`

const showSystemNotification = useMutation(ShowSystemNotificationDocument)

const executeSystemNotificationMutation = (title: string, body: string) => {
  showSystemNotification.executeMutation({ title, body })
}

const props = withDefaults(defineProps<{
  modelValue: string
  resultCount?: number
  specCount?: number
  specsListInputRefFn?: () => Ref<HTMLInputElement | undefined>
}>(), {
  resultCount: 0,
  specCount: 0,
  specsListInputRefFn: undefined,
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

const clearInput = (e: Event) => {
  emit('update:modelValue', '')
}
</script>

<style scoped>

.matches-button:before {
  @apply h-full bg-gray-100 transform transition w-[1px]
  scale-y-50 duration-150 group-hocus:bg-transparent;
  display: block;
  position: absolute;
  left: 0;
  top: 0;
  content: '';
}
</style>
