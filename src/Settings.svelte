<script lang="ts">
  import { onMount } from "svelte";
  import { undercoverCount, mrWhiteCount, sendMessage, roomId } from "./store";
  import { createGetSettingsPayload } from "./wsHelper";

  function updateValue(subtopic: string, data: string) {
    sendMessage({
      topic: "settings",
      subtopic,
      data,
      roomId: $roomId,
    });
  }

  onMount(() => {
    sendMessage(createGetSettingsPayload($roomId));
  });
</script>

<main>
  <h2>Settings</h2>
  <p>Undercover</p>
  <button on:click={() => updateValue("undercover", "decrement")}>
    {"<"}
  </button>
  <div data-testid="undercoverCount">{$undercoverCount}</div>
  <button on:click={() => updateValue("undercover", "increment")}>
    {">"}
  </button>
  <p>Mr White</p>
  <button on:click={() => updateValue("white", "decrement")}> {"<"} </button>
  <div data-testid="mrWhiteCount">{$mrWhiteCount}</div>
  <button on:click={() => updateValue("white", "increment")}> {">"} </button>
</main>

<style>
  button {
    display: inline-block;
    min-width: 30px;
  }

  div {
    display: inline-block;
    min-width: 50px;
  }

  h2 {
    color: darkslateblue;
    font-size: 2em;
    font-weight: 350;
  }
  main {
    font-size: 1.1em;
    font-weight: 200;
  }
</style>
