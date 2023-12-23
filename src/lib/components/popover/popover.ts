import { BROWSER } from 'esm-env';
import {
  createFloatingActions,
  type ComputeConfig,
  type ContentAction,
  type ReferenceAction,
  type UpdatePosition,
} from 'svelte-floating-ui';
import { flip, offset, shift, type VirtualElement } from 'svelte-floating-ui/dom';
import { get, type Writable } from 'svelte/store';
import { getBackdropNode, hideBackdrop, showBackdrop } from './backdrop.js';

export type FloatingUiNode = HTMLElement | Writable<VirtualElement> | VirtualElement;

export function defaultVirtualPosition() {
  return {
    getBoundingClientRect: () => {
      return {
        x: 0,
        y: 0,
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,
        width: 0,
        height: 0,
      };
    },
  };
}
export function setVirtualPosition(element: Writable<VirtualElement>, x: number, y: number) {
  element.set({
    getBoundingClientRect: () => {
      return {
        x,
        y,
        top: y,
        left: x,
        bottom: y,
        right: x,
        width: 0,
        height: 0,
      };
    },
  });
}

function defaultFloatingUiConfig(triggerEvent: TriggerEvent): ComputeConfig {
  return triggerEvent === 'mouseup'
    ? {
        strategy: 'absolute' as const,
        placement: 'bottom-start' as const,
        middleware: [flip()],
      }
    : {
        strategy: 'absolute' as const,
        placement: 'right-start' as const,
        middleware: [offset(8), shift()],
      };
}

export type TriggerEvent = 'mouseup' | 'contextmenu';
export type Config = {
  triggerEvent?: TriggerEvent;
  virtualElement?: Writable<VirtualElement>;
  floatingUi?: Partial<ComputeConfig>;
};

export function createPopover(
  isOpen: Writable<boolean>,
  config?: Config,
): [ReferenceAction, ContentAction, UpdatePosition] {
  function customTrigger(node: HTMLElement) {
    function triggerClick(e: MouseEvent) {
      if (isBackdropClicking && triggerEvent !== 'contextmenu') {
        return;
      }

      if (triggerEvent === 'contextmenu') {
        e.preventDefault();
      }

      isOpen.set(true);

      if (config?.virtualElement) {
        setVirtualPosition(config.virtualElement, e.clientX, e.clientY);
      }
    }

    function backdropMouseDown(e: MouseEvent) {
      if (e.buttons === 1) {
        isBackdropClicking = true;
      } else if (get(isOpen)) {
        isOpen.set(false);
        isBackdropClicking = false;
      }
    }
    function backdropMouseUp() {
      if (isBackdropClicking) {
        isOpen.set(false);
      }
      isBackdropClicking = false;
    }

    let isBackdropClicking = false;

    if (BROWSER) {
      node.addEventListener(triggerEvent, triggerClick);
      backdropNode?.addEventListener('mousedown', backdropMouseDown);
      backdropNode?.addEventListener('click', backdropMouseUp);
    }
    return {
      destroy: () => {
        if (BROWSER) {
          node.removeEventListener(triggerEvent, triggerClick);
          backdropNode?.removeEventListener('mousedown', backdropMouseDown);
          backdropNode?.removeEventListener('click', backdropMouseUp);
        }
      },
    };
  }

  function customContent(node: HTMLElement) {
    if (backdropNode) {
      showBackdrop(backdropNode, node);
      node.style.position = config?.floatingUi?.strategy ?? 'absolute';
    }
    return {
      destroy: () => {
        console.log('destroy:customContent');
      },
    };
  }

  const triggerEvent = config?.triggerEvent ?? 'mouseup';
  const backdropNode = getBackdropNode();
  isOpen.subscribe((value) => {
    if (!value && backdropNode) {
      hideBackdrop(backdropNode);
    }
  });

  const [floatingTrigger, floatingContent, update] = createFloatingActions({
    ...defaultFloatingUiConfig(triggerEvent),
    ...config?.floatingUi,
  });

  function triggerAction(node: HTMLElement) {
    const destructors = [
      customTrigger(node),
      config?.virtualElement ? floatingTrigger(config.virtualElement) : floatingTrigger(node),
    ];

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
