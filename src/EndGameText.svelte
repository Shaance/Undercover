<script lang="ts">
  import { Status } from "./wsTypes";
  import { voteResult, undercoverCount } from "./store";

  $: gameState = $voteResult.gameState;
  $: goodWord = $voteResult.goodWord;
  $: undercoverWord = $voteResult.undercoverWord;
  function getEndGameText(state: Status) {
    const suffix = `won the game!`;
    if (state === Status.WON) {
      return `Cilivians ${suffix}`;
    }
    return `Vilains ${suffix}`;
  }
</script>

<main>
  <div class="end">
    <p class="words">{`Good word was: ${goodWord}`}</p>
    {#if $undercoverCount > 0}
      <p class="words">{`Undercover word was: ${undercoverWord}`}</p>
    {/if}
    <p class="end-text">{getEndGameText(gameState)}</p>
  </div>
</main>

<style>
  .end-text {
    font-size: 1.35em;
    font-weight: 350;
  }

  .words {
    font-size: 1.15em;
    font-weight: 150;
  }
  .end {
    margin-top: 30px;
    margin-bottom: 20px;
  }
</style>
