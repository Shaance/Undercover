<script lang="ts">
  import { playerStore, playerId } from './store';
  $: players = $playerStore;

  function formatName(playerId: string, currentPlayer: string) {
    return playerId === currentPlayer 
      ? `<b> ${currentPlayer} <b>`
      : currentPlayer;
  }
</script>

<main>
  <h3> Connected players </h3>
    {#each players as player}
      <p> {@html formatName($playerId, player)} </p>
    {/each}
</main>
