<template>
  <div
    ref="popper"
    class="assertion-options"
    data-cy="assertion-options"
  >
    <div
      v-for="{ name, value } in options"
      :key="`${name}${value}`"
      class="assertion-option"
      data-cy="assertion-option"
      tabindex="0"
      role="button"
      @keydown.enter="() => onClick(name, value)"
      @keydown.space="() => onClick(name, value)"
      @click.stop="() => onClick(name, value)"
    >
      <span
        v-if="name"
        class="assertion-option-name"
        data-cy="assertion-option-name"
      >
        {{ truncate(name) }}:{{ ' ' }}
      </span>
      <span
        v-else
        class="assertion-option-value"
        data-cy="assertion-option-value"
      >
        {{ typeof value === 'string' && truncate(value) }}
      </span>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { createPopper } from '@popperjs/core'
import { onMounted, ref, nextTick, Ref } from 'vue'
import type { AssertionOption } from './types'

const props = defineProps<{
  type: string
  options: AssertionOption[]
}>()

const emit = defineEmits<{
  (eventName: 'addAssertion', value: { type: string, name: string, value: string })
  (eventName: 'setPopperElement', value: HTMLElement)
}>()

const truncate = (str: string): string => {
  if (str && str.length > 80) {
    return `${str.substring(0, 77)}...`
  }

  return str
}

const popper: Ref<HTMLElement | null> = ref(null)

onMounted(() => {
  nextTick(() => {
    const popperEl = popper.value as HTMLElement
    const reference = popperEl.parentElement as HTMLElement

    createPopper(reference, popperEl, {
      placement: 'right-start',
    })

    emit('setPopperElement', popperEl)
  })
})

const onClick = (name: string | undefined, value: string | number | string[] | undefined): void => {
  if (name && value) {
    const stringValue = Array.isArray(value) ? value.join(', ') : String(value)

    emit('addAssertion', { type: props.type, name, value: stringValue })
  }
}
</script>

<style lang="scss">
@import './assertions-style.scss';

.assertion-options {
  @include menu-style;

  font-size: 14px;
  max-width: 150px;
  overflow: hidden;
  overflow-wrap: break-word;
  position: absolute;
  border: 1px solid #9aa2fc;
  box-shadow: 0 0 3px 3px rgba(154, 162, 252, 0.35);
  -webkit-box-shadow: 0 0 3px 3px rgba(154, 162, 252, 0.35);
  -moz-box-shadow: 0 0 3px 3px rgba(154, 162, 252, 0.35);
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
      border: 1px solid #9aa2fc;
      box-shadow: 0 0 3px 3px rgba(154, 162, 252, 0.35);
      -webkit-box-shadow: 0 0 3px 3px rgba(154, 162, 252, 0.35);
      -moz-box-shadow: 0 0 3px 3px rgba(154, 162, 252, 0.35);
    }
  }
}
</style>
