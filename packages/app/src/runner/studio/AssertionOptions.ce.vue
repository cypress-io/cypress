<template>
  <div
    ref="popper"
    class="assertion-options"
    data-cy="assertion-options"
  >
    <div
      v-for="option in options"
      :key="getOptionKey(option)"
      class="assertion-option"
      data-cy="assertion-option"
      tabindex="0"
      role="button"
      @keydown.enter="handleOptionClick(option)"
      @keydown.space="handleOptionClick(option)"
      @click.stop="handleOptionClick(option)"
    >
      <span
        v-if="option.name"
        class="assertion-option-name"
        data-cy="assertion-option-name"
      >
        {{ truncate(option.name) }}:{{ ' ' }}
      </span>
      <span
        v-else
        class="assertion-option-value"
        data-cy="assertion-option-value"
      >
        {{ typeof option.value === 'string' && truncate(option.value) }}
      </span>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { createPopper } from '@popperjs/core'
import { onMounted, ref, nextTick, Ref } from 'vue'
import type { AssertionOption } from './types'

interface Props {
  type: string
  options: AssertionOption[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (eventName: 'addAssertion', value: { type: string, name: string, value: string })
  (eventName: 'setPopperElement', value: HTMLElement)
}>()

const popper: Ref<HTMLElement | null> = ref(null)

const TRUNCATE_LENGTH = 80
const TRUNCATE_SUFFIX = '...'

const truncate = (str: string): string => {
  if (!str || str.length <= TRUNCATE_LENGTH) {
    return str
  }

  return `${str.substring(0, TRUNCATE_LENGTH - TRUNCATE_SUFFIX.length)}${TRUNCATE_SUFFIX}`
}

const getOptionKey = (option: AssertionOption): string => {
  return `${option.name}${option.value}`
}

const handleOptionClick = (option: AssertionOption): void => {
  emit('addAssertion', {
    type: props.type,
    name: option.name || '',
    value: String(option.value || ''),
  })
}

const initializePopper = (): void => {
  const popperEl = popper.value as HTMLElement
  const reference = popperEl.parentElement as HTMLElement

  createPopper(reference, popperEl, {
    placement: 'right-start',
  })

  emit('setPopperElement', popperEl)
}

onMounted(() => {
  nextTick(initializePopper)
})
</script>

<style scoped lang="scss">
@import './assertions-style.scss';

.assertion-options {
  @include menu-style;

  font-size: 14px;
  max-width: 150px;
  overflow: hidden;
  overflow-wrap: break-word;
  position: absolute;
  right: 8px;
  border-radius: 4px;

  .assertion-option {
    font-size: 14px;
    cursor: pointer;
    padding: 0.4rem 0.6rem;
    border: 1px solid transparent;

    &:first-of-type {
      border-top-left-radius: 4px;
      border-top-right-radius: 4px;
    }

    &:last-of-type {
      border-bottom-left-radius: 4px;
      border-bottom-right-radius: 4px;
    }

    &:hover {
      background-color: $gray-1000;
      border: 1px solid $gray-950;
    }

    &:focus {
      background-color: $gray-950;
      color: $indigo-300;
      outline: none;
      @include box-shadow;
    }
  }
}
</style>
