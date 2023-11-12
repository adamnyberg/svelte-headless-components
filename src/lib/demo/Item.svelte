<script lang="ts">
  import type { SelectOption } from '$lib/components/select/select.js';

  export let option: SelectOption;
</script>

<div class="flex justify-between px-2 py-1 {option.active ? 'bg-slate-100' : ''}">
  <span>
    {option.label}
  </span>

  {#if option.selected}
    <span> ✓ </span>
  {/if}
</div>
