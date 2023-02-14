<script>
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();

  export let count = 0
  
  const handleClick = () => {
    dispatch('change', {
      count: count++
    })
  }
</script>

<main>
  <div>
    <h1>Count is {count}</h1>
    <button on:click={handleClick}>Click to increment</button>
  </div>
</main>
