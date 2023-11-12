import type { ComponentType } from 'svelte';

export type SelectComponents = {
  item: ComponentType;
  button: ComponentType;
  addTextButton: ComponentType;
};

export type SelectOption = {
  value: string | null;
  label: string;
  selected: boolean;
  active: boolean;
  data?: Record<string, any>;
};

export type SelectClasses = {
  select?: string;
  dropdown?: string;
  itemButton?: string;
  input?: string;
  inputDiv?: string;
};

export function filterInput(input: string, option: SelectOption) {
  return option.label.toLowerCase().includes(input.toLowerCase());
}
