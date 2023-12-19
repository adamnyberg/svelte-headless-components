import { createId } from '@paralleldrive/cuid2';
import {
  createFloatingActions,
  type ComputeConfig,
  type ContentAction,
  type ReferenceAction,
  type UpdatePosition,
} from 'svelte-floating-ui';
import { flip, type VirtualElement } from 'svelte-floating-ui/dom';
import { get, type Writable } from 'svelte/store';

export type FloatingUiNode = HTMLElement | Writable<VirtualElement> | VirtualElement;

export function isElementInPopover(srcElement: EventTarget | null): boolean {
  if (!srcElement) return false;
  return !!(srcElement as HTMLElement).closest('[data-popover-id]');
}

const defaultFloatingUiOptions = {
  strategy: 'absolute' as const,
  placement: 'bottom-start' as const,
  middleware: [flip()],
};

export type Options = {
  floatingUi?: Partial<ComputeConfig>;
};

export function createPopover(
  isOpen: Writable<boolean>,
  options?: Options,
): [ReferenceAction, ContentAction, UpdatePosition] {
  const id = createId();

  function customTrigger(node: FloatingUiNode) {
    function triggerClick(e: MouseEvent) {
      isOpen.update((value) => !value);
    }

    function clickOutside(e: MouseEvent) {
      const clickedNode = (e.target as HTMLElement).closest(`[data-popover-id="${id}"]`);
      let clickedNodeId;
      if (clickedNode) {
        clickedNodeId = (clickedNode as HTMLElement).dataset.popoverId;
      }
      if (node instanceof HTMLElement && clickedNodeId !== id && !e.defaultPrevented && get(isOpen)) {
        isOpen.set(false);
      }
    }

    if (node instanceof HTMLElement) {
      node.dataset.popoverId = id;
      node.addEventListener('mouseup', triggerClick);
    }

    document.addEventListener('mouseup', clickOutside);
    return {
      destroy: () => {
        if (node instanceof HTMLElement) {
          node.removeEventListener('mouseup', triggerClick);
        }
        document.removeEventListener('mouseup', clickOutside);
      },
    };
  }

  function customContent(node: HTMLElement) {
    node.dataset.popoverId = id;
    return {
      destroy: () => {},
    };
  }

  const [floatingTrigger, floatingContent, update] = createFloatingActions({
    ...defaultFloatingUiOptions,
    ...options?.floatingUi,
  });

  const triggerActions = [customTrigger, floatingTrigger];

  function triggerAction(node: FloatingUiNode) {
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
