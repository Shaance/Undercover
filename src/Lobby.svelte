<script lang="ts">

	import NameInput from "./NameInput.svelte";
	import PlayerList from "./PlayerList.svelte";
  import Settings from "./Settings.svelte";
  import StartButton from "./StartButton.svelte";
	import { playerId } from "./store.js";

	$: addedName = $playerId !== '';

</script>

<main>
	{#if !addedName}
		<NameInput />
	{/if}
  {#if addedName}
    <PlayerList />
    <br>
    <Settings />
    <br>
    <StartButton />
  {/if}
</main>
