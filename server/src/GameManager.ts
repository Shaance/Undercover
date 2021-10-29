import factory from './ConfigLog4j';
import GameState, { InGameInfo } from './GameState';
import { getUniqueID } from './helper';
import {
  SettingTopicPayload,
  PlayerTopicPayload,
  InGamePayload,
  SettingTopicResponse,
  Message,
  VoteAgainstPayload,
  PlayerTopicResponse,
  InGameResponse,
} from './messageTypes';

const logger = factory.getLogger('GameManager');
const roomIdToStates = new Map<string, GameState>();
const clientIdToRoomId = new Map<string, string>();

export interface StateUpdate {
  newState: GameState,
  response: Message
}

export function updateSettings(message: SettingTopicPayload, clientId: string): SettingTopicResponse {
  const roomId = clientIdToRoomId.get(clientId);
  const newState = getState(roomId);
  if (message.subtopic === 'white') {
    if (message.data === 'increment') {
      newState.addMrWhite();
    } else if (message.data === 'decrement') {
      newState.removeMrWhite();
    }
  } else if (message.subtopic === 'undercover') {
    if (message.data === 'increment') {
      newState.addUndercover();
    } else if (message.data === 'decrement') {
      newState.removeUndercover();
    }
  }

  const [underCoverCount, mrWhiteCount] = [newState.getUndercoverCount(), newState.getMrWhiteCount()];
  updateState(roomId, newState);
  return {
    topic: message.topic,
    subtopic: message.subtopic,
    data: {
      underCoverCount,
      mrWhiteCount,
    },
    roomId,
  };
}

export function handleClosingConection(clientId: string): PlayerTopicResponse {
  const roomId = clientIdToRoomId.get(clientId);
  clientIdToRoomId.delete(clientId);
  const newState = getState(roomId)?.removePlayer(clientId);
  const response = {
    topic: 'player',
    subtopic: 'update',
    data: newState?.getPlayers(),
    roomId,
  };
  if (newState?.getPlayers().length === 0) {
    logger.info(`No more players in room ${roomId}, closing room.`);
    roomIdToStates.delete(roomId);
  } else {
    updateState(roomId, newState);
  }
  return response;
}

export function handlePlayer(message: PlayerTopicPayload, roomId: string, clientId: string): Message {
  const newState = getState(roomId);
  let response;
  if (message.subtopic === 'add') {
    const playerId = message.data;
    newState.addPlayer(clientId, playerId);
    clientIdToRoomId.set(clientId, roomId);
    response = {
      topic: message.topic,
      subtopic: 'update',
      data: newState.getPlayers(),
      roomId,
    };
  } else if (message.subtopic === 'word') {
    const word = newState.getWord(clientId);
    response = {
      topic: message.topic,
      subtopic: 'word',
      data: word,
      roomId,
    };
  } else {
    logger.info(`Subtopic ${message.subtopic} not supported yet.`);
    response = {
      topic: message.topic,
      subtopic: 'update',
      data: newState.getPlayers(),
      roomId,
    };
  }
  updateState(roomId, newState);
  return response;
}

export function getWordFor(clientId: string, gameState: GameState) {
  const word = gameState.getWord(clientId);
  const roomId = clientIdToRoomId.get(clientId);
  return {
    topic: 'game',
    subtopic: 'word',
    data: word,
    roomId,
  };
}

export function handleVote(message: VoteAgainstPayload, clientId: string): Message {
  const roomId = clientIdToRoomId.get(clientId);
  let newState = getState(roomId);
  let response;
  if (message.subtopic === 'against') {
    newState.vote(clientId, message.data);
    const playersWhoVoted = newState.getPlayersWhoVoted();
    response = {
      topic: message.topic,
      subtopic: 'update',
      data: {
        playersWhoVoted,
        state: newState.status,
      },
      roomId,
    };
  } else if (message.subtopic === 'result') {
    const voteResult = newState.computeVoteResult();
    if (voteResult) {
      response = {
        topic: message.topic,
        subtopic: 'result',
        data: voteResult,
        roomId,
      };
    }
  } else if (message.subtopic === 'guess') {
    newState = newState.guess(message.data);
    response = {
      topic: message.topic,
      subtopic: message.subtopic,
      data: newState.status,
      roomId,
    };
  }
  updateState(roomId, newState);

  return response;
}

export function handleGame(clientId: string, message: InGamePayload): InGameResponse {
  const roomId = clientIdToRoomId.get(clientId);
  let newState = getState(roomId);
  if (message.subtopic === 'start') {
    newState = startGame(newState);
  } else if (message.subtopic === 'add') {
    newState.addWord(message.data, clientId);
  } else if (message.subtopic === 'guess') {
    newState = newState.guess(message.data);
  }

  const { turn, player, playerToWords } = getInGameInfo(newState);
  // Map objects do not play well with JSON.stringify
  const playerToWordsArray = Array.from(playerToWords);
  const response = {
    topic: message.topic,
    subtopic: 'update',
    data: {
      turn,
      player,
      playerToWords: playerToWordsArray,
      state: newState.status,
    },
    roomId,
  };

  updateState(roomId, newState);
  return response;
}

function getInGameInfo(gameState: GameState): InGameInfo {
  const turn = gameState.getTurn();
  return {
    turn,
    player: gameState.getPlayerAt(turn),
    playerToWords: gameState.getPlayerToWords(),
  };
}

function startGame(gameState: GameState): GameState {
  const newState = gameState;
  newState.start();
  return newState;
}

export function createGameState(): string {
  const generateId = () => getUniqueID().slice(0, 5).toUpperCase();
  let roomId = generateId();
  while (roomIdToStates.has(roomId)) {
    roomId = generateId();
  }
  roomIdToStates.set(roomId, new GameState());
  logger.info(`Created room: ${roomId}`);
  return roomId;
}

export function getState(roomId: string) {
  return roomIdToStates.get(roomId);
}

export function updateState(roomId: string, newState: GameState) {
  return roomIdToStates.set(roomId, newState);
}

export function getClientsFromSameRoom(clientId: string): string[] {
  const roomId = clientIdToRoomId.get(clientId);
  const state = getState(roomId);
  return state ? Array.from(state.clientToPlayer.keys()) : [];
}
