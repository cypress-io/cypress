<template>
  <div class="text-left relative">
    <label
      class="text-gray-800 text-sm my-3 block"
      :class="disabledClass"
    >{{
      props.name
    }}</label>
    <button
      v-click-outside="() => (isOpen = false)"
      class="
        h-10
        text-left
        flex
        justify-between
        items-center
        border-1
        px-2
        py-1
        rounded
        w-full
        focus:border-indigo-600 focus:outline-transparent
      "
      data-cy="select-bundler"
      :class="disabledClass
        + (isOpen ? ' border-indigo-600' : ' border-gray-200')
        + (props.disabled ? ' bg-gray-100 text-gray-800' : '')"
      :disabled="props.disabled"
      @click="
        if (!props.disabled) {
          isOpen = !isOpen;
        }
      "
    >
      <template v-if="selectedOptionObject">
        <img
          :src="FrameworkBundlerLogos[selectedOptionObject.type]"
          class="w-5 h-5 mr-3"
        >
        <span>
          {{ selectedOptionObject.name }}
        </span>
      </template>
      <span
        v-else
        class="text-gray-400"
      >
        {{ props.placeholder }}
      </span>
      <span class="flex-grow" />
      <i-fa-angle-down />
    </button>
    <ul
      v-if="isOpen"
      class="
        w-full
        absolute
        bg-white
        border-1 border-indigo-600 border-t-1 border-t-gray-100
        rounded-b
        flex flex-col
        gap-0
        z-10
      "
      style="margin-top: -3px"
    >
      <li
        v-for="opt in props.options"
        :key="opt.type"
        focus="1"
        class="cursor-pointer flex items-center py-1 px-2 hover:bg-gray-10"
        :data-cy-bundler="opt.type"
        @click="selectOption(opt.type)"
      >
        <img
          :src="FrameworkBundlerLogos[opt.type]"
          class="w-5 h-5 mr-3"
        >
        <span>
          {{ opt.name }}
        </span>
      </li>
    </ul>
  </div>
</template>

<script lang="ts" setup>
import type { Bundler } from '@packages/types/src/constants'
import { computed, ref } from 'vue'
import { ClickOutside as vClickOutside } from '../../directives/ClickOutside'
import type { SupportedBundlers } from '../../generated/graphql'
import { FrameworkBundlerLogos } from '../../utils/icons'

const emit = defineEmits<{
  (event: 'select', type: SupportedBundlers)
}>()

const props = withDefaults(defineProps<{
  name: string
  value?: SupportedBundlers | null
  placeholder?: string
  options: Bundler[] | ReadonlyArray<Bundler>
  disabled?: boolean
}>(), {
  disabled: false,
  value: undefined,
  placeholder: undefined,
})

const isOpen = ref(false)

const selectedOptionObject = computed(() => {
  return props.options.find((opt) => opt.type === props.value)
})

const selectOption = (opt: SupportedBundlers) => {
  emit('select', opt)
}

const disabledClass = computed(() => props.disabled ? 'opacity-50' : undefined)
</script>
