<template>
  <div>
    <slot name="label" />
    <input
      :id="inputId"
      type="text"
      :name="name"
    >
  </div>
</template>
<script>
export default {
  props: {
    name: {
      required: true,
      type: String,
    },
    inputId: {
      required: true,
      type: String,
    },
  },
}
</script>
