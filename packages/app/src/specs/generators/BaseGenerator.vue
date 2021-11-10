<script lang="ts" setup>
defineProps<{
  title: string,
  codeGenGlob: string
}>()

defineEmits<{
  (event: 'update:title', value: string): void,
  (event: 'update:description', value: string): void
  (event: 'restart'): void
  (event: 'close'): void
}>()
</script>
