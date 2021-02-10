<script lang="ts">
  import { playersWhoVoted } from "./store";
  import { flip } from 'svelte/animate';
  import { send, receive } from './Animations';

  $: text = $playersWhoVoted.length > 0 ? 'Has voted: ' : 'Nobody has voted yet 🤷‍♂️';
</script>

<style>
  main {
    display: inline-block;
    min-height: 120px;
    margin-bottom: 30px;
  }

  .item {
    display: inline-block;
    margin-left: 20px;
    margin-right: 20px;
  }

  h2 {
    color:darkslateblue;
    font-size: 1.1em;
    font-weight: 250;
  }
</style>

<main>
  <h2>{text}</h2>
  <br>
  {#each $playersWhoVoted as player, _ (player) }
    <div class="item"
      in:receive="{{key: player}}"
      out:send="{{key: player}}"
      animate:flip
    >{`${player} `}</div>
  {/each}
</main>