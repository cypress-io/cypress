<template>
  <div
    class="border-b border-gray-900 h-[64px] mx-[16px] auto-cols-max grid grid-flow-col gap-[8px] grid-cols-[minmax(0,1fr)] pointer-cursor items-center"
  >
    <div
      class="relative items-center"
      @click="input?.focus()"
    >
      <div class="flex h-full inset-y-0 w-[32px] absolute items-center pointer-events-none">
        <i-cy-magnifying-glass_x16
          :class="inputFocused ? 'icon-dark-indigo-300' : 'icon-dark-gray-800'"
          class="icon-light-gray-1000"
        />
      </div>
      <input
        id="inline-spec-list-header-search"
        ref="input"
        class="font-light outline-none bg-gray-1000 border-0 px-6 placeholder-gray-700 text-gray-500"
        :class="inputFocused || props.specFilterModel.length ? 'w-full' : 'w-[16px]'"
        :value="props.specFilterModel"
        type="search"
        minlength="1"
        autocapitalize="off"
        autocomplete="off"
        spellcheck="false"
        @focus="inputFocused = true"
        @blur="inputFocused = false"
        @input="onInput"
      >
      <label
        for="inline-spec-list-header-search"
        class="cursor-text font-light bottom-[4px] left-[24px] text-gray-500 pointer-events-none absolute"
        :class="{
          'sr-only': inputFocused || props.specFilterModel
        }"
      >
        {{ t('specPage.searchPlaceholder') }}
      </label>
      <button
        v-if="props.specFilterModel"
        type="button"
        data-cy="clear-search-button"
        class="border-transparent rounded-md flex outline-none h-[24px] my-[4px] inset-y-0 right-0 w-[24px] duration-300 absolute items-center justify-center group hocus-default hocus:ring-0"
        :aria-label="t('specPage.clearSearch')"
        @click.stop="clearInput"
      >
        <i-cy-delete_x16
          class="icon-light-gray-1000 group-hocus:icon-dark-indigo-300"
          :class="inputFocused ? 'icon-dark-indigo-300' : 'icon-dark-gray-800'"
        />
      </button>
    </div>
    <Tooltip
      placement="right"
      data-cy="tooltip"
    >
      <button
        class="rounded-md flex outline-none border border-gray-900 h-[24px] w-[24px] duration-300 hocus-default items-center justify-center hocus:ring-0 hocus:border-indigo-300"
        :aria-label="t('specPage.newSpecButton')"
        @click="emit('newSpec')"
      >
        <i-cy-add-small_x16 class="icon-light-gray-50 icon-dark-gray-200" />
      </button>
      <template
        #popper
      >
        <span
          class="inline-flex text-sm font-normal"
          data-cy="tooltip-content"
        >
          {{ t('specPage.newSpecButton') }}
        </span>
      </template>
    </Tooltip>
    <InlineRunAllSpecs
      v-if="isRunAllSpecsAllowed"
      :spec-number="runAllSpecsStore.allSpecsRef.length"
      directory="all"
      grayscale
      class="rounded-md flex outline-none border border-gray-900 h-[24px] w-[24px] duration-300 hocus-default items-center justify-center hocus:ring-0 hocus:border-indigo-300"
      @runAllSpecs="emit('runAllSpecs')"
    />
    <div
      class="sr-only"
      aria-live="polite"
    >
      {{ t('components.fileSearch.matchesIndicatorEmptyFileSearch', { count: resultCount, denominator: resultCount}) }}
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { useI18n } from '@cy/i18n'
import InlineRunAllSpecs from './InlineRunAllSpecs.vue'
import Tooltip from '@packages/frontend-shared/src/components/Tooltip.vue'
import { useRunAllSpecsStore } from '../store/run-all-specs-store'

const { t } = useI18n()
const props = defineProps<{
  specFilterModel: string
  resultCount: number
  isRunAllSpecsAllowed: boolean
}>()

const emit = defineEmits<{
  (e: 'update:specFilterModel', specFilterModel: string): void
  (e: 'newSpec'): void
  (e: 'runAllSpecs'): void
}>()

const runAllSpecsStore = useRunAllSpecsStore()

const inputFocused = ref(false)
const input = ref<HTMLInputElement>()

const onInput = (e: Event) => {
  const value = (e.target as HTMLInputElement).value

  emit('update:specFilterModel', value)
}

const clearInput = (e: Event) => {
  emit('update:specFilterModel', '')
}
</script>

<style scoped>
::-webkit-search-cancel-button{
    display: none;
}
</style>
