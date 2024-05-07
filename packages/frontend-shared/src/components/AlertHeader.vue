<template>
  <div
    class="flex gap-[8px] group items-center relative"
    :class="[alertClass, headerClass]"
  >
    <slot name="prefixIcon">
      <component
        :is="prefixIcon"
        v-if="prefixIcon"
        data-cy="alert-prefix-icon"
        class="h-[16px] w-[16px] icon-dark-current"
        :class="prefixIconClass"
      />
    </slot>
    <h2
      class="grow font-medium text-left leading-normal decoration-current"
      :class="headerClass"
    >
      <slot name="title">
        {{ title }}
      </slot>
    </h2>
    <div class="relative shrink">
      <slot
        name="suffixIcon"
        v-bind="{ ariaLabel: suffixIconAriaLabel, buttonClasses: suffixButtonClass, iconClasses: suffixIconClass, onClick: onSuffixIconClicked }"
      >
        <button
          v-if="suffixIcon"
          data-cy="alert-suffix-icon"
          :aria-label="suffixIconAriaLabel"
          class="rounded-full flex outline-none h-[32px] -top-[16px] right-[-8px] w-[32px] hocus:ring-current items-center justify-center absolute hocus:ring-1"
          :class="suffixButtonClass"
          @click="onSuffixIconClicked"
        >
          <component
            :is="suffixIcon"
            class="h-[16px] w-[16px]"
            :class="suffixIconClass"
          />
        </button>
      </slot>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { FunctionalComponent, SVGAttributes } from 'vue'

const emit = defineEmits<{
  (eventName: 'suffixIconClicked'): void
}>()

/* eslint-disable vue/require-default-prop */
defineProps<{
  title: string
  prefixIcon?: FunctionalComponent<SVGAttributes, {}> | null
  suffixIcon?: FunctionalComponent<SVGAttributes, {}> | null
  suffixIconAriaLabel?: string
  alertClass?: string
  prefixIconClass?: string
  suffixIconClass?: string
  headerClass?: string
  suffixButtonClass?: string
}>()

const onSuffixIconClicked = () => {
  emit('suffixIconClicked')
}
</script>
