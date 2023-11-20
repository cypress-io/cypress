<template>
  <div
    ref="popper"
    class="assertion-options"
  >
    <div
      v-for="{ name, value } in options"
      :key="`${name}${value}`"
      class="assertion-option"
      @click.stop="() => onClick(name, value)"
    >
      <span
        v-if="name"
        class="assertion-option-name"
      >
        {{ truncate(name) }}:{{ ' ' }}
      </span>
      <span
        v-else
        class="assertion-option-value"
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

const truncate = (str: string) => {
  if (str && str.length > 80) {
    return `${str.substr(0, 77)}...`
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

const onClick = (name, value) => {
  emit('addAssertion', { type: props.type, name, value })
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

  .assertion-option {
    cursor: pointer;
    padding: 0.4rem 0.6rem;

    &:hover {
      background-color: #e9ecef;
    }

    .assertion-option-value {
      font-weight: 600;
    }
  }
}
</style>
