<script lang="ts">
  import { Select, type InputOptionItem } from '$lib/components/select/select.js';
  import Svelect from '$lib/demo/select/Svelect.svelte';
  import { get } from 'svelte/store';

  const options: InputOptionItem[] = [
    { label: 'Yellow bug' },
    { label: 'Cheetah' },
    {
      label: 'Colors',
      type: 'menu',
      subOptions: [{ label: 'Blue' }, { label: 'Red' }, { label: 'Yellow' }, { label: 'Green' }],
    },
    {
      label: 'Pokemons',
      type: 'menu',
      subOptions: [
        {
          label: 'Water',
          type: 'menu',
          subOptions: [{ label: 'Squirtle' }, { label: 'Wartortle' }, { label: 'Blastoise' }],
        },
        {
          label: 'Fire',
          type: 'menu',
          subOptions: [{ label: 'Charmander' }, { label: 'Charmeleon' }, { label: 'Charizard' }],
        },
        {
          label: 'Grass',
          type: 'menu',
          subOptions: [{ label: 'Bulbasaur' }, { label: 'Ivysaur' }, { label: 'Venusaur' }],
        },
      ],
    },
    {
      label: 'Labels',
      type: 'menu',
      subOptions: [
        { label: 'Bug', isMulti: true },
        { label: 'Feature', isMulti: true },
        { label: 'Help', isMulti: true },
      ],
    },
  ];

  let simpleOptions: InputOptionItem[] = [{ type: 'select', label: 'No option' }, ...structuredClone(options)];
  let simpleSelect = new Select(simpleOptions);

  let multiOptions = structuredClone(options);
  let multiSelect = new Select(multiOptions);
</script>

<div class="flex flex-col max-w-2xl gap-12 m-auto mt-12 mb-6">
  <h1 class="text-3xl">Svelte Headless Components</h1>

  <div>
    <h2 class="text-xl">Allow add option</h2>
    <div class="flex justify-between gap-10">
      <Svelect
        select={simpleSelect}
        showSearch
        on:close={() => console.log('on:close')}
        on:open={() => console.log('on:open', 'simple')}
        on:select={({ detail }) => console.log('on:select', detail)}
        on:addOption={({ detail }) => {
          console.log('on:addOption', detail);
        }}
      />
      <pre class="text-xs">
        <!-- {JSON.stringify($selectOptions, null, 2)} -->
      </pre>
    </div>
  </div>

  <div>
    <h2 class="text-xl">Multi select</h2>
    <!-- <Svelect
      select={multiSelect}
      showSearch
      on:close={() => console.log('on:close')}
      on:open={() => console.log('on:open', 'multi')}
      on:select={({ detail }) => console.log('on:select', detail)}
      on:addOption={({ detail }) => {
        console.log('on:addOption', detail);
      }}
    /> -->
  </div>
</div>
