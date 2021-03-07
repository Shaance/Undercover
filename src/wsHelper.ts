import type { AddPlayerPayload, AddWordPayload, GuessWordPayload, Message, VoteAgainstPayload } from "./wsTypes";

export function wrapAddPlayerPayload(message: string, roomId: string): AddPlayerPayload {
  return {
    topic: 'player',
    subtopic: 'add',
    data: message,
    roomId,
  }
}

export function getPlayersPayload(roomId: string): Message {
  return {
    topic: 'player',
    subtopic: 'get',
    roomId,
  }
}

export function createGetSettingsPayload(roomId: string): Message {
  return {
    topic: 'settings',
    subtopic: 'get',
    roomId,
  }
}

export function getAddWordPayload(word: string, roomId: string): AddWordPayload {
  return {
    topic: 'game',
    subtopic: 'add',
    data: word,
    roomId,
  }
}

export function guessWordPayload(word: string, roomId: string): GuessWordPayload {
  return {
    topic: 'vote',
    subtopic: 'guess',
    data: word,
    roomId,
  }
}

export function getGameInfoPayload(roomId: string): Message {
  return {
    topic: 'game',
    subtopic: 'update',
    roomId,
  }
}

export function getVoteAgainstPayload(player: string, roomId: string): VoteAgainstPayload {
  return {
    topic: 'vote',
    subtopic: 'against',
    data: player,
    roomId,
  }
}

export function getVoteResultPayload(roomId: string): Message {
  return {
    topic: 'vote',
    subtopic: 'result',
    roomId,
  }
}

export function getStartGamePayload(roomId: string): Message {
  return {
    topic: "game",
    subtopic: "start",
    roomId,
  }
}