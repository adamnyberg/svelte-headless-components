import { BROWSER } from 'esm-env';
import type { ComputeConfig } from 'svelte-floating-ui';
import type { Action } from 'svelte/action';
import { get, writable, type Writable } from 'svelte/store';
import { createPopover, defaultVirtualPosition } from '../popover/popover.js';
import type { VirtualElement } from '@floating-ui/core';

type OptionBase = {
  id: string;
  label: string;
  active: boolean;
  parent: OptionMenu | null;
  data?: Record<string, any>;
  disabled: boolean;
};

export type OptionSelect = OptionBase & {
  type: 'select';
  selected: boolean;
  isMulti: boolean;
};
export type InputOptionSelect = Partial<Omit<OptionSelect, 'label'>> & Pick<OptionSelect, 'label'>;

export type OptionMenu = OptionBase & {
  type: 'menu';
  hasSelected: boolean;
  subOptions: OptionItem[];
};
export type InputOptionMenu = Partial<Omit<OptionMenu, 'label' | 'subOptions'>> &
  Pick<OptionMenu, 'label'> & { subOptions: InputOptionItem[] };

export type CloseOnSelect = 'never' | 'always' | 'not_multi';

export type Addition = {
  id: string;
  label: string;
};
export type SelectConfig = {
  closeOnSelect: CloseOnSelect;
  minSearchLength: number;
  triggerEvent?: 'contextmenu' | 'mouseup';
  activeOnOpen?: boolean;
  additions: Addition[];
  floatingUiOptions?: Partial<ComputeConfig>;
  useVirtualElement?: boolean;
  validateAddition?: (search: string) => boolean;
};

export type AddOption = {
  err: false;
  id: string;
  searchText: string;
};

export type AddOptionFail = {
  err: true;
  id: string;
  searchText: string;
};

export type AddOptionResult = AddOption | AddOptionFail;

export type OptionItem = OptionSelect | OptionMenu;

export type InputOptionItem = InputOptionMenu | InputOptionSelect;

export type WritableElement = Writable<HTMLElement | null>;
export type WritableOptions = [Writable<HTMLElement[]>, OptionItem];

const searchOptionPrefix = 'search';

export const element: Action<HTMLElement, WritableElement | WritableOptions> = (node, input) => {
  if (Array.isArray(input)) {
    const [writableOptions, option] = input;
    node.dataset.id = option.id;
    if (option.disabled) {
      node.dataset.disabled = 'true';
      if (allowDisabledAttribute(node)) {
        node.disabled = true;
      }
    }
    writableOptions.set([...get(writableOptions), node]);
    return {
      destroy() {
        writableOptions.set(get(writableOptions).filter((e) => e !== node));
      },
    };
  } else {
    input.set(node);
    return {
      destroy() {
        input.set(null);
      },
    };
  }
};

export class Select {
  inputOptions: Writable<InputOptionItem[]>;
  config: SelectConfig;

  readonly elements = {
    search: writable<HTMLInputElement | null>(null),
    options: writable<HTMLElement[]>([]),
    trigger: writable<HTMLElement | null>(null),
    content: writable<HTMLElement | null>(null),
  };

  readonly events = {
    onSelect: writable<OptionSelect>(),
    onChange: writable<OptionSelect>(),
    onAdd: writable<AddOptionResult>(),
  };

  readonly state = {
    isOpen: writable(false),
    selected: writable<OptionSelect[]>(),
    search: writable(''),
    options: writable<OptionItem[]>(),
    filteredOptions: writable<OptionItem[]>(),
    searchOptions: writable<OptionSelect[]>([]),
    additionOptions: writable<OptionSelect[]>([]),
  };

  constructor(inputOptions: InputOptionItem[], inputConfig: Partial<SelectConfig> = {}) {
    const config = {
      additions: [],
      closeOnSelect: 'not_multi' as const,
      minSearchLength: 1,
      activeOnOpen: true,
      useVirtualElement: false,
      triggerEvent: 'mouseup' as const,

      ...inputConfig,
    };
    const options = inputOptions.map((option) => Select.inputToOptionItem(option));

    this.inputOptions = writable(inputOptions);
    this.config = config;

    this.state.options = writable(options);
    this.state.filteredOptions = writable(options);
    this.state.selected = writable(Select.toFlatSelect(options).filter((option) => option.selected));

    this.inputOptions.subscribe((inputOptions) => {
      const options = inputOptions.map((option) => Select.inputToOptionItem(option));
      this.state.options.set(options);
    });

    this.state.options.subscribe((options) => {
      const newSelected = Select.toFlatSelect(options).filter((option) => option.selected);
      this.state.selected.set(newSelected);

      this.updateFilteredOptions(options);
    });

    this.state.isOpen.subscribe((isOpen) => {
      if (isOpen) {
        this.open();
      } else {
        this.close();
      }
    });

    this.state.search.subscribe((search) => {
      this.onSearchChange(search);
    });

    this.elements.search.subscribe((search) => {
      if (search) {
        search.focus();
        search.addEventListener('input', (e) => {
          this.state.search.set((e.target as HTMLInputElement).value);
        });
      }
    });

    this.elements.options.subscribe((options) => {
      for (const option of options) {
        if (option.dataset.eventListenersAdded === 'true') {
          continue;
        }
        option.dataset.eventListenersAdded = 'true';

        option.addEventListener('mouseup', () => {
          const id = option.dataset.id ?? '';
          if (this.isAddOptionId(id)) {
            this.addOption(id);
          } else {
            this.selectOption(id);
          }
        });

        option.addEventListener('mouseenter', () => {
          this.setActiveId(option.dataset.id ?? '');
        });
      }
    });

    this.setUpFloatingUi(config);

    if (BROWSER) {
      document.addEventListener('keydown', (e) => this.onKeyDown(e));
      document.addEventListener('keyup', (e) => this.onKeyUp(e));
    }
  }

  private open(): void {
    if (this.config.activeOnOpen) {
      const selected = get(this.state.selected);
      if (selected.length > 0) {
        this.setActive(selected[0]);
      } else {
        this.setFirstActive();
      }
    } else {
      this.setActive(null);
    }
    get(this.elements.trigger)?.blur();
  }

  private close(): void {
    this.state.search.set('');
    this.setActive(null);
  }

  selectOption(id: string): OptionSelect | null {
    if (this.isSearchOptionId(id)) {
      id = id.split(':').at(-1) ?? '';
    }

    const option = this.getSelectOption(id);
    if (option === null) {
      return null;
    }
    if (option.disabled) {
      return null;
    }

    const previousSelected = option.selected ? true : false;

    if (!option.isMulti) {
      const optionsFlat = Select.toFlat(get(this.state.options));
      for (const o of optionsFlat) {
        if (o.type === 'select') {
          o.selected = false;
        } else {
          o.hasSelected = false;
        }
      }

      let parent = option.parent;
      while (parent) {
        parent.hasSelected = true;
        parent = parent.parent;
      }
    }

    option.selected = option.isMulti ? !option.selected : true;

    this.state.options.set(get(this.state.options));
    this.updateSearchOptions();

    this.events.onSelect.set(option);
    if (option.selected !== previousSelected) {
      this.events.onChange.set(option);
    }

    if (this.shouldClose(option)) {
      this.state.isOpen.set(false);
    }

    return option;
  }

  addOption(id: string) {
    const option = this.getSelectOption(id);
    if (option === null) {
      return null;
    }

    if (this.config.validateAddition && !this.config.validateAddition(get(this.state.search))) {
      this.events.onAdd.set({ err: true, id: option.id, searchText: get(this.state.search) });
    } else {
      this.events.onAdd.set({ err: false, id: option.id, searchText: get(this.state.search) });
      this.resetSearch();
    }
  }

