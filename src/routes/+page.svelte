<script lang="ts">
  import { Select, type InputOptionItem, element } from '$lib/components/select/select.js';
  import Example from '$lib/demo/Example.svelte';
  import { ChartBar, ChartPie, PresentationChartLine } from '@steeze-ui/heroicons';
  import Svelect from '$lib/demo/select/Svelect.svelte';
  import { get, writable } from 'svelte/store';
  import SimpleSelect from '$lib/demo/select/SimpleSelect.svelte';
  import Content from '$lib/demo/select/Content.svelte';
  import { createPopover } from '$lib/index.js';

  const chartOptions: InputOptionItem[] = [
    { label: 'Bar chart', data: { icon: ChartBar } },
    { label: 'Pie chart', data: { icon: ChartPie }, disabled: true },
    { label: 'Line chart', data: { icon: PresentationChartLine } },
  ];

  const options: InputOptionItem[] = [
    { label: 'Yellow bug' },
    { label: 'Cheetah' },
    {
      label: 'Colors',
      type: 'menu',
      subOptions: [{ label: '💙 Blue' }, { label: '💜 Purple' }, { label: '💛 Yellow' }, { label: '💚 Green' }],
    },
    {
      label: 'Pokemons',
      type: 'menu',
      subOptions: [
        {
          label: '💧 Water',
          type: 'menu',
          subOptions: [{ label: 'Squirtle' }, { label: 'Wartortle' }, { label: 'Blastoise' }],
        },
        {
          label: '🔥 Fire',
          type: 'menu',
          disabled: true,
          subOptions: [{ label: 'Charmander' }, { label: 'Charmeleon' }, { label: 'Charizard' }],
        },
        {
          label: '🌱 Grass',
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

  let config = {
    additions: [
      {
        id: 'add:colors',
        label: 'Colors',
      },
      {
        id: 'add:pokemons',
        label: 'Pokemons',
      },
    ],

    minSearchLength: 2,
  };

  const multiAddOptions = structuredClone(chartOptions.map((o) => ({ ...o, isMulti: true })));

  const multiWithAdd = new Select(multiAddOptions, {
    additions: [
      {
        id: 'add:option',
        label: '',
      },
    ],
    minSearchLength: 2,
    validateAddition: async (searchText) => {
      console.log('validateAddition', searchText);
      await new Promise((r) => setTimeout(r, 3000));
      console.log('validateAddition wait done');
      if (searchText.length < 5) {
        return false;
      }
      return true;
    },
  });

  const selects = [new Select(chartOptions), new Select(chartOptions), new Select(structuredClone(options), config)];

  const contextSelect = new Select(chartOptions, {
    useVirtualElement: true,
    activeOnOpen: false,
    triggerEvent: 'contextmenu',
  });
  let contextIsOpen = contextSelect.state.isOpen;
  let contextSelected = contextSelect.state.selected;

  const popoverIsOpen = writable(false);
  const [popoverTrigger, popoverContent] = createPopover(popoverIsOpen);
</script>

<div class="flex justify-center">
  <div class="flex flex-col max-w-4xl gap-12 mt-12 px-4 mb-40">
    <h1 class="text-3xl flex justify-between items-center">
      <span>Svelte Headless Select Demo</span>
      <a href="https://github.com/adamnyberg/svelte-headless-components" class="text-sm text-slate-500">Github</a>
    </h1>
    <div class="flex flex-col gap-4">
      <p>Basic usage is to create an instance of the Select class and then use the exposed props to build your UI.</p>
      <p>
        The library is completely unstyled and you're free to structure your HTML however you want. Feel free to take
        inspiration from the <a
          class="text-indigo-500 hover:text-indigo-800"
          href="https://github.com/adamnyberg/svelte-headless-components/tree/main/src/lib/demo/select"
          >demo components</a
        > I created at .
      </p>
    </div>

    <SimpleSelect />
    <hr />

    <Example select={selects[2]} showSearch>All options with sub menus</Example>
    <Example select={selects[0]}>Select</Example>
    <Example select={selects[1]}>Multi select</Example>
    <div>
      <h2 class="text-xl">Multi with additions inside of popover</h2>
      <button
        use:popoverTrigger
        class="border border-slate-300 focus:outline-none focus:border-sky-600 rounded-md px-2 py-1"
      >
        Open popover with select
      </button>
      {#if $popoverIsOpen}
        <div use:popoverContent class="z-10 bg-white h-60 w-60 border p-6 border-slate-300 rounded-md shadow-md">
          <Svelect
            select={multiWithAdd}
            showSearch
            inputPlaceholder="Search or add..."
            on:add={({ detail }) => {
              console.log('on:add', detail);
              const newOption = Select.inputToOptionItem({ label: detail.searchText, isMulti: true, selected: true });
              const newOptions = [...get(multiWithAdd.state.options), newOption];
              multiWithAdd.inputOptions.set(newOptions);
              multiWithAdd.setActive(newOption);
            }}
          />
        </div>
      {/if}
    </div>
    <div class="">
      <h2 class="text-xl">
        Context menu <span class="text-sm">(try right click)</span>:
        <span class="text-sm">{$contextSelected.map((o) => o.id).join(',')}</span>
      </h2>
      <button
        class="w-96 h-60 border border-slate-300 rounded-md hover:cursor-default"
        use:element={contextSelect.elements.trigger}
      />
      {#if $contextIsOpen}
        <Content select={contextSelect} />
      {/if}
    </div>
  </div>
</div>
