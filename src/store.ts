import { writable, get } from 'svelte/store';
import type { UpdatePlayerMessage, Message } from './wsTypes';

export const playerStore = writable([]);
export const playerId = writable('');

const socket = new WebSocket('ws://localhost:3000');

// Connection opened
socket.addEventListener('open', function (event) {
  console.log("It's open");
});

// Listen for messages
socket.addEventListener('message', function (event) {
  console.log(`Received data from WS, ${event.data}`);
  const resp: Message = JSON.parse(event.data);
  if (resp.topic === 'player') {
    if (resp.subtopic === 'update') {
      const addPlayerResponse = resp as UpdatePlayerMessage;
      updatePlayerStore(addPlayerResponse);
    }
  }
});

function updatePlayerStore(resp: UpdatePlayerMessage) {
  console.log(`Before: ${get(playerStore)}`);
  playerStore.set(resp.data);
  console.log(`After: ${get(playerStore)}`);
}

export const addPlayer = (message) => {
  if (socket.readyState <= 1) {
    console.log(`Sending ${JSON.stringify(message)}`);
    socket.send(JSON.stringify(message));
  }
}
