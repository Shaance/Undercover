<script lang="ts">

	import NameInput from "./NameInput.svelte";
	import PlayerList from "./PlayerList.svelte";
	import { playerId } from "./store.js";

	$: addedName = $playerId !== '';

</script>

<main>
	{#if !addedName}
		<NameInput />
	{/if}
	<PlayerList />
</main>

<style>
	main {
		text-align: center;
		padding: 1em;
		max-width: 240px;
		margin: 0 auto;
	}
/* 
	h1 {
		color: #ff3e00;
		text-transform: uppercase;
		font-size: 4em;
		font-weight: 100;
	} */

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>