import type { AddPlayerPayload, AddWordPayload, Message, VoteAgainstPayload } from "./wsTypes";

export function wrapAddPlayerPayload(message: string): AddPlayerPayload {
  return {
    topic: 'player',
    subtopic: 'add',
    data: message
  }
}

export function getPlayersPayload(): Message {
  return {
    topic: 'player',
    subtopic: 'get',
  }
}

export function createGetSettingsPayload(): Message {
  return {
    topic: 'settings',
    subtopic: 'get',
  }
}

export function getAddWordPayload(word: string): AddWordPayload {
  return {
    topic: 'game',
    subtopic: 'add',
    data: word
  }
}

export function getGameInfoPayload(): Message {
  return {
    topic: 'game',
    subtopic: 'update'
  }
}

export function getVoteAgainstPayload(player: string): VoteAgainstPayload {
  return {
    topic: 'vote',
    subtopic: 'against',
    data: player
  }
}

export function getVoteResultPayload(): Message {
  return {
    topic: 'vote',
    subtopic: 'result'
  }
}