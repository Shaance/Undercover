<script lang="ts">
  import { ownWord } from "./store";
</script>

<style>
  h2 {
    color:darkslateblue;
    font-size: 1.7em;
    font-weight: 500;
  }
  
  h3 {
    font-size: 1.4em;
    font-weight: 500;
  }
</style>

<main>
  {#if $ownWord}
    <h2>Your word is</h2>
    <h3>{$ownWord}</h3>
  {:else}
    <h2>You are Mr.White!</h2>
  {/if}
</main>
