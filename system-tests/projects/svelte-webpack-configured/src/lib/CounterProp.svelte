<script lang="ts">
  let { count } =  $props()
  count = count || 0
</script>

<button>
  count is {count}
</button>
