<template>
  <div class="h-64px items-center gap-8px mx-16px border-b-1 border-gray-900 grid grid-cols-[minmax(0,1fr),63px,24px]">
    <div class="relative items-center group">
      <div class="absolute inset-y-0 flex items-center pointer-events-none">
        <MagnifyingGlassIcon
          :class="inputFocused ? 'icon-dark-white' : 'icon-dark-gray-900'"
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
        :value="search"
        @focus="inputFocused = true"
        @blur="inputFocused = false"
        @input="onInput"
      >
    </div>
    <RadioGroup
      :model-value="tab"
      class="flex border-1 border-gray-900 rounded-md h-24px w-64px text-md cursor-pointer"
      @update:model-value="emit('update:tab', $event)"
    >
      <RadioGroupOption
        v-slot="{ checked }"
        as="template"
        value="file-list"
        data-cy="file-list-radio-option"
      >
        <div
          class="flex flex-1 items-center justify-center outline-none"
          :class="{ 'bg-gray-900': checked }"
        >
          <FileTreeIcon
            :class="checked ? 'icon-light-gray-200' : 'icon-light-gray-700'"
          />
        </div>
      </RadioGroupOption>
      <RadioGroupOption
        v-slot="{ checked }"
        as="template"
        value="file-tree"
        data-cy="file-tree-radio-option"
      >
        <div
          class="flex flex-1 items-center justify-center outline-none"
          :class="{ 'bg-gray-900': checked }"
        >
          <FileListIcon
            :class="checked ? 'icon-light-gray-200' : 'icon-light-gray-700'"
          />
        </div>
      </RadioGroupOption>
    </RadioGroup>
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
      <AddSmallIcon class="icon-light-gray-50 icon-dark-gray-200" />
    </button>
  </div>
</template>

<script lang="ts" setup>
import MagnifyingGlassIcon from '~icons/cy/magnifying-glass_x16.svg'
import FileTreeIcon from '~icons/cy/file-tree.svg'
import FileListIcon from '~icons/cy/file-list.svg'
import AddSmallIcon from '~icons/cy/add-small_x16.svg'
import Input from '@cy/components/Input.vue'
import Button from '@cy/components/Button.vue'
import { ref, watch } from 'vue'
import { RadioGroup, RadioGroupOption } from '@headlessui/vue'

defineProps<{tab: string, search: string}>()

const emit = defineEmits<{
  (e: 'update:tab', tab: string): void
  (e: 'update:search', search: string)
  (e: 'addSpec')
}>()

// const selectedTab = ref('file-list')

const inputFocused = ref(false)

const onInput = (e: Event) => {
  const value = (e.target as HTMLInputElement).value

  emit('update:search', value)
}

</script>

<style>
.add-button {
  transition: box-shadow 0.3s ease-in-out;
}

.add-button:hover {
  box-shadow: 0 0 4px rgba(191, 194, 212, 0.6);
}
</style>
