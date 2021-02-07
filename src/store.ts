import { writable, get } from 'svelte/store';
import factory from './ConfigLog4j';
import type { UpdatePlayerMessage, Message, SettingTopicResponse, GetWordResponse, InGameResponse, VoteUpdateResponse } from './wsTypes';

export const playerStore = writable([]);
export const playerId = writable('');
export const undercoverCount = writable(0);
export const mrWhiteCount = writable(0);
export const connectionOpened = writable(false);
export const ownWord = writable('init');
export const playingState = writable('init');
export const playerToWords = writable([]);
export const currentPlayerTurn = writable('');
export const hasVoted = writable(false);
export const votedOutPlayers = writable([]);
export const voteResult = writable({});
export const playersWhoVoted = writable([]);

const logger = factory.getLogger('store');
const socket = new WebSocket('ws://b455891f6f6b.ngrok.io');

socket.addEventListener('open', () => connectionOpened.set(true));

socket.addEventListener('message', onMessageEvent);

function onMessageEvent(event) {
  logger.info(`Received data from WS, ${event.data}`);
  const resp: Message = JSON.parse(event.data);
  if (resp.topic === 'player') {
    if (resp.subtopic === 'update') {
      const addPlayerResponse = resp as UpdatePlayerMessage;
      updatePlayerStore(addPlayerResponse);
    }
  } else if (resp.topic === 'settings') {
    const settingsResponse = resp as SettingTopicResponse;
    updateSettings(settingsResponse);
  } else if (resp.topic === 'game') {
    if (resp.subtopic === 'word') {
      const getWordResp = resp as GetWordResponse;
      ownWord.set(getWordResp.data);
      playingState.set('started');
    } else if (resp.subtopic === 'update') {
      const inGameResponse = resp as InGameResponse;
      const data = inGameResponse.data;
      playerToWords.set(data.playerToWords);
      currentPlayerTurn.set(data.player);
      if (data.turn !== 0 && data.turn % get(playerStore).length === 0) {
        playingState.set('voting');
      }
    }
  } else if (resp.topic === 'vote') {
    if (resp.subtopic === 'update') {
      const response = resp as VoteUpdateResponse;
      playersWhoVoted.set(response.data.playersWhoVoted);
    }
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
  if (get(connectionOpened)) {
    // console.log(`Sending ${JSON.stringify(message)}`);
    socket.send(JSON.stringify(message));
  }
}
