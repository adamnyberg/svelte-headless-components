import { BROWSER } from 'esm-env';
import { get, writable } from 'svelte/store';

const backdropNode = writable<HTMLDivElement | null>(null);

function setUpBackdrop() {
  if (BROWSER) {
    const node = document.createElement('div');
    node.style.position = 'fixed';
    node.style.top = '0';
    node.style.left = '0';
    node.style.zIndex = '30';
    node.style.width = '100vw';
    node.style.height = '100vh';
    node.style.display = 'none';
    document.body.prepend(node);

    backdropNode.set(node);
    return node;
  } else {
    return null;
  }
}

export function getBackdropNode() {
  let node = get(backdropNode);
  if (node === null) {
    node = setUpBackdrop();
  }
  return node;
}

export function showBackdrop(behindNode: HTMLElement) {
  const computedZIndex = getComputedStyle(behindNode).zIndex;
  let zIndex = computedZIndex ? parseInt(computedZIndex) : 1;
  const node = getBackdropNode();
  if (node) {
    zIndex -= 1;
    node.style.zIndex = zIndex.toString();
    node.style.display = 'block';
  }
}

export function hideBackdrop() {
  const node = getBackdropNode();
  if (node) {
    node.style.display = 'none';
  }
}
