<template>
  <div class="px-5 py-5 flex gap-3 bg-gray-50 border-t border-t-1 border-t-gray-200 rounded-b">
    <slot>
      <Button
        v-if="showNext"
        :disabled="!canNavigateForward"
        @click="nextFn"
      >
        {{ next }}
      </Button>
      <Button
        variant="outline"
        @click="backFn"
      >
        {{ back }}
      </Button>
      <div class="flex-grow" />
      <div
        v-if="altFn && alt"
        class="flex items-center px-3"
      >
        <label
          class="text-gray-500 px-3"
          @click="handleAlt"
        >{{ alt }}</label>
        <Switch
          :value="altValue"
          @update="handleAlt"
        />
      </div>
    </slot>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import Button from '@cy/components/Button.vue'
import Switch from '@cy/components/Switch.vue'

const props = withDefaults(defineProps<{
  next: string
  back: string
  nextFn: () => void
  backFn: () => void
  alt?: string
  altFn?: (value: boolean) => void
  canNavigateForward?: boolean
  showNext: boolean
}>(), {
  showNext: true,
  alt: undefined,
  altFn: undefined,
})

const altValue = ref(false)

const handleAlt = () => {
  altValue.value = !altValue.value
  props.altFn?.(altValue.value)
}
</script>
