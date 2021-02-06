<script lang="ts">
  import { flip } from 'svelte/animate';
  import { quintOut } from 'svelte/easing';
	import { crossfade } from 'svelte/transition';
  import { playerStore, playerId } from './store';
  $: players = $playerStore;

  function formatName(playerId: string, currentPlayer: string) {
    return playerId === currentPlayer 
      ? `<b> ${currentPlayer} <b>`
      : currentPlayer;
  }

  const [send, receive] = crossfade({
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
</script>

<main>
  <h3>Connected players</h3>
    {#each players as player, _ (player)}
      <p 
        in:receive="{{key: $playerId}}"
        out:send="{{key: $playerId}}"
        animate:flip
      > 
        {@html formatName($playerId, player)}
      </p>
    {/each}
</main>
