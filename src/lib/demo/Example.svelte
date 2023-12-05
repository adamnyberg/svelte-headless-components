<script lang="ts">
  import type { Select } from '$lib/components/select/select.js';
  import Svelect from './select/Svelect.svelte';

  export let select: Select;
  export let showSearch = false;
  export let inputPlaceholder = 'Search...';
</script>

<div>
  <h2 class="text-xl"><slot /></h2>
  <Svelect {select} {showSearch} {inputPlaceholder} />
</div>
