<template>
  <div
    :class="['assertion-type', { 'single-assertion': !hasOptions }]"
    @click.stop="onClick"
    @mouseover.stop="onOpen"
    @mouseout.stop="onClose"
  >
    <div class="assertion-type-text">
      <span>
        {{ type.replace(/\./g, ' ') }}
      </span>
      <span
        v-if="hasOptions"
        class="dropdown-arrow"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="12"
          height="12"
          fill="currentColor"
          viewBox="0 0 16 16"
        >
          <path
            fillRule="evenodd"
            d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"
          />
        </svg>
      </span>
    </div>
    <AssertionOptions
      v-if="hasOptions && isOpen"
      :type="type"
      :options="options"
      @set-popper-element="setPopperElement"
      @add-assertion="addAssertion"
    />
  </div>
</template>

<script lang="ts" setup>
import { Ref, ref } from 'vue'
import AssertionOptions from './AssertionOptions.ce.vue'

const props = defineProps<{
  type: string
  options: any
}>()

const emit = defineEmits<{
  (eventName: 'addAssertion', value: { type: string, name?: string, value?: string })
}>()

const isOpen = ref(false)
const hasOptions = props.options && !!props.options.length
const popperElement: Ref<HTMLElement | null> = ref(null)

const onOpen = () => {
  isOpen.value = true
}

const onClose = (e: MouseEvent) => {
  if (e.relatedTarget instanceof Element &&
    popperElement.value && popperElement.value.contains(e.relatedTarget)) {
    return
  }

  isOpen.value = false
}

const onClick = () => {
  if (!hasOptions) {
    emit('addAssertion', { type: props.type })
  }
}

const setPopperElement = (el: HTMLElement) => {
  popperElement.value = el
}

const addAssertion = ({ type, name, value }) => {
  emit('addAssertion', { type, name, value })
}
</script>

<style lang="scss">
@import './assertions-style.scss';

.assertion-type {
  color: #202020;
  cursor: default;
  font-size: 14px;
  padding: 0.4rem 0.4rem 0.4rem 0.7rem;
  position: static;

  &:first-of-type {
    padding-top: 0.5rem;
  }

  &:last-of-type {
    border-bottom-left-radius: $border-radius;
    border-bottom-right-radius: $border-radius;
    padding-bottom: 0.5rem;
  }

  &:hover {
    background-color: #e9ecef;
  }

  &.single-assertion {
    cursor: pointer;
    font-weight: 600;
  }

  .assertion-type-text {
    align-items: center;
    display: flex;

    .dropdown-arrow {
      margin-left: auto;
    }
  }
}
</style>
