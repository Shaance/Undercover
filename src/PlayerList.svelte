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
  <ul>
    {#each players as player}
      <li> {@html formatName($playerId, player)} </li>
    {/each}
  </ul>
</main>

<style>
  li {
    text-align: left;
  }
</style>