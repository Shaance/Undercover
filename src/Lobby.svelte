<script lang="ts">

  import { fly } from 'svelte/transition';
	import NameInput from "./NameInput.svelte";
	import PlayerList from "./PlayerList.svelte";
  import Settings from "./Settings.svelte";
  import StartButton from "./StartButton.svelte";
	import { playerId } from "./store.js";

	$: addedName = $playerId !== '';

</script>

<main>
	{#if !addedName}
    <div out:fly="{{ y: 500, duration: 400 }}">
      <NameInput />
    </div>
	{/if}
  {#if addedName}
    <div in:fly="{{ y: 800, duration: 800 }}">
      <PlayerList />
      <br>
      <Settings />
      <br>
      <StartButton />
    </div>
  {/if}
</main>
