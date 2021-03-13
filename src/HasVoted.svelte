<script lang="ts">
  import { playersWhoVoted } from "./store";
  import { flip } from "svelte/animate";
  import { send, receive } from "./Animations";

  $: text =
    $playersWhoVoted.length > 0 ? "Has voted: " : "Nobody has voted yet 🤷‍♂️";
</script>

<main>
  <h2>{text}</h2>
  {#each $playersWhoVoted as player, _ (player)}
    <div
      class="item"
      in:receive={{ key: player }}
      out:send={{ key: player }}
      animate:flip
    >
      {player}
    </div>
  {/each}
</main>

<style>
  main {
    display: inline-block;
    min-height: 250px;
    margin-bottom: 50%;
  }

  .item {
    margin-bottom: 15%;
  }

  h2 {
    color: darkslateblue;
    font-size: 1.1em;
    font-weight: 250;
  }
</style>
