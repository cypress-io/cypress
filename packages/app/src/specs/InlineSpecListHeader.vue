<template>
  <div
    class="border-b-1 border-gray-900 h-64px mx-16px grid gap-8px grid-cols-[minmax(0,1fr),24px] pointer-cursor items-center"
  >
    <div
      class="cursor-pointer relative items-center group"
      @click="input.focus()"
    >
      <div
        class="flex h-full inset-y-0 w-32px absolute items-center"
        @mousedown.prevent.stop
      >
        <i-cy-magnifying-glass_x16
          :class="inputFocused ? 'icon-dark-indigo-300' : 'icon-dark-gray-700'"
          class="icon-light-gray-1000"
        />
      </div>
      <input
        id="inline-spec-list-header-search"
        ref="input"
        class="
          font-light
          outline-none
          bg-gray-1000
          border-0
          pl-6
          placeholder-gray-700
          font-light
          border-none
          text-gray-500
        "
        :class="inputFocused || props.search.length ? 'w-full' : 'w-16px'"
        :value="props.search"
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
        class="search-label absolute left-24px bottom-6px text-gray-700 pointer-events-none font-light select-none cursor-pointer"
        :class="{
          'hidden': inputFocused || props.search.length
        }"
      >
        {{ t('specPage.searchPlaceholder') }}
      </label>
    </div>
    <button
      tabindex="-1"
      class="
        rounded-md flex
        outline-none
        border-1
        border-gray-900
        h-24px
        w-24px
        duration-300
        hocus-default
        items-center
        justify-center
        hocus:ring-0
        hocus:border-indigo-300
      "
      :aria-label="t('specPage.newSpecButton')"
      @click="emit('addSpec')"
    >
      <i-cy-add-small_x16 class="icon-light-gray-50 icon-dark-gray-200" />
    </button>
    <div
      class="sr-only"
      aria-live="polite"
    >
      {{ resultCount }} {{ resultCount === 1 ? t('specPage.matchSingular') : t('specPage.matchPlural') }}
    </div>
  </div>
</template>

<script lang="ts" setup>
import Input from '@cy/components/Input.vue'
import Button from '@cy/components/Button.vue'
import { ref } from 'vue'
import { useI18n } from '@cy/i18n'

const { t } = useI18n()
const props = defineProps<{
  search: string
  resultCount: number
}>()

const emit = defineEmits<{
  (e: 'update:search', search: string): void
  (e: 'addSpec'): void
}>()

const inputFocused = ref(false)
const input = ref()

const onInput = (e: Event) => {
  const value = (e.target as HTMLInputElement).value

  emit('update:search', value)
}

</script>

<style scoped>
::-webkit-search-cancel-button{
    display: none;
}

input[type="search"]::-webkit-search-decoration,
input[type="search"]::-webkit-search-cancel-button,
input[type="search"]::-webkit-search-results-button,
input[type="search"]::-webkit-search-results-decoration { display: none !important; }
</style>
