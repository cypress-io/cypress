<template>
  <div class="h-64px items-center gap-8px mx-16px border-b-1 border-gray-900 grid grid-cols-[minmax(0,1fr),24px]">
    <div class="relative items-center group">
      <div class="absolute inset-y-0 flex items-center pointer-events-none">
        <i-cy-magnifying-glass_x16
          :class="inputFocused ? 'icon-dark-gray-200' : 'icon-dark-gray-900'"
          class="icon-light-gray-1000"
        />
      </div>
      <input
        id="inline-spec-list-header-search"
        class="
          w-full
          bg-gray-1000
          pl-6
          text-gray-500
          placeholder-gray-700
          font-light
          border-none
        "
        :value="props.search"
        minlength="1"
        type="search"
        :spellcheck="false"
        autocomplete="off"
        @focus="inputFocused = true"
        @blur="inputFocused = false"
        @input="onInput"
      >
      <label
        for="inline-spec-list-header-search"
        class="search-label absolute left-24px bottom-6px text-gray-300 pointer-events-none font-light"
        :class="{
          'opacity-0': inputFocused || props.search.length
        }"
      >
        {{ t('specPage.searchPlaceholder') }}
      </label>
    </div>
    <button
      class="
        border-1 border-gray-900
        h-24px
        w-24px
        rounded-md
        add-button
        outline-none
        flex
        items-center
        justify-center
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

const onInput = (e: Event) => {
  const value = (e.target as HTMLInputElement).value

  emit('update:search', value)
}

</script>

<style>
/** Windi box shadows are dark, so styles are for lighter box shadows */
.add-button {
  transition: box-shadow 0.3s ease-in-out;
}

.add-button:hover {
  box-shadow: 0 0 4px rgba(191, 194, 212, 0.6);
}

input[type="search"]::-webkit-search-decoration,
input[type="search"]::-webkit-search-cancel-button,
input[type="search"]::-webkit-search-results-button,
input[type="search"]::-webkit-search-results-decoration { display: none !important; }
</style>