  getMenuOptions(): OptionMenu[] {
    return Select.toFlat(get(this.state.options)).filter((option) => option.type === 'menu') as OptionMenu[];
  }

  getOption(id: string): OptionItem | null {
    const option = Select.toFlat(this.getAllOptions()).find((option) => option.id === id);
    return option ?? null;
  }

  getSelectOption(id: string): OptionSelect | null {
    const option = this.getOption(id);
    if (option === null || option.type === 'menu') {
      return null;
    }
    return option;
  }

  getActiveLeaf(): OptionItem | null {
    const active = this.getActiveList();
    if (active.length === 0) {
      return null;
    }
    return active.at(-1) ?? null;
  }

  getActiveList(): OptionItem[] {
    return Select.toFlat(this.getAllOptions()).filter((option) => option.active);
  }

  setActiveId(id: string | null): void {
    const option = this.getOption(id ?? '');
    this.setActive(option);
  }

  setActive(setOption: OptionItem | null): void {
    const optionsFlat = Select.toFlat(get(this.state.options));
    const filteredOptions = get(this.state.filteredOptions);
    const searchOptions = get(this.state.searchOptions);
    const addOptions = get(this.state.additionOptions);

    for (const option of [...optionsFlat, ...searchOptions, ...addOptions]) {
      if (setOption && setOption.id === option.id) {
        option.active = true;
      } else {
        option.active = false;
      }
    }

    if (setOption !== null && !this.isSearchOptionId(setOption.id)) {
      let parent = setOption?.parent;
      while (parent) {
        parent.active = true;
        parent = parent.parent;
      }
    }

    this.state.options.set(get(this.state.options));
    this.state.filteredOptions.set(filteredOptions);
    this.state.searchOptions.set(get(this.state.searchOptions));
    this.state.additionOptions.set(get(this.state.additionOptions));
  }

  setPrevActive(): void {
    const active = this.getActiveLeaf();
    if (active === null) {
      this.setFirstActive();
      return;
    }
    const siblings = this.getSiblings(active);

    const activeIndex = siblings.findIndex((option) => option.id === active.id);
    const prevIndex = Math.max(activeIndex - 1, 0);
    const prev = siblings[prevIndex];
    this.setActive(prev);
  }

  setNextActive(): void {
    const active = this.getActiveLeaf();
    if (active === null) {
      this.setFirstActive();
      return;
    }
    const siblings = this.getSiblings(active);

    const activeIndex = siblings.findIndex((option) => option.id === active.id);
    const nextIndex = Math.min(activeIndex + 1, siblings.length - 1);
    const next = siblings[nextIndex];

    this.setActive(next);
  }

  setParentActive(): void {
    const active = this.getActiveLeaf();
    if (active === null) {
      this.setFirstActive();
      return;
    }
    const parent = active.parent;
    if (parent === null) {
      return;
    }
    active.active = false;
    this.setActive(parent);
  }

  setChildActive(): void {
    const active = this.getActiveLeaf();
    if (active === null) {
      this.setFirstActive();
      return;
    }
    if (active.type === 'menu' && active.subOptions.length > 0) {
      const first = active.subOptions[0];
      this.setActive(first);
    }
  }

  resetSearch() {
    const searchElement = get(this.elements.search);
    if (searchElement) {
      searchElement.value = '';
    }
    this.state.search.set('');
  }

  private onSearchChange(search: string) {
    if (this.config.additions.length > 0) {
      this.updateAddableOption(search);
    }
    const options = get(this.state.options);

    if (search.length >= this.config.minSearchLength) {
      const filtered = options.filter((option) => filterText(option, search));
      const subSelectOptions = Select.toFlatSelect(options)
        .filter((o) => o.parent !== null && filterText(o, search))
        .map(Select.toSearchOption);
      this.state.filteredOptions.set(filtered);
      this.state.searchOptions.set(subSelectOptions);
    } else {
      this.state.filteredOptions.set(options);
      this.state.searchOptions.set([]);
    }

    this.setFirstActive();
  }

