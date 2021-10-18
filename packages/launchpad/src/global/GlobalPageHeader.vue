<template>
  <div class="min-w-full col-start-1 col-end-3 flex items-center gap-6 mb-24px relative">
    <Input
      id="project-search"
      v-model="localValue"
      name="project-search"
      type="search"
      class="min-w-200px w-80% flex-grow"
    />
    <label
      for="project-search"
      class="absolute text-14px text-gray-400 left-42px transition-opacity duration-50"
      :class="{'opacity-0': localValue.length}"
    >
      {{ t('globalPage.searchPlaceholder') }}
    </label>
    <Button
      :prefix-icon="IconPlus"
      aria-controls="dropzone"
      prefix-icon-class="text-center justify-center text-lg"
      class="w-20% min-w-120px text-size-16px h-full hocus-default"
      data-testid="addProjectButton"
      size="lg"
      :variant="showDropzone ? 'pending' : 'primary'"
      :aria-expanded="showDropzone"
      @click="toggleDropzone"
    >
      {{ t('globalPage.addProjectButton') }}
    </Button>
  </div>

  <FileDropzone
    v-if="showDropzone"
    id="dropzone"
    @addProject="emit('addProject', $event)"
  />
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import Button from '@cy/components/Button.vue'
import Input from '@cy/components/Input.vue'
import IconPlus from '~icons/mdi/plus'
import FileDropzone from './FileDropzone.vue'
import { useModelWrapper } from '@packages/frontend-shared/src/composables'
import { useI18n } from '@cy/i18n'

const showDropzone = ref(false)
const { t } = useI18n()

const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'addProject', value: string): void
}>()

const localValue = useModelWrapper(props, emit, 'modelValue')

const toggleDropzone = () => {
  showDropzone.value = !showDropzone.value
}
</script>
