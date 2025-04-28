<template>
  <div
    :class="['assertion-type', { 'single-assertion': !hasOptions }]"
    tabindex="0"
    role="button"
    :aria-expanded="isOpen"
    :aria-haspopup="hasOptions"
    @click.stop="onClick"
    @mouseover.stop="onOpen"
    @mouseout.stop="onClose"
    @focus="onOpen"
    @blur="onClose"
    @keydown.enter="onClick"
    @keydown.space="onClick"
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

const onClose = (e: MouseEvent | FocusEvent) => {
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
  cursor: default;
  font-size: 14px;
  padding: 0.4rem 0.4rem 0.4rem 0.7rem;
  position: static;
  outline: none;
  border-radius: 4px;
  border: 1px solid transparent;

  &:first-of-type {
    padding-top: 0.5rem;
  }

  &:last-of-type {
    border-bottom-left-radius: 4px;
    border-bottom-right-radius: 4px;
    padding-bottom: 0.5rem;
  }

  &:hover {
    background-color: $gray-1000;
    border: 1px solid $gray-950;
  }

  &:focus {
    color: $indigo-300;
    outline: none;
    border: 1px solid #9aa2fc;
    box-shadow: 0 0 3px 3px rgba(154, 162, 252, 0.35);
    -webkit-box-shadow: 0 0 3px 3px rgba(154, 162, 252, 0.35);
    -moz-box-shadow: 0 0 3px 3px rgba(154, 162, 252, 0.35);
  }

  &.single-assertion {
    cursor: pointer;
  }

  .assertion-type-text {
    align-items: center;
    display: flex;
    cursor: pointer;

    .dropdown-arrow {
      margin-left: auto;
    }
  }
}
</style>
