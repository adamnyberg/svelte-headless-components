import { createId } from '@paralleldrive/cuid2';
import { createFloatingActions, type ComputeConfig } from 'svelte-floating-ui';
import { flip } from 'svelte-floating-ui/dom';
import { get, type Writable } from 'svelte/store';

export function isElementInPopover(srcElement: EventTarget | null): boolean {
  if (!srcElement) return false;
  return !!(srcElement as HTMLElement).closest('[data-popover-id]');
}

const defaultOptions = {
  strategy: 'absolute' as const,
  placement: 'bottom-start' as const,
  middleware: [flip()],
};

export function createPopover(isOpen: Writable<boolean>, options?: Partial<ComputeConfig>) {
  options = { ...defaultOptions, ...options };
  const id = createId();

  function customTrigger(node: HTMLElement) {
    function nodeClick() {
      isOpen.update((value) => !value);
    }

    function clickOutside(e: MouseEvent) {
      const clickedNode = (e.target as HTMLElement).closest(`[data-popover-id="${id}"]`);
      let clickedNodeId;
      if (clickedNode) {
        clickedNodeId = (clickedNode as HTMLElement).dataset.popoverId;
      }
      if (node && clickedNodeId !== id && !e.defaultPrevented) {
        isOpen.set(false);
      }
    }

    function keyUp(event: KeyboardEvent) {
      if (get(isOpen) && event.key === 'Escape') {
        isOpen.set(false);
      }
    }

    node.dataset.popoverId = id;

    node.addEventListener('click', nodeClick);
    document.addEventListener('click', clickOutside);
    document.addEventListener('keyup', keyUp);
    return {
      destroy: () => {
        node.removeEventListener('click', nodeClick);
        document.removeEventListener('click', clickOutside);
        document.removeEventListener('keyup', keyUp);
      },
    };
  }

  function customContent(node: HTMLElement) {
    node.dataset.popoverId = id;
    node.focus();
    return {
      destroy: () => {},
    };
  }

  const [floatingTrigger, floatingContent, update] = createFloatingActions(options);

  const triggerActions = [customTrigger, floatingTrigger];

  function triggerAction(node: HTMLElement) {
    const destructors = triggerActions.map((action) => action(node));

    return {
      destroy() {
        destructors.forEach((destructor) => {
          if (typeof destructor?.destroy === 'function') destructor.destroy();
        });
      },
    };
  }

  const contentActions = [floatingContent, customContent];

  function contentAction(node: HTMLElement) {
    contentActions.map((action) => action(node));
    return {
      destroy() {},
    };
  }

  return [triggerAction, contentAction, update];
}
