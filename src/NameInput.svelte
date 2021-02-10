<script>
  import { sendMessage, playerId, playerStore, connectionOpened } from "./store.js";
  import { getPlayersPayload, wrapAddPlayerPayload } from "./wsHelper";
  
  let message = "";

  $: players = $playerStore;
  $: if ($connectionOpened) {
    sendMessage(getPlayersPayload());
  }

  function handleClick() {
    if (message.length > 0) {
      if (players.indexOf(message) === -1) {
        sendMessage(wrapAddPlayerPayload(message));
        playerId.set(message);
      } else {
        alert('This name has already been picked!');
      }
    }
  }

  function init(el){
    el.focus();
  }

  function handleKeyup() {
    if (event.code === 'Enter') {
			handleClick();
		}
  }
</script>

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
	}

  h2 {
		font-size: 1.3em;
		font-weight: 350;
	}
  
  button {
    margin-top: 20px;
    font-size: 1em;
		font-weight: 200;
  }
</style>

<main>
  <h1> Undercover </h1>
  <h2> Input your name </h2>
  <br>
  <input type="text" 
    size="15"
    use:init
    bind:value={message} 
    on:keyup|preventDefault={handleKeyup}/>
  <br>
  <button on:click={handleClick}> OK </button>
</main>
