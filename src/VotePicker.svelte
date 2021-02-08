<script lang="ts">
  import { playerStore, playerId, sendMessage } from './store';
  import { getVoteAgainstPayload } from './wsHelper';
  $: players = $playerStore;
  
  function handleClick(selected: string) {
    sendMessage(getVoteAgainstPayload(selected));
  }
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
        <button on:click={() => handleClick(player)}> {player} </button>
      </p>
    {/if}
  {/each}
</main>
