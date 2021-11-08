<template>
  <div class="flex h-64px w-auto items-center gap-8px px-16px">
    <div class="flex-1 relative items-center group">
      <div class="absolute inset-y-0 flex items-center pointer-events-none">
        <MagnifyingGlassIcon
          :class="inputFocused ? 'icon-dark-white' : 'icon-dark-gray-900'"
          class="icon-light-gray-1000"
        />
      </div>
      <input
        class="
          bg-gray-1000
          pl-6
          text-gray-500
          placeholder-gray-700
          font-light
          outline-none
        "
        placeholder="Search Specs"
        @focus="inputFocused = true"
        @blur="inputFocused = false"
      />
    </div>
    <!-- <Input
      placeholder="Search Specs"
      :prefix-icon="MagnifyingGlassIcon"
      input-classes="bg-gray-1000 text-gray-100 border-none text-white"
      prefix-icon-classes="icon-light-gray-1000 icon-dark-gray-700"
      class="flex-1"
    /> -->
    <!-- <Button size="sm" variant="outline" class="border-gray-800 gap-0">
      <template #prefix>
        <component :is="FileTreeIcon" class="icon-light-gray-50 icon-dark-gray-200"></component>
      </template>
    </Button> -->
    <RadioGroup
      :model-value="tab"
      class="flex border-1 border-gray-900 rounded-md h-24px w-64px text-md cursor-pointer"
      @change="$emit('update:tab', $event.target.checked)"
    >
      <RadioGroupOption v-slot="{ checked }" as="template" value="file-list">
        <div
          class="flex flex-1 items-center justify-center outline-none"
          :class="{ 'bg-gray-900': checked }"
        >
          <FileTreeIcon
            :class="checked ? 'icon-light-gray-200' : 'icon-light-gray-700'"
          />
        </div>
      </RadioGroupOption>
      <RadioGroupOption v-slot="{ checked }" as="template" value="file-tree">
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
        wh-24px
        h-24px
        w-24px
        rounded-md
        add-button
        outline-none
        flex
        items-center
        justify-center
      "
    >
      <AddSmallIcon class="icon-light-gray-50 icon-dark-gray-200" />
    </button>
  </div>
</template>

<script lang="ts" setup>
import MagnifyingGlassIcon from "~icons/cy/magnifying-glass_x16.svg";
import FileTreeIcon from "~icons/cy/file-tree.svg";
import FileListIcon from "~icons/cy/file-list.svg";
import AddSmallIcon from "~icons/cy/add-small_x16.svg";
import Input from "@cy/components/Input.vue";
import Button from "@cy/components/Button.vue";
import { ref, watch } from "vue";
import { RadioGroup, RadioGroupOption } from "@headlessui/vue";

const props = defineProps<{tab: string}>()
// watch(() => props.selectedTab, (selectedTab, prevSelectedTab) => {
//   console.log({selectedTab, prevSelectedTab})
// })

const emit = defineEmits<{
  (e: 'update:tab', tab: string): void
}>()

const inputFocused = ref(false);
</script>

<style>
.add-button {
  transition: box-shadow 0.3s ease-in-out;
}

.add-button:hover {
  box-shadow: 0 0 2px rgba(255, 255, 255, 0.4);
}
</style>
