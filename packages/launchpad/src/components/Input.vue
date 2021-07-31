<template>
  <div
    class="relative text-gray-600 overflow-hidden"
    :class="[containerAttrs, {
      'focus-within:text-gray-400': disabled,
      disabled,
      'w-350px': true
    }]"
>
    <span class="input-icon-wrapper">
      <slot name="prefix" :iconClass="prefixIconClass" :containerClass="buttonClass">
        <button type="submit" :class="buttonClass" v-if="prefixIcon || $slots.prefix">
          <i :data-icon="prefixIcon" :class="prefixIconClass" class="iconify"></i>
        </button>
      </slot>
    </span>
    <div class="card">
      <div v-if="$slots.default" :class="textClass" class="noninput"><slot/></div>
      <input v-else
        :autocomplete="false"
        autocorrect="off"
        :spellcheck="false"
        v-model="localValue"
        v-bind="inputAttrs"
        :type="type"
        :class="textClass"
      />
    </div>
    <span class="absolute inset-y-0 right-0 flex items-center pr-2">
      <slot name="suffix" :iconClass="suffixIconClass" :containerClass="buttonClass">
        <button type="submit" v-if="suffixIcon || $slots.suffix" :class="buttonClass">
          <i :data-icon="suffixIcon" :class="suffixIconClass" class="iconify"></i>
        </button>
      </slot>
    </span>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, PropType } from 'vue'
import { useModelWrapper } from '../composables'
import { omit } from 'lodash'

const buttonClass = "p-1 focus:outline-none focus:shadow-outline"

export default defineComponent({
  inheritAttrs: false,
  props: {
    type: {
      type: String as PropType<HTMLInputElement['type']>
    },
    modelValue: {
      type: String,
      default: ''
    },
    disabled: {
      type: Boolean,
      default: false
    },
    size: {
      type: String,
      default: 'md'
    },
    prefixIcon: {
      type: String
    },
    prefixIconClass: {
      type: String
    },
    suffixIcon: {
      type: String
    },
    suffixIconClass: {
      type: String
    },
    inputClass: {
      type: [String, Array, Object],
    }
  },
  setup(props, { emit, attrs, slots }) {
    return {
      type: computed(() => props.type || 'text'),
      localValue: useModelWrapper(props, emit, 'modelValue'),
      buttonClass,
      textClass: computed(() => ([props.inputClass, {
        'suffix': props.suffixIcon || slots.suffix,
        'pr-10': props.suffixIcon || slots.suffix,
        'pl-8': props.prefixIcon || slots.prefix,
        'py-2 mr-10px': props.size === 'md',
        'py-1 mr-10px': props.size === 'sm'
      }])),
      inputAttrs: { ...omit(attrs, 'class'), disabled: props.disabled },
      containerAttrs: attrs.class || {}
    }
  }
})
</script>


<style lang="scss" scoped>

.noninput {
  white-space: pre;
  overflow: auto;

  &::-webkit-scrollbar {
    width: 0;
    height: 0;
  }

  /* Track */
  &::-webkit-scrollbar-track {
    box-shadow: inset 0 0 5px grey;
    border-radius: 10px;
  }
}

.card > :disabled {
  @apply bg-cool-gray-100 text-cool-gray-400;
}

.card > * {
  @apply w-full
    h-full
    rounded
    border-transparent
    disabled:bg-cool-gray-100
    disabled:text-cool-gray-400
    border-cool-gray-300
    focus:border-gray-500
    focus:bg-white
    bg-gray-100
    focus:ring-0          
    focus:outline-none
    focus:bg-white
    focus:text-gray-900
    border-1;
}

.input-icon-wrapper {
  @apply absolute ml-1px rounded-lg mt-3px bg-cool-gray-100 inset-y-0 left-0 flex items-center pl-2 pr-0.5em;
  height: calc(100% - 4px);
}
input[type="search"].dark {
  background: #222;
  color: #fff;
}

input[type="search"].light {
  background: #fff;
  color: #222;
}
input[type="search"].suffix::-webkit-search-cancel-button {
  @apply pr-3.25em;
}

input[type="search"]::-webkit-search-cancel-button {
  -webkit-appearance: none;
  margin: 1em;
  height: 1em;
  width: 1em;
  border-radius: 50em;
  background: url(https://pro.fontawesome.com/releases/v5.10.0/svgs/solid/times-circle.svg)
    no-repeat 50% 50%;
  background-size: contain;
  opacity: 0;
  pointer-events: none;
}

input[type="search"]:focus::-webkit-search-cancel-button {
  opacity: 0.3;
  pointer-events: all;
}

input[type="search"].dark::-webkit-search-cancel-button {
  filter: invert(1);
}
</style>

