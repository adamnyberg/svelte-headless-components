<script lang="ts">
  import type { Select, OptionItem } from '$lib/components/select/select.js';
  import {
    createFloatingActions,
    type ContentAction,
    type ReferenceAction,
    type UpdatePosition,
  } from 'svelte-floating-ui';
  import Item from './Item.svelte';

  export let select: Select;
  export let options: OptionItem[];

  let floatingOptions: Record<string, [ReferenceAction, ContentAction, UpdatePosition]> = {};

  $: {
    options.forEach((option) => {
      if (option.type === 'menu') {
        floatingOptions[option.id] = createFloatingActions({
          strategy: 'absolute',
          placement: 'right-start',
        });
      }
    });
  }

  function floatingReference(node: HTMLElement, id: string) {
    const floating = floatingOptions[id];
    if (!floating) {
      return;
    }
    return floating[0](node);
  }

  function floatingContent(node: HTMLElement, id: string) {
    const floating = floatingOptions[id];
    if (!floating) {
      return;
    }
    return floating[1](node);
  }
</script>

{#each options as option}
  <button
    on:mouseenter={() => {
      select.setActive(option);
    }}
    class="w-full"
    on:click={() => {
      if (option.type === 'select') select.selectOption(option.id);
    }}
    use:floatingReference={option.id}
  >
    <Item {option} />
  </button>

  {#if option.type === 'menu'}
    <div
      class="{option.active ? '' : 'hidden'} flex flex-col bg-white border border-slate-300 rounded shadow-md pb-1"
      use:floatingContent={option.id}
    >
      <svelte:self {select} options={option.subOptions} />
    </div>
  {/if}
{/each}
