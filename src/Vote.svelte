<script lang="ts">
  import { playerStore, playerId } from './store';
  $: players = $playerStore;
</script>

<style>
  h2 {
    color:darkslateblue;
    font-size: 1.5em;
    font-weight: 350;
  }

  button {
    border: none;
  }
</style>

<main>
  <h2>Vote against</h2>
  {#each players as player, _ (player)}
    {#if player !== $playerId}
      <p>
        <button> {player} </button>
      </p>
    {/if}
  {/each}
</main>
