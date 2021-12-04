<template>
  <Listbox
    :value="props.modelValue"
    as="div"
    @update:modelValue="handleUpdate"
  >
    <template #default="{ open }">
      <ListboxLabel class="font-medium text-sm text-gray-700 block">
        <template v-if="label">
          {{ label }}
        </template>
        <slot
          v-else
          name="label"
          :open="open"
        />
      </ListboxLabel>
      <div class="relative">
        <ListboxButton class="bg-white border rounded cursor-default border-gray-100 text-left w-full py-2 pr-4 pl-3 text-gray-800 relative hocus-default sm:text-sm">
          <span class="flex inset-y-0 absolute items-center">
            <slot
              name="input-prefix"
              :value="modelValue"
              :open="open"
            />
          </span>
          <span
            class="pr-4"
            :class="
              {
                'pl-8': $slots['input-prefix'],
              }
            "
          >
            <span v-if="!modelValue">
              {{ placeholder ? placeholder : t('components.select.placeholder') }}
            </span>
            <slot
              v-else
              name="selected"
            >
              {{ get(modelValue, itemValue || '') }}
            </slot>
          </span>
          <span class="flex pr-2 inset-y-0 right-0 absolute items-center">
            <slot
              name="input-suffix"
              :value="modelValue"
              :open="open"
            >
              <Icon
                :icon="IconCaret"
                class="text-lg transform transition-transform"
                data-testid="icon-caret"
                aria-hidden="true"
                :class="{
                  'rotate-0 text-indigo-600': open,
                  'rotate-180 text-gray-500': !open
                }"
              />
            </slot>
          </span>
        </ListboxButton>

        <transition
          leave-active-class="transition ease-in duration-100"
          leave-from-class="opacity-100"
          leave-to-class="opacity-0"
        >
          <ListboxOptions class="bg-white rounded-md shadow-lg ring-black mt-1 text-base w-full max-h-60 py-1 ring-1 ring-opacity-5 z-10 absolute overflow-auto sm:text-sm focus:outline-none">
            <ListboxOption
              v-for="option in options"
              :key="get(option, itemKey ?? '')"
              v-slot="{ active, selected }"
              as="ul"
              :value="option"
              :disabled="option.disabled"
            >
              <li
                class="cursor-default py-2 pr-9 pl-3 block truncate select-none relative"
                :class="[{
                  'font-medium': selected,
                  'bg-gray-50': active,
                  'text-gray-900': !active,
                  'text-opacity-40': option.disabled
                }]"
              >
                <span class="flex inset-y-0 absolute items-center">
                  <slot
                    name="item-prefix"
                    :selected="selected"
                    :active="active"
                    :value="option"
                  />
                </span>
                <span
                  class="inline-block"
                  :class="{
                    'pl-8': $slots['item-prefix'],
                    'pr-4': $slots['item-suffix'],
                  }"
                >
                  <slot
                    name="item-body"
                    :selected="selected"
                    :active="active"
                    :value="option"
                  >
                    {{ get(option, itemValue || '') }}
                  </slot>
                </span>

                <span class="flex text-sm pr-8 inset-y-0 right-0 absolute items-center">
                  <slot
                    name="item-suffix"
                    :selected="selected"
                    :active="active"
                    :value="option"
                  >
                    <span
                      v-if="selected"
                      class="flex text-indigo-500 absolute items-center"
                    >
                      <Icon
                        :icon="IconCheck"
                        class="text-sm"
                        data-testid="icon-check"
                        aria-hidden="true"
                      />
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

<script lang="ts">
export default {
  inheritAttrs: true,
}
</script>

<script lang="ts" setup>
import { Listbox, ListboxButton, ListboxLabel, ListboxOption, ListboxOptions } from '@headlessui/vue'
import IconCheck from '~icons/mdi/check'
import IconCaret from '~icons/mdi/caret'
import Icon from './Icon.vue'
import { get } from 'lodash'
import { useI18n } from '@cy/i18n'

const { t } = useI18n()

interface Option {
  [key: string]: any
}

const props = withDefaults(defineProps<{
  options: Option[] | readonly Option[],
  modelValue?: Option // Current object being selected
  placeholder?: string
  label?: string
  itemValue?: string // The key of the modelValue to render
  itemKey?: string
}>(), {
  placeholder: '',
  label: '',
  itemValue: 'value',
  modelValue: undefined,
  itemKey: 'key',
})

const emit = defineEmits<{
  (event: 'update:modelValue', value: Option)
}>()

const handleUpdate = (value: Option) => {
  emit('update:modelValue', value)
}
</script>
