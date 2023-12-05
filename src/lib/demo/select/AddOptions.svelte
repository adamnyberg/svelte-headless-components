<script lang="ts">
  import type { OptionSelect, Select } from '$lib/components/select/select.js';
  import Item from './Item.svelte';

  export let select: Select;
  export let options: OptionSelect[];
  let {
    state: { search },
  } = select;
</script>

{#each options as option}
  <button
    on:mouseenter={() => {
      select.setActive(option);
    }}
    on:click={() => {
      select.addOption(option.id);
    }}
  >
    <Item {option} kind="add" search={$search} />
  </button>
{/each}
