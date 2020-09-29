<template>
  <div>
    <slot name="label"></slot>
    <input type="text" :name="name" :id="inputId" />
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
};
</script>
