<template>
  <div
    v-if="search || emptySearch"
    data-testid="no-results"
    class="text-center"
  >
    <NoResultsIllustration
      class="mx-auto"
      alt
    />
    <p class="text-gray-500 text-18px leading-normal">
      {{ message || t('noResults.defaultMessage') }}
      <span
        v-if="search"
        class="block truncate text-purple-500"
      >{{ search }}</span>
    </p>
    <Button
      data-cy="no-results-clear"
      class="mx-auto mt-20px"
      size="lg"
      variant="outline"
      @click="emit('clear')"
    >
      <template #prefix>
        <i-cy-delete_x12 class="w-12px icon-dark-gray-400" />
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
  search?: string,
  message?: string
  emptySearch?: boolean
}>()

const emit = defineEmits<{
  (e: 'clear'): void
}>()

const { t } = useI18n()

</script>
