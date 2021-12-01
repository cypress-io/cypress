<template>
  <div
    class="group flex items-center relative gap-8px"
    :class="[alertClass, headerClass]"
  >
    <slot name="prefixIcon">
      <component
        :is="prefixIcon"
        v-if="prefixIcon"
        data-testid="alert-prefix-icon"
        class="h-16px w-16px icon-dark-current"
        :class="prefixIconClass"
      />
    </slot>
    <h3
      class="font-medium underline-current leading-normal flex-grow text-left"
      :class="headerClass"
    >
      <slot name="title">
        {{ title }}
      </slot>
    </h3>
    <div class="relative shrink">
      <slot
        name="suffixIcon"
        v-bind="{ ariaLabel: suffixIconAriaLabel, buttonClasses: suffixButtonClass, iconClasses: suffixIconClass, onClick: onSuffixIconClicked }"
      >
        <button
          v-if="suffixIcon"
          data-testid="alert-suffix-icon"
          :aria-label="suffixIconAriaLabel"
          class="outline-none rounded-full hocus:ring-1 hocus:ring-current flex items-center justify-center absolute h-32px w-32px -top-16px -right-8px"
          :class="suffixButtonClass"
          @click="onSuffixIconClicked"
        >
          <component
            :is="suffixIcon"
            class="w-16px h-16px"
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

withDefaults(defineProps<{
  title?: string
  prefixIcon?: FunctionalComponent<SVGAttributes, {}> | null
  suffixIcon?: FunctionalComponent<SVGAttributes, {}> | null
  suffixIconAriaLabel?: string
  alertClass?: string
  prefixIconClass?: string
  suffixIconClass?: string
  headerClass?: string
  suffixButtonClass?: string
}>(), { title: 'Alert' })

const onSuffixIconClicked = () => {
  emit('suffixIconClicked')
}
</script>
