import type { AddPlayerPayload, AddWordPayload, Message } from "./wsTypes";

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