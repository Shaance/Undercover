<script lang="ts">
  import { roomId } from "./store.js";

  function copyRoomId() {
    navigator.clipboard.writeText($roomId)
    .then(
      () => alert("Copied room ID to clipboard!"),
      (err) => console.error("Async: Could not copy text: ", err)
    );
  }
</script>

<main>
  <h2>Room ID: {$roomId} &nbsp;</h2>
  <button on:click={copyRoomId}>
    <i class="far fa-copy"/>
  </button>
</main>

<style>
  h2 {
    display: inline-block;
    color: darkslateblue;
    font-size: 1.2em;
    font-weight: 150;
  }

  button {
    border: 0;
  }

  button:hover {
	background-color:rgb(202, 202, 235);
}
</style>
