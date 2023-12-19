<script lang="ts">
  import type { Select } from '$lib/components/select/select.js';
  import Svelect from './select/Svelect.svelte';

  export let select: Select;
  export let showSearch = false;
  export let inputPlaceholder = 'Search...';
</script>

<div>
  <h2 class="text-xl"><slot /></h2>
  <Svelect
    {select}
    {showSearch}
    {inputPlaceholder}
    on:select={({ detail }) => {
      console.log('on:select', detail);
    }}
    on:change={({ detail }) => {
      console.log('on:change', detail);
    }}
  />
</div>
