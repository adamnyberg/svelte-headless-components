<script lang="ts">
  import type { OptionItem } from '$lib/components/select/select.js';

  export let option: OptionItem;
</script>

<div class="flex items-center justify-between gap-2 px-2 py-1 {option.active ? 'bg-slate-100' : ''}">
  <span class="text-slate-700">
    {option.label}
  </span>

  {#if option.type === 'select' && option.selected}
    <span>✓</span>
  {/if}

  {#if option.type === 'menu'}
    <span class="text-2xl text-slate-400 leading-6">▸</span>
  {/if}
</div>