  private isSearchOptionId(id: string): boolean {
    return id.startsWith(searchOptionPrefix);
  }

  private isAddOptionId(id: string): boolean {
    const option = get(this.state.additionOptions).find((option) => option.id === id);
    return option !== undefined;
  }

  private updateFilteredOptions(options: OptionItem[]) {
    const search = get(this.state.search);
    if (search === undefined || search.length < this.config.minSearchLength) {
      this.state.filteredOptions.set(options);
      return;
    }

    const filtered = options.filter(
      (option) => search && search.length >= this.config.minSearchLength && filterText(option, search),
    );
    this.state.filteredOptions.set(filtered);
  }

  private updateSearchOptions() {
    const search = get(this.state.search);
    const active = this.getActiveLeaf();

    const subSelectOptions = [];
    for (const option of Select.toFlatSelect(get(this.state.options))) {
      if (option.parent !== null && filterText(option, search)) {
        const newOption = Select.toSearchOption(option);
        if (active?.id === newOption.id) {
          newOption.active = true;
        }
        subSelectOptions.push(newOption);
      }
    }
    this.state.searchOptions.set(subSelectOptions);
  }

  static toFlat(options: OptionItem[]): OptionItem[] {
    const flat: OptionItem[] = [];
    for (const option of options) {
      flat.push(option);
      if (option.type === 'menu') {
        flat.push(...Select.toFlat(option.subOptions));
      }
    }
    return flat;
  }

  static getParentLabels(option: OptionItem): string[] {
    const labels = [];
    let parent = option.parent;
    while (parent) {
      labels.push(parent.label);
      parent = parent.parent;
    }
    return labels.reverse();
  }

  static toFlatSelect(options: OptionItem[]): OptionSelect[] {
    return Select.toFlat(options).filter((option) => option.type === 'select') as OptionSelect[];
  }

  private getSiblings(option: OptionItem): OptionItem[] {
    if (option.parent && !this.isSearchOptionId(option.id)) {
      return option.parent.subOptions;
    }

    if (get(this.state.search).length >= this.config.minSearchLength) {
      return this.getShowingSearchOptions();
    }

    return get(this.state.filteredOptions);
  }

  private setFirstActive() {
    const filteredOptions = get(this.state.filteredOptions);
    const searchOptions = get(this.state.searchOptions);
    const addOptions = get(this.state.additionOptions);
    if (filteredOptions.length > 0) {
      this.setActive(filteredOptions[0]);
    } else if (searchOptions.length > 0) {
      this.setActive(searchOptions[0]);
    } else if (addOptions.length > 0) {
      this.setActive(addOptions[0]);
    }
  }

  private getAllOptions(): OptionItem[] {
    return [...get(this.state.options), ...get(this.state.searchOptions), ...get(this.state.additionOptions)];
  }

  private getShowingSearchOptions(): OptionItem[] {
    return [...get(this.state.filteredOptions), ...get(this.state.searchOptions), ...get(this.state.additionOptions)];
  }

  private static toSearchOption(option: OptionSelect): OptionSelect {
    return {
      ...option,
      id: [searchOptionPrefix, ...Select.getParentLabels(option)].join(':') + ':' + option.id,
    };
  }

  private shouldClose(option: OptionSelect): boolean {
    const closeOnSelect = this.config.closeOnSelect;
    return closeOnSelect === 'always' || (!option.isMulti && closeOnSelect === 'not_multi');
  }

