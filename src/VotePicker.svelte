<script lang="ts">
  import { stillInGamePlayers, playerId, sendMessage, roomId } from "./store";
  import { getVoteAgainstPayload } from "./wsHelper";
  $: players = $stillInGamePlayers;

  function handleClick(selected: string) {
    sendMessage(getVoteAgainstPayload(selected, $roomId));
  }
</script>

<main>
  <h2>Vote against</h2>
  {#each players as player, _ (player)}
    {#if player !== $playerId}
      <p>
        <button class="btn btn-light" on:click={() => handleClick(player)}> {player} </button>
      </p>
    {/if}
  {/each}
</main>

<style>
  h2 {
    color: darkslateblue;
    font-size: 1.5em;
    font-weight: 350;
  }
  button {
    border: none;
  }
</style>
