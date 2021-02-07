import { quintOut } from 'svelte/easing';
import { crossfade } from 'svelte/transition';

const [s, r] = crossfade({
  duration: d => Math.sqrt(d * 200),

  fallback(node) {
    const style = getComputedStyle(node);
    const transform = style.transform === 'none' ? '' : style.transform;

    return {
      duration: 600,
      easing: quintOut,
      css: t => `
        transform: ${transform} scale(${t});
        opacity: ${t}
      `
    };
  }
});

export const send = s;
export const receive = r;
