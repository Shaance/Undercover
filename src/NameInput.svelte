<script>
  import {
    sendMessage,
    playerId,
    roomId,
  } from "./store.js";
  import { wrapAddPlayerPayload } from "./wsHelper";

  const roomApiUrl = process?.env?.REST_API_URL ?? 'http://localhost:8081';
  let playerName = "";
  let inputRoomId = "";

  async function createRoom() {
    if (playerName.length === 0) {
      alert('Cannot have empty name');
      return;
    }
    const resp = await fetch(roomApiUrl + '/rooms', {
      method: 'POST'
    });
    if (resp.status === 200) {
      const generatedRoomId = await resp.json();
      roomId.set(generatedRoomId);
      sendMessage(wrapAddPlayerPayload(playerName, generatedRoomId));
      playerId.set(playerName);
    } else {
      alert("Server returned an error");
    }
  }

  async function joinRoom() {
    if (playerName.length === 0) {
      alert('Cannot have empty name');
      return;
    }
    const finalRoomId = inputRoomId?.toUpperCase();
    const resp = await fetch(`${roomApiUrl}/rooms/${finalRoomId}`);
    if (resp.status === 200) {
        const playersInTheRoom = await resp.json();
        if (playersInTheRoom.indexOf(playerName) === -1) {
          roomId.set(finalRoomId);
          sendMessage(wrapAddPlayerPayload(playerName, finalRoomId));
          playerId.set(playerName);
        } else {
          alert("This name already exist");
        }
    } else if (resp.status === 404) {
      alert("This room id does not exist!");
    } else {
      alert("Error connecting to the server");
    }
  }

  function focus(el) {
    el.focus();
  }
</script>

<main>
  <h1>Undercover</h1>
  <h2>Choose your name</h2>
  <br />
  <input
    type="text"
    size="15"
    maxlength="15"
    use:focus
    bind:value={playerName}
  />
  <br />
  <button on:click={createRoom}> Create room </button>

  <br />
  <br />
  <h3>Or</h3>
  <br />
  <h2>Join room with code</h2>
  <br />
  <input
    type="text"
    size="5"
    maxlength="5"
    style="text-transform:uppercase"
    bind:value={inputRoomId}
  />
  <br />
  <button on:click={joinRoom}> Join room </button>
</main>

<style>
  input {
    margin-bottom: 20px;
  }

  h1 {
    color: #ff3e00;
    text-transform: uppercase;
    font-size: 2.5em;
    font-weight: 150;
    margin-top: 50px;
    margin-bottom: 50px;
    text-shadow: 5px 5px 20px grey;
  }

  h2 {
    font-size: 1.3em;
    font-weight: 350;
  }

  h3 {
    font-size: 1.2em;
    font-weight: 150;
  }

  button {
    margin-top: 20px;
    font-size: 1em;
    font-weight: 200;
  }
</style>
