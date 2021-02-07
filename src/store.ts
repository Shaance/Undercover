import { writable, get } from 'svelte/store';
import type { UpdatePlayerMessage, Message, SettingTopicResponse, GetWordResponse, InGameResponse, VoteUpdateResponse, VoteResultResponse, VoteResult } from './wsTypes';

export const playerStore = writable<string[]>([]);
export const playerId = writable('');
export const undercoverCount = writable(0);
export const mrWhiteCount = writable(0);
export const connectionOpened = writable(false);
export const ownWord = writable('init');
export const playingState = writable('init');
export const playerToWords = writable<[string, string][]>([]);
export const currentPlayerTurn = writable('');
export const hasVoted = writable(false);
export const voteEnded = writable(false);
export const votedOutPlayers = writable([]);
export const voteResult = writable<VoteResult>({
  turn: 0,
  result: 'DRAW'
});
export const playersWhoVoted = writable([]);

// @ts-ignore
console.log('process + ' + process.env.API_URL);
// @ts-ignore
const socket = new WebSocket("ws://localhost:3000");

socket.addEventListener('open', () => connectionOpened.set(true));

socket.addEventListener('message', onMessageEvent);

function onMessageEvent(event) {
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
    } else if (resp.subtopic === 'result') {
      const response = resp as VoteResultResponse;
      voteResult.set(response.data);
      voteEnded.set(true);
      hasVoted.set(false);
    }
  }
}

function updateSettings(resp: SettingTopicResponse) {
  const data = resp.data;
  undercoverCount.set(data.underCoverCount);
  mrWhiteCount.set(data.mrWhiteCount);
}

function updatePlayerStore(resp: UpdatePlayerMessage) {
  playerStore.set(resp.data);
}

export const sendMessage = (message) => {
  if (get(connectionOpened)) {
    socket.send(JSON.stringify(message));
  }
}
