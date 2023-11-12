<script lang="ts">
  import type { SelectOption } from '$lib/components/select/select.js';

  export let selected: SelectOption[] = [];
  export let isOpen: boolean;
  export let ref: HTMLButtonElement;
</script>

<button
  bind:this={ref}
  class="border {isOpen
    ? 'border-slate-100'
    : 'border-transparent'} focus:outline-none focus:border-sky-600 hover:border hover:border-slate-300 rounded-md px-2 py-1"
  >{selected.length > 0 ? selected.map((option) => option.label).join(', ') : 'Nothing selected'}</button
>
