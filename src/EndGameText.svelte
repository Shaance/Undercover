<script lang="ts">
  import { Status } from "./wsTypes";
  import { voteResult } from "./store";

  $: gameState = $voteResult.gameState;
  function getEndGameText(state: Status) {
    const suffix = `won the game!`;
    if (state === Status.WON) {
      return `Cilivians ${suffix}`;
    }
    return `Vilains ${suffix}`;
  }
</script>

<main>
  <div class="end">{getEndGameText(gameState)}</div>
</main>

<style>
  .end {
    margin-top: 30px;
    margin-bottom: 20px;
    font-size: 1.35em;
    font-weight: 350;
  }
</style>
