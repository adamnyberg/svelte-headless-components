import { BROWSER } from 'esm-env';

export function getBackdropNode() {
  if (BROWSER) {
    const node = document.createElement('div');
    node.style.position = 'fixed';
    node.style.top = '0';
    node.style.left = '0';
    node.style.zIndex = '30';
    node.style.width = '100vw';
    node.style.height = '100vh';
    node.style.display = 'none';
    return node;
  } else {
    return null;
  }
}

export function showBackdrop(backdropNode: HTMLElement, behindNode: HTMLElement) {
  const computedZIndex = getComputedStyle(behindNode).zIndex;
  let zIndex = computedZIndex ? parseInt(computedZIndex) : 1;
  const parent = behindNode.parentNode;
  if (backdropNode && parent) {
    parent.prepend(backdropNode);
    zIndex -= 1;
    backdropNode.style.zIndex = zIndex.toString();
    backdropNode.style.display = 'block';
  }
}

export function hideBackdrop(backdropNode: HTMLElement) {
  backdropNode.style.display = 'none';
}
