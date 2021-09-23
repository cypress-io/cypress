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
      :class="disabledClass
        + (isOpen ? ' border-indigo-600' : ' border-gray-200')
        + (props.disabled ? ' bg-gray-300 text-gray-600' : '')"
      :disabled="props.disabled"
      @click="
        if (!props.disabled) {
          isOpen = !isOpen;
        }
      "
    >
      <template v-if="selectedOptionObject">
        <img
          :src="FrameworkBundlerLogos[selectedOptionObject.id]"
          class="w-5 h-5 mr-3"
        >
        <span>
          {{ selectedOptionObject.name }}
        </span>
        <span
          v-if="selectedOptionObject.description"
          class="text-gray-400 ml-2"
        >
          {{ selectedOptionObject.description }}
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
        :key="opt.id"
        focus="1"
        class="cursor-pointer flex items-center py-1 px-2 hover:bg-gray-10"
        @click="selectOption(opt)"
      >
        <img
          :src="FrameworkBundlerLogos[opt.id]"
          class="w-5 h-5 mr-3"
        >
        <span>
          {{ opt.name }}
        </span>
        <span
          v-if="opt.description"
          class="text-gray-400 ml-2"
        >
          {{ opt.description }}
        </span>
      </li>
    </ul>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import { ClickOutside as vClickOutside } from '../../directives/ClickOutside'
import { FrameworkBundlerLogos } from '../../utils/icons'

export interface Option {
  name: string;
  description?: string;
  id: string;
}

const emit = defineEmits<{(event: 'select', id: string)
}>()

const props = withDefaults(defineProps<{
  name: string
  value?: string
  placeholder?: string
  options: Readonly<Option[]>
  disabled?: boolean
}>(), {
  disabled: false,
  value: undefined,
  placeholder: undefined,
})

const isOpen = ref(false)

const selectedOptionObject = computed(() => {
  return props.options.find((opt) => opt.id === props.value)
})

const selectOption = (opt: Option) => {
  emit('select', opt.id)
}

const disabledClass = computed(() => props.disabled ? 'opacity-50' : undefined)

</script>
