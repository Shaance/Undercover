<script lang="ts">

  import { fly } from 'svelte/transition';
	import NameInput from "./NameInput.svelte";
	import PlayerList from "./PlayerList.svelte";
  import Settings from "./Settings.svelte";
  import StartButton from "./StartButton.svelte";
	import { playerId } from "./store.js";
  import statefulSwap from "./statefulSwap"

  const { onOutro, transitionTo, state } = statefulSwap("init");

  $: if ($playerId) {
    transitionTo($playerId);
  }

</script>

<main>
	{#if $state === "init"}
    <div out:fly="{{ y: 500, duration: 300 }}" on:outroend={onOutro}>
      <NameInput />
    </div>
	{/if}
  {#if $state === $playerId}
    <div in:fly="{{ y: 500, duration: 500 }}" on:outroend={onOutro}>
      <Settings />
      <br>
      <StartButton />
      <br>
      <PlayerList />
    </div>
  {/if}
</main>
