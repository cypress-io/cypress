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
        class="
          w-full
          bg-gray-1000
          pl-6
          text-gray-500
          placeholder-gray-700
          font-light
          outline-none
        "
        placeholder="Search Specs"
        :value="props.search"
        @focus="inputFocused = true"
        @blur="inputFocused = false"
        @input="onInput"
      >
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
      data-cy="runner-spec-list-add-spec"
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
</style>
