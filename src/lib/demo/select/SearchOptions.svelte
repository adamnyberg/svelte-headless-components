<script lang="ts">
  import type { Select, OptionSelect } from '$lib/components/select/select.js';
  import Item from './Item.svelte';

  export let select: Select;
  export let options: OptionSelect[];
</script>

{#each options as option}
  <button
    on:mouseenter={() => {
      select.setActive(option);
    }}
    on:click={() => {
      select.selectOption(option.id);
    }}
  >
    <Item {option} isSearch />
  </button>
{/each}
