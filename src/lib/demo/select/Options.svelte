<script lang="ts">
  import { type Select, type OptionItem, element } from '$lib/components/select/select.js';
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
    floatingOptions = {};
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

{#each options as option (option.id)}
  {#if option.type === 'menu' && option.active && floatingOptions[option.id]}
    <button use:element={[select.elements.options, option.id]} use:floatingReference={option.id} />
    <Item {option} />
    <div class="flex flex-col bg-white border border-slate-300 rounded shadow-md pb-1" use:floatingContent={option.id}>
      <svelte:self {select} options={option.subOptions} />
    </div>
  {:else}
    <button use:element={[select.elements.options, option.id]} class="outline-none">
      <Item {option} />
    </button>
  {/if}
{/each}
