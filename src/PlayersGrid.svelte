<script lang="ts">
  import { playerToWords, votedOutPlayers } from "./store";
  import { receive } from "./Animations";
  import { flip } from "svelte/animate";
  // TODO try to fix when too many items

  function getPlayerText(votedOutPlayers: string[], player: string) {
    if (votedOutPlayers.indexOf(player) !== -1) {
      return `<div style="color: grey;"><s>${player}</s></div>`;
    }
    return `<div>${player}</div>`;
  }
</script>

<main>
  {#each $playerToWords as entry}
    <div class="card">
      <div>{@html getPlayerText($votedOutPlayers, entry[0])}</div>
      <p>* * *</p>
      {#each entry[1] as word, _ (word)}
        <p class="item" in:receive={{ key: word }} animate:flip>
          {word}
        </p>
      {/each}
    </div>
  {/each}
</main>

<style>
  main {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
  }

  .card {
    min-width: 100px;
    min-height: 200px;
    border: 0;
  }

  .item {
    /* flex: 1; */
    display: flex;
    flex-direction: column;
  }

  p {
    font-size: 1em;
    font-weight: 100;
    margin-bottom: 0;
  }
</style>
