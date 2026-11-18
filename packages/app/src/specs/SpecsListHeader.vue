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
      placeholder="Search specs"
      aria-label="Search specs"
      @input="onInput"
    >
      <template #suffix>
        <button
          v-if="props.modelValue"
          type="button"
          data-cy="clear-search-button"
          class="border-transparent rounded-md flex outline-none h-[24px] mr-[16px] w-[24px] duration-300 items-center justify-center group hocus-default hocus:ring-0 hocus:bg-indigo-50"
          aria-label="Clear search field"
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
              {{ matchesIndicator }}
            </span>
            <span v-else>
              {{ matchesIndicatorEmptyFileSearch }}
            </span>
            <span class="sr-only">View spec pattern </span>
          </span>
        </button>
      </template>
    </Input>

    <div class="flex h-[40px] min-w-[127px] gap-[16px]">
      <Button
        data-cy="new-spec-button"
        class="min-w-[125px]"
        variant="outline-indigo"
        @click="emit('showCreateSpecModal')"
      >
        <IconActionAddMedium class="mr-[8px]" />
        New spec
      </Button>
    </div>
  </div>
</template>

<script lang="ts">
</script>

<script lang="ts" setup>
import { computed } from 'vue'
import type { Ref } from 'vue'
import Button from '@cypress-design/vue-button'
import Input from '@cy/components/Input.vue'
import IconMagnifyingGlass from '~icons/cy/magnifying-glass_x16'
import { IconActionAddMedium } from '@cypress-design/vue-icon'

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

const matchesIndicator = computed(() => {
  return props.specCount === 0 ? 'No matches' : `${props.resultCount} of ${props.specCount} matches`
})

const matchesIndicatorEmptyFileSearch = computed(() => {
  return props.specCount === 0 ? 'No matches' : props.specCount === 1 ? '1 match' : `${props.specCount} matches`
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
