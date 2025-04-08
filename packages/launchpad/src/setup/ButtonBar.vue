<template>
  <div class="rounded-b flex bg-gray-50 border-t border-t-gray-100 py-[16px] px-[24px] gap-3">
    <slot>
      <Button
        v-if="nextFn"
        size="40"
        :disabled="!canNavigateForward"
        :variant="mainVariant === 'pending' ? 'disabled' : mainVariant"
        @click="nextFn"
      >
        <i-cy-loading_x16
          v-if="mainVariant === 'pending'"
          class="animate-spin icon-dark-white icon-light-gray-400 mr-[8px]"
        />
        {{ next }}
      </Button>
      <Button
        v-if="backFn"
        size="40"
        variant="outline-light"
        @click="backFn"
      >
        {{ back }}
      </Button>
      <div class="grow" />
      <div
        v-if="altFn && alt"
        class="flex px-3 items-center"
      >
        <label
          id="altFn"
          class="px-3 text-gray-500"
          @click="handleAlt"
        >
          {{ alt }}
        </label>
        <Switch
          size="lg"
          label-id="altFn"
          :value="altValue"
          @update="handleAlt"
        />
      </div>
      <Button
        v-if="skipFn"
        size="40"
        variant="link"
        class="text-gray-500"
        @click="skipFn"
      >
        {{ skip }}
        <i-cy-arrow-right_x16 class="inline-block h-[16px] w-[16px] icon-dark-gray-500" />
      </Button>
    </slot>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import Button, { type ButtonVariants } from '@cypress-design/vue-button'
import Switch from '@cy/components/Switch.vue'

const props = withDefaults(defineProps<{
  next?: string
  back?: string
  skip?: string
  nextFn?: () => void
  backFn?: () => void
  skipFn?: () => void
  alt?: string
  altFn?: (value: boolean) => void
  canNavigateForward?: boolean
  mainVariant?: ButtonVariants | 'pending'
}>(), {
  alt: undefined,
  altFn: undefined,
  next: undefined,
  back: undefined,
  skip: undefined,
  backFn: undefined,
  nextFn: undefined,
  skipFn: undefined,
  mainVariant: 'indigo-dark',
})

const altValue = ref(false)

const handleAlt = () => {
  altValue.value = !altValue.value
  props.altFn?.(altValue.value)
}
</script>
