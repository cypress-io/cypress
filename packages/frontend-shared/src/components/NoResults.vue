<template>
  <div
    v-if="searchTerm || emptySearch"
    data-testid="no-results"
    class="text-center"
  >
    <NoResultsIllustration
      class="mx-auto"
      alt
    />
    <p class="leading-normal text-gray-500 text-[18px]">
      {{ message || t('noResults.defaultMessage') }}
      <span
        v-if="searchTerm"
        class="text-purple-500 truncate"
      >{{ searchTerm }}</span>
    </p>
    <Button
      data-cy="no-results-clear"
      class="mx-auto mt-[20px]"
      size="lg"
      variant="outline"
      @click="emit('clear')"
    >
      <template #prefix>
        <i-cy-delete_x12 class="w-[12px] icon-dark-gray-400" />
      </template>
      {{ t('noResults.clearSearch') }}
    </Button>
  </div>
</template>

<script setup lang="ts">
import Button from './Button.vue'
import { useI18n } from '@cy/i18n'
import NoResultsIllustration from '../assets/illustrations/no-results.svg'

defineProps<{
  searchTerm?: string
  message?: string
  emptySearch?: boolean
}>()

const emit = defineEmits<{
  (e: 'clear'): void
}>()

const { t } = useI18n()

</script>
