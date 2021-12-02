<template>
  <div class="text-left relative">
    <label
      class="font-medium mt-14px mb-10px text-gray-800 block"
      :class="disabledClass"
    >{{
      props.name
    }}</label>
    <button
      v-click-outside="() => (isOpen = false)"
      class="
        rounded
        flex
        border-1
        h-10
        text-left
        w-full
         py-8px px-16px
        justify-between
        items-center
        focus:outline-transparent focus:border-indigo-600
      "
      data-cy="select-bundler"
      :class="disabledClass
        + (isOpen ? ' border-indigo-600' : ' border-gray-100')
        + (props.disabled ? ' bg-gray-50 text-gray-800' : '')"
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
          class="h-16px pr-8px"
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
        bg-white
        rounded-b
        flex
        flex-col border-1 border-indigo-600 border-t-1
        border-t-gray-100
        w-full z-10
        gap-0
        absolute
      "
      style="margin-top: -3px"
    >
      <li
        v-for="opt in props.options"
        :key="opt.type"
        focus="1"
        class="cursor-pointer flex py-8px px-16px items-center hover:bg-gray-10"
        :data-cy-bundler="opt.type"
        @click="selectOption(opt.type)"
      >
        <img
          :src="FrameworkBundlerLogos[opt.type]"
          class="h-16px pr-8px"
        >
        <span>
          {{ opt.name }}
        </span>
      </li>
    </ul>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import { ClickOutside as vClickOutside } from '../../directives/ClickOutside'
import type { EnvironmentSetupFragment, SupportedBundlers } from '../../generated/graphql'
import { FrameworkBundlerLogos } from '../../utils/icons'

const emit = defineEmits<{
  (event: 'select', type: SupportedBundlers)
}>()

const props = withDefaults(defineProps<{
  name: string
  value?: string
  placeholder?: string
  options: EnvironmentSetupFragment['allBundlers']
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

const selectOption = (opt: SupportedBundlers) => {
  emit('select', opt)
}

const disabledClass = computed(() => props.disabled ? 'opacity-50' : undefined)
</script>
