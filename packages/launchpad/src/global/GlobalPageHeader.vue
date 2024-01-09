<template>
  <div class="flex min-w-full mb-[24px] gap-[16px] col-start-1 col-end-3 items-center relative">
    <Input
      id="project-search"
      v-model="localValue"
      name="project-search"
      type="search"
      class="grow min-w-[200px] w-85%"
    />
    <label
      for="project-search"
      class="transition-opacity left-[42px] text-gray-400 duration-50 absolute"
      :class="{'opacity-0': localValue.length}"
    >
      {{ t('globalPage.searchPlaceholder') }}
    </label>
    <Button
      aria-controls="dropzone"
      class="h-full text-[16px]"
      data-cy="addProjectButton"
      size="40"
      :variant="showDropzone ? 'indigo-light' : 'indigo-dark'"
      :aria-expanded="showDropzone"
      @click="toggleDropzone"
    >
      <i-cy-add-large_x16
        class="duration-150 transform mr-[8px]"
        :class="showDropzone ?
          'icon-dark-gray-100 rotate-45' : 'icon-dark-indigo-300'"
      />
      {{ t('globalPage.addProjectButton') }}
    </Button>
  </div>

  <FileDropzone
    v-if="showDropzone"
    id="dropzone"
    data-cy="dropzone"
    class="mb-[24px]"
    close-button
    @addProject="emit('addProject', $event)"
    @close="toggleDropzone"
  />

  <NoResults
    v-if="!projectCount"
    class="mt-[80px]"
    :search-term="localValue"
    :message="t('globalPage.noResultsMessage')"
    @clear="handleClear"
  />
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import Button from '@cypress-design/vue-button'
import Input from '@cy/components/Input.vue'
import FileDropzone from './FileDropzone.vue'
import { useModelWrapper } from '@packages/frontend-shared/src/composables'
import { useI18n } from '@cy/i18n'
import NoResults from '@cy/components/NoResults.vue'

const showDropzone = ref(false)
const { t } = useI18n()

const props = defineProps<{
  modelValue: string
  projectCount?: number | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'addProject', value: string | null): void
}>()

const localValue = useModelWrapper(props, emit, 'modelValue')

const handleClear = () => {
  localValue.value = ''
}

const toggleDropzone = () => {
  showDropzone.value = !showDropzone.value
}
</script>
