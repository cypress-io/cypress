<template>
  <div class="min-w-full col-start-1 col-end-3 flex items-center gap-6 mb-24px">
    <Input
      v-model="localValue"
      type="search"
      class="min-w-200px w-80% flex-grow"
      :placeholder="t('globalPage.searchPlaceholder')"
    />
    <Button
      :prefix-icon="IconPlus"
      aria-controls="fileupload"
      prefix-icon-class="text-center justify-center text-lg"
      class="w-20% min-w-120px text-size-16px h-full hocus-default"
      data-testid="addProjectButton"
      size="lg"
      @click="showDropzone = !showDropzone"
    >
      {{ t('globalPage.addProjectButton') }}
    </Button>
  </div>

  <FileDropzone
    v-if="showDropzone"
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
</script>
