<script lang="ts">
  import { ownWord } from "./store";
</script>

<main>
  {#if $ownWord}
    <h2 class="blue-main">Your word is</h2>
    <h3>{$ownWord}</h3>
  {:else}
    <h2 class="blue-main">You are Mr.White!</h2>
  {/if}
</main>

<style>
  h2 {
    font-size: 1.7em;
    font-weight: 500;
  }

  h3 {
    font-size: 1.4em;
    font-weight: 500;
  }
</style>
