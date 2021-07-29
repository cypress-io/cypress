<template>  
    <div class="relative text-gray-600 focus-within:text-gray-400">
      <span class="absolute inset-y-0 left-0 flex items-center pl-2">
        <button type="submit" class="p-1 focus:outline-none focus:shadow-outline">
          <i :data-icon="prefixIcon" :class="prefixIconClass" class="iconify"></i>
        </button>
      </span>
      <input
        :autocomplete="false"
        autocorrect="off"
        :spellcheck="false"
        v-model="localValue"
        v-bind="$attrs"
        :type="type"
        :class="
        {
          'suffix': suffixIcon,
          'pl-10': prefixIcon,
          'bg-color-red-500': true,
          'py-2 mr-10px': size === 'md',
          'py-1 mr-10px': size === 'sm'
        }
        "
        class="
          w-full
          text-sm
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
          focus:text-gray-900">
        <span class="absolute inset-y-0 right-0 flex items-center pr-2">
        <button type="submit" class="p-1 focus:outline-none focus:shadow-outline">
          <i :data-icon="suffixIcon" :class="suffixIconClass" class="iconify"></i>
        </button>
      </span>
    </div>
</template>

<script lang="ts">
import { defineComponent, computed, PropType } from 'vue'
import { useModelWrapper } from '../composables'

const IconClassesTable = {
  md: "h-1.25em w-1.25em",
  lg: "h-2em w-2m",
  xl: "h-2.5em w-2.5em"
}

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
    }
  },
  setup(props, {emit, attrs}) {
    return {
      type: computed(() => props.type || 'text'),
      localValue: useModelWrapper(props, emit, 'modelValue'),
      iconClasses: ['flex', 'items-center', IconClassesTable[props.size]],
    }
  }
})
</script>


<style scoped>
input {
  border: 1px solid gray;
  padding: .2em .4em;
  border-radius: .2em;
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
  background: url(https://pro.fontawesome.com/releases/v5.10.0/svgs/solid/times-circle.svg) no-repeat 50% 50%;
  background-size: contain;
  opacity: 0;
  pointer-events: none;
}

input[type="search"]:focus::-webkit-search-cancel-button {
  opacity: .3;
  pointer-events: all;
}

input[type="search"].dark::-webkit-search-cancel-button {
  filter: invert(1);
}
</style>

