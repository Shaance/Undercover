import { writable, get } from 'svelte/store';
import type { UpdatePlayerMessage, Message, SettingTopicResponse } from './wsTypes';

export const playerStore = writable([]);
export const playerId = writable('');
export const undercoverCount = writable(0);
export const mrWhiteCount = writable(0);

const socket = new WebSocket('ws://localhost:3000');

// socket.addEventListener('open', function (event) {
//   console.log("It's open");
// });

socket.addEventListener('message', onMessageEvent);

function onMessageEvent(event) {
  console.log(`Received data from WS, ${event.data}`);
  const resp: Message = JSON.parse(event.data);
  if (resp.topic === 'player') {
    if (resp.subtopic === 'update') {
      const addPlayerResponse = resp as UpdatePlayerMessage;
      updatePlayerStore(addPlayerResponse);
    }
  } else if (resp.topic === 'settings') {
    const settingsResponse = resp as SettingTopicResponse;
    updateSettings(settingsResponse);
  }
}

function updateSettings(resp: SettingTopicResponse) {
  const data = resp.data;
  undercoverCount.set(data.underCoverCount);
  mrWhiteCount.set(data.mrWhiteCount);
}

function updatePlayerStore(resp: UpdatePlayerMessage) {
  // console.log(`Before: ${get(playerStore)}`);
  playerStore.set(resp.data);
  // console.log(`After: ${get(playerStore)}`);
}

export const sendMessage = (message) => {
  if (socket.readyState <= 1) {
    // console.log(`Sending ${JSON.stringify(message)}`);
    socket.send(JSON.stringify(message));
  }
}