  static inputToOptionItem(input: InputOptionItem, parent?: OptionItem): OptionItem {
    input.type = input.type ?? 'select';
    switch (input.type) {
      case 'select':
        const withDefaults = {
          id: input.label,
          selected: false,
          active: false,
          parent: parent ?? null,
          isMulti: false,
          disabled: parent?.disabled ?? false,
          ...input,
        } as OptionSelect;
        return withDefaults;

      case 'menu':
        const menuOption = {
          ...{
            type: 'menu',
            id: input.label,
            active: false,
            hasSelected: false,
            parent: parent ?? null,
            subOptions: [],
            disabled: parent?.disabled ?? false,
          },
          ...input,
        } as OptionMenu;

        const subOptions = input.subOptions.map((o) => {
          return Select.inputToOptionItem(o, menuOption);
        });
        menuOption.subOptions = subOptions;

        return menuOption;
    }
  }

  private updateAddableOption(search: string) {
    const addOptions = [];
    if (search.length >= this.config.minSearchLength) {
      for (const addition of this.config.additions) {
        addOptions.push({
          id: addition.id,
          label: addition.label,
          active: false,
          parent: null,
          selected: false,
          isMulti: false,
          disabled: false,
          type: 'select' as const,
        });
      }
    }
    this.state.additionOptions.set(addOptions);
  }

  onTriggerMouseUp(event: MouseEvent, isOpen: Writable<boolean>) {
    if (event.target === get(this.elements.trigger)) {
      if (isOpen) {
        this.state.isOpen.set(false);
      } else {
        this.state.isOpen.set(true);
      }
    }
  }

  onKeyDown(event: KeyboardEvent) {
    if (get(this.state.isOpen)) {
      switch (event.code) {
        case 'Tab':
        case 'ArrowDown':
        case 'ArrowUp':
          event.preventDefault();
          break;
      }
    }
  }

  onKeyUp(event: KeyboardEvent) {
    const isOpen = get(this.state.isOpen);
    if (!isOpen && event.code === 'Enter' && document.activeElement === get(this.elements.trigger)) {
      this.state.isOpen.set(true);
      return;
    }

    if (isOpen) {
      switch (event.code) {
        case 'Escape':
          this.state.isOpen.set(false);
          break;

        case 'Enter': {
          const activeOption = this.getActiveLeaf();
          if (!activeOption) {
            return;
          }
          if (activeOption.type === 'select') {
            const addOptions = get(this.state.additionOptions);
            const isActiveAdd = addOptions.some((option) => option.id === activeOption.id);
            if (isActiveAdd) {
              this.addOption(activeOption.id);
            } else {
              this.selectOption(activeOption.id);
            }
          } else {
            this.setChildActive();
          }
          break;
        }

        case 'ArrowDown':
          this.setNextActive();
          break;

        case 'ArrowUp':
          this.setPrevActive();
          break;

        case 'ArrowLeft':
          this.setParentActive();
          break;

        case 'ArrowRight':
          this.setChildActive();
          break;

        case 'Tab':
          event.preventDefault();
          if (event.shiftKey) {
            this.setPrevActive();
          } else {
            this.setNextActive();
          }
          break;
      }
    }
  }

  private setUpFloatingUi(config: SelectConfig) {
    let virtualElement = config.useVirtualElement ? writable<VirtualElement>(defaultVirtualPosition()) : undefined;
    const [floatingTrigger, floatingContent] = createPopover(this.state.isOpen, {
      floatingUi: config.floatingUiOptions,
      virtualElement,
      triggerEvent: config.triggerEvent,
    });

    this.elements.trigger.subscribe((node) => {
      if (node) {
        floatingTrigger(node);
      }
    });

    this.elements.content.subscribe((node) => {
      if (node) {
        floatingContent(node);
        node.focus();
      }
    });
  }
}

export function filterText(option: OptionItem, input = '') {
  return option.label.toLowerCase().includes(input.toLowerCase());
}

function allowDisabledAttribute(node: HTMLElement) {
  return (
    node instanceof HTMLButtonElement ||
    node instanceof HTMLFieldSetElement ||
    node instanceof HTMLOptGroupElement ||
    node instanceof HTMLOptionElement ||
    node instanceof HTMLSelectElement ||
    node instanceof HTMLTextAreaElement ||
    node instanceof HTMLInputElement
  );
}
