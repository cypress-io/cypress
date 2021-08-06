<template>
  <Listbox as="div" v-model="modelValue">
    <template #="{ open }">
    <ListboxLabel class="block text-sm font-medium text-gray-700">
      <template v-if="label"> {{ label }} </template>
      <slot v-else name="label" :open="open"></slot>
    </ListboxLabel>
    <div class="mt-1 relative">
      <ListboxButton class="bg-white text-gray-800 relative w-full border border-gray-300 rounded pl-3 pr-4 py-2 text-left cursor-default focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
        <span class="absolute inset-y-0 flex items-center">
          <slot name="input-prefix" :value="modelValue" :open="open"></slot>
        </span>
        <span :class="
          {
            'pl-8': $slots['input-prefix'],
            'pr-4': $slots['input-suffix'],
          }
        ">
          <span v-if="placeholder && !modelValue">{{ placeholder }}
          </span>
        <slot name="selected" v-else>
          {{ get(modelValue, itemValue) }}
        </slot>
      </span>
        <span class="absolute inset-y-0 right-0 pr-2 flex items-center"><slot name="input-suffix" :value="modelValue" :open="open"></slot></span>
        
      </ListboxButton>

      <transition leave-active-class="transition ease-in duration-100" leave-from-class="opacity-100" leave-to-class="opacity-0">
        <ListboxOptions class="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
          <ListboxOption as="ul" v-for="option in options" :key="get(option, itemKey)" :value="option" v-slot="{ active, selected }">
              <li class="cursor-default block truncate select-none relative py-2 pl-3 pr-9" :class="[{
                'font-medium': selected,
                'bg-gray-50': active,
                'text-gray-900': !active
              }]">
                <span class="absolute inset-y-0 flex items-center">
                  <slot name="item-prefix" :selected="selected" :active="active" :value="option"></slot>
                </span>
                <span class="inline-block" :class="{
                  'pl-4': $slots['item-prefix'],
                  'pr-4': $slots['item-suffix'],
                }">
                  <slot name="item-body" :selected="selected" :active="active" :value="option">
                    {{ get(option, itemValue) }}
                  </slot>
                </span>

                <span class="absolute inset-y-0 right-0 pr-8 flex items-center">
                  <slot name="item-suffix" :selected="selected" :active="active" :value="option">
                    <span v-if="selected" class="text-indigo-500 absolute flex pr-8 items-center">
                      <Icon :icon="CheckIcon" class="text-sm" aria-hidden="true"/>
                    </span>
                  </slot>
                </span>
            </li>
          </ListboxOption>
        </ListboxOptions>
      </transition>
    </div>
  </template>
  </Listbox>
</template>

<script lang="ts" setup>
import { Listbox, ListboxButton, ListboxLabel, ListboxOption, ListboxOptions } from '@headlessui/vue'
import CheckIcon from 'virtual:vite-icons/mdi/check'
import { get } from 'lodash'

interface Option {
  [key: string]: any
}

withDefaults(defineProps<{
  options: Option[],
  modelValue?: Option | null // Current object being selected
  placeholder?: string
  label?: string
  itemValue?: string // The key of the modelValue to render
  itemKey?: string
}>(), {
  placeholder: '',
  label: '',
  itemValue: '',
  itemKey: ''
})

defineEmits(['update:modelValue'])
</script>
