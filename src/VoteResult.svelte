<script lang="ts">
  import { voteResult } from "./store";

  $: result = $voteResult.result;
  $: detail = $voteResult.voteDetails;
  $: text = result === 'DRAW'
    ? 'It is a draw! 🙃'
    : `${$voteResult.playerOut} has been voted out! ☠️`;

</script>

<style>
  h2 {
    color:darkslateblue;
    font-size: 1.5em;
    font-weight: 350;
  }

  h3 {
    font-size: 1.3em;
    font-weight: 250;
  }
</style>

<main>
  <h2>Vote result</h2>

  {#each detail as pair}
    <p>{`${pair[0]}: ${pair[1]}`}</p>
  {/each}

  <h3> {text} </h3>
</main>