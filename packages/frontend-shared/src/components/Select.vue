<template>
  <Listbox
    :value="props.modelValue"
    as="div"
    @update:modelValue="handleUpdate"
  >
    <template #default="{ open }">
      <ListboxLabel
        id="select-label"
        class="font-medium text-sm text-gray-800 block"
      >
        <template
          v-if="label"
          id="labelId"
        >
          {{ label }}
        </template>
        <slot
          v-else
          name="label"
          :open="open"
        />
      </ListboxLabel>
      <div
        class="relative"
      >
        <ListboxButton
          class="bg-white border rounded text-left w-full py-2 px-4 text-gray-800 hocus-default group relative sm:text-sm"

          :class="open ? 'cursor-default default-ring' : 'cursor-pointer border-gray-100'"
        >
          <span class="flex inset-y-0 absolute items-center">
            <slot
              name="input-prefix"
              :value="modelValue"
              :open="open"
            />
          </span>
          <span
            class="pr-[24px] text-[16px] leading-[24px]"
            :class="
              {
                'pl-[24px]': $slots['input-prefix'],
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
          <span class="flex pr-3 inset-y-0 right-0 absolute items-center">
            <slot
              name="input-suffix"
              :value="modelValue"
              :open="open"
            >
              <i-cy-chevron-down
                data-testid="icon-caret"
                :class="{
                  'rotate-180 icon-dark-indigo-600': open,
                  'rotate-0 icon-dark-gray-500': !open
                }"
                class="max-w-[16px] transform transition duration-250 group-hocus:icon-dark-indigo-600"
              />
            </slot>
          </span>
        </ListboxButton>

        <transition
          leave-active-class="transition ease-in duration-100"
          leave-from-class="opacity-100"
          leave-to-class="opacity-0"
        >
          <ListboxOptions
            :aria-labelledby="labelId"
            class="bg-white rounded shadow-lg ring-black mt-1 text-base w-full max-h-60 ring-1 ring-opacity-5 z-10 absolute overflow-auto sm:text-sm focus:outline-none"
          >
            <ListboxOption
              v-for="option in props.options"
              :key="get(option, itemKey)"
              v-slot="{ active, selected }"
              as="li"
              :value="option"
              :disabled="option.disabled || false"
            >
              <div
                class="border-transparent cursor-pointer border py-2 pr-8 pl-4 block truncate select-none relative "
                :class="[{
                  'font-medium bg-jade-50': isSelectedOption(option),
                  'bg-gray-50': active,
                  'text-gray-800': !isSelectedOption(option) && !active,
                  'text-opacity-40': option.disabled || false
                }]"
                :data-cy="get(option, itemKey)"
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
                    'pr-6': $slots['item-suffix'],
                  }"
                >
                  <slot
                    name="item-body"
                    :selected="isSelectedOption(option)"
                    :active="active"
                    :value="option"
                  >
                    {{ get(option, itemValue || '') }}
                  </slot>
                </span>
                <span class="flex text-sm pr-3 inset-y-0 right-0 absolute items-center">
                  <slot
                    name="item-suffix"
                    :selected="isSelectedOption(option)"
                    :active="active"
                    :value="option"
                  >
                    <span
                      v-if="isSelectedOption(option)"
                      class="flex pr-3 right-0 text-jade-400 absolute items-center"
                    >
                      <i-mdi-check
                        class="h-[16px] w-[16px]"
                        data-testid="icon-check"
                        aria-hidden="true"
                      />
                    </span>
                  </slot>
                </span>
              </div>
            </ListboxOption>
            <li
              v-if="$slots.footer"
              role="option"
            >
              <slot name="footer" />
            </li>
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
import { get } from 'lodash'
import { useI18n } from '@cy/i18n'

const { t } = useI18n()

interface Option {
  [key: string]: any
  disabled?: boolean
}

const props = withDefaults(defineProps<{
  options: Option[] | readonly Option[]
  modelValue?: Option // Current object being selected
  placeholder?: string
  label?: string
  labelId: string
  /**
   * The value of the modelValue to render. `value` by default
   */
  itemValue?: string
  /**
   * The key of the modelValue to render and check selected option. `key` by default
   */
  itemKey?: string
  error?: boolean
}>(), {
  placeholder: '',
  label: '',
  labelId: undefined,
  itemValue: 'value',
  modelValue: undefined,
  itemKey: 'key',
})

const isSelectedOption = (option: Option) => {
  const optionKey = get(option, props.itemKey)

  return optionKey && optionKey === get(props.modelValue, props.itemKey)
}

const emit = defineEmits<{
  (event: 'update:modelValue', value: Option)
}>()

const handleUpdate = (value: Option) => {
  emit('update:modelValue', value)
}
</script>
