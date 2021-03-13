<script lang="ts">
  import { playerStore, playerId } from "./store";
  import { flip } from "svelte/animate";
  import { send, receive } from "./Animations";

  $: players = $playerStore;

  function formatName(playerId: string, currentPlayer: string) {
    return playerId === currentPlayer
      ? `<b> ${currentPlayer} <b>`
      : currentPlayer;
  }
</script>

<main>
  <h2>Connected players</h2>
  {#each players as player, _ (player)}
    <p
      in:receive={{ key: $playerId }}
      out:send={{ key: $playerId }}
      animate:flip
    >
      {@html formatName($playerId, player)}
    </p>
  {/each}
</main>

<style>
  h2 {
    color: darkslateblue;
    font-size: 1.5em;
    font-weight: 350;
    padding-top: 0%;
  }
</style>
