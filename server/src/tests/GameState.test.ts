import GameState, { Role, Status } from '../GameState';
import { Settings } from './@types/Settings';
import { StateData } from './@types/StateData';
import { VoteSettings } from './@types/VoteSettings';

describe('GameState class', () => {
  it('should have all fields in at an init state / default value', () => {
    const state = new GameState();
    expectInitialState(state);
  });

  it('should update clientToPlayer field when adding player', () => {
    const state = new GameState();
    state.addPlayer('clientId', 'toto');
    expect(state.clientToPlayer.size).toEqual(1);
  });

  it('should remove player from certain fields when using removePlayer function', () => {
    const state = getFinishedVotingState({
      ucCount: 1,
      whiteCount: 0,
      playerNumber: 3,
    }, {
      roleOut: Role.CIVILIAN,
    });
    const clientId = 'clientId1';
    const playerToRemove = state.clientToPlayer.get(clientId);
    state.removePlayer(clientId);
    expect(state.clientToPlayer.get(playerToRemove)).toBeUndefined();
    expect(state.playerToRole.get(playerToRemove)).toBeUndefined();
    expect(state.playerToWords.get(playerToRemove)).toBeUndefined();
    expect(state.playerToAssignedWord.get(playerToRemove)).toBeUndefined();
    expect(state.currentPlayersVote.get(playerToRemove)).toBeUndefined();
    expect(state.votedOutPlayers.indexOf(playerToRemove)).toEqual(-1);
  });

  it('should reset state when all players are removed', () => {
    const state = getFinishedVotingState({
      ucCount: 1,
      whiteCount: 0,
      playerNumber: 3,
    }, {
      roleOut: Role.CIVILIAN,
    });

    state.clientToPlayer.forEach((_, clientId) => {
      state.removePlayer(clientId);
    });
    expectInitialState(state);
  });

  it('should have state WON if no vilains are left', () => {
    const state = getFinishedVotingState({
      ucCount: 1,
      whiteCount: 0,
      playerNumber: 3,
    }, {
      roleOut: Role.UNDERCOVER,
    });
    const voteResult = state.computeVoteResult();
    expect(voteResult.gameState).toEqual(Status.WON);
    expect(state.status).toEqual(Status.WON);

    const state2 = getFinishedVotingState({
      ucCount: 0,
      whiteCount: 1,
      playerNumber: 3,
    }, {
      roleOut: Role.MR_WHITE,
    });
    state2.computeVoteResult();
    state2.guess('wrong guess');
    expect(state2.status).toEqual(Status.WON);
  });

  it('should have state LOST if one civilian left', () => {
    const state = getFinishedVotingState({
      ucCount: 1,
      whiteCount: 0,
      playerNumber: 3,
    }, {
      roleOut: Role.CIVILIAN,
    });
    const voteResult = state.computeVoteResult();
    expect(voteResult.gameState).toEqual(Status.LOST);
    expect(state.status).toEqual(Status.LOST);
  });

  it('should have state PLAYING when ending conditions are not met', () => {
    const state = getFinishedVotingState({
      ucCount: 1,
      whiteCount: 0,
      playerNumber: 4,
    }, {
      roleOut: Role.CIVILIAN,
    });
    const voteResult = state.computeVoteResult();
    expect(voteResult.gameState).toEqual(Status.PLAYING);
    expect(state.status).toEqual(Status.PLAYING);

    const state2 = getFinishedVotingState({
      ucCount: 2,
      whiteCount: 0,
      playerNumber: 4,
    }, {
      roleOut: Role.UNDERCOVER,
    });
    const voteResult2 = state2.computeVoteResult();
    expect(voteResult2.gameState).toEqual(Status.PLAYING);
    expect(state2.status).toEqual(Status.PLAYING);
  });

  it('should have voted out players turn to be skipped', () => {
    const settings = {
      ucCount: 1,
      whiteCount: 0,
      playerNumber: 6,
    };
    const state = getFinishedVotingState(settings, {
      roleOut: Role.CIVILIAN,
    });
    const { playerToClient } = buildStateDataFromSettings(settings);
    const { playerOut } = state.computeVoteResult();
    let counter = 0;
    while (state.status === Status.PLAYING) {
      const currentPlayer = state.getPlayerAt(state.getTurn());
      expect(currentPlayer).not.toEqual(playerOut);
      state.addWord(`w$${counter}`, playerToClient.get(currentPlayer));
      counter += 1;
    }
  });

  it('should get MR_WHITE_GUESS_WAITING state when mr white is voted out', () => {
    const state = getFinishedVotingState({
      ucCount: 0,
      whiteCount: 1,
      playerNumber: 3,
    }, {
      roleOut: Role.MR_WHITE,
    });
    const voteResult = state.computeVoteResult();
    expect(voteResult.gameState).toEqual(Status.MR_WHITE_GUESS_WAITING);
    expect(state.status).toEqual(Status.MR_WHITE_GUESS_WAITING);
  });

  it('should never have mr white at first turn', () => {
    const settings = {
      ucCount: 0,
      whiteCount: 1,
      playerNumber: 3,
    };
    const { state } = buildStateDataFromSettings(settings);
    state.start();
    const firstPlayer = state.getPlayerAt(state.turn);
    expect(state.playerToRole.get(firstPlayer)).not.toEqual(Role.MR_WHITE);
  });

  it('should get have state LOST mr white guess is correct', () => {
    const state = getFinishedVotingState({
      ucCount: 0,
      whiteCount: 1,
      playerNumber: 3,
    }, {
      roleOut: Role.MR_WHITE,
    });
    state.computeVoteResult();
    state.guess(state.goodWord);
    expect(state.status).toEqual(Status.LOST);
  });

  it('should get correct playerOut and playerOutRole from VoteResult', () => {
    const state = getFinishedVotingState({
      ucCount: 1,
      whiteCount: 0,
      playerNumber: 3,
    }, {
      roleOut: Role.UNDERCOVER,
    });
    const voteResult = state.computeVoteResult();
    const playerOut = state.getVotedOutPlayers()[0];
    expect(voteResult.playerOutRole).toEqual(Role.UNDERCOVER);
    expect(playerOut).toEqual(voteResult.playerOut);
  });

  it('should continue vote on draw vote', () => {
    const voteSetting = {};
    const state = getFinishedVotingState({
      ucCount: 1,
      whiteCount: 0,
      playerNumber: 3,
    }, voteSetting);

    const voteResult = state.computeVoteResult();
    expect(voteResult.gameState).toEqual(Status.DRAW_VOTE);
    expect(state.status).toEqual(Status.DRAW_VOTE);
    const [client, player] = Array.from(state.clientToPlayer)[0];
    const against = getFirstDifferentPlayer(state, player);
    state.vote(client, against);
    expect(state.status).toEqual(Status.VOTING);
    expect(state.getPlayersWhoVoted().indexOf(player)).not.toEqual(-1);
  });

  it('should have finished voting state before computing vote result', () => {
    const state = getFinishedVotingState({
      ucCount: 1,
      whiteCount: 0,
      playerNumber: 3,
    }, {
      roleOut: Role.UNDERCOVER,
    });

    expect(state.status).toEqual(Status.FINISHED_VOTING);
  });

  it('should return undefined when computing vote result when votes are left', () => {
    const { state } = getVotingState({
      ucCount: 1,
      whiteCount: 0,
      playerNumber: 3,
    });

    const [client, player] = Array.from(state.clientToPlayer)[0];
    const against = getFirstDifferentPlayer(state, player);
    state.vote(client, against);
    const voteResult = state.computeVoteResult();

    expect(voteResult).toBeUndefined();
  });

  it('should only allow undercovers/mrwhites adding up to total number of players', () => {
    const state = new GameState();
    state.addPlayer('clientId1', 'toto');
    state.addUndercover();
    state.addUndercover();
    expect(state.underCoverCount).toEqual(1);

    state.removeUndercover();
    state.addMrWhite();
    state.addMrWhite();
    expect(state.mrWhiteCount).toEqual(1);
  });

  it('should update remainingVilains when updating undercovers/mrwhites', () => {
    const state = new GameState();
    state.addPlayer('clientId1', 'toto');
    state.addPlayer('clientId2', 'toto2');
    state.addUndercover();
    state.addMrWhite();
    expect(state.remainingVilains).toEqual(2);

    state.removeUndercover();
    expect(state.remainingVilains).toEqual(1);

    state.removeMrWhite();
    expect(state.remainingVilains).toEqual(0);
  });

  it('should not allow negative undercover/mrwhite count', () => {
    const state = new GameState();
    state.removeUndercover();
    expect(state.underCoverCount).toEqual(0);

    state.removeMrWhite();
    expect(state.mrWhiteCount).toEqual(0);
  });

  it('should not allow voting when not in status voting or draw vote', () => {
    const { state } = buildStateDataFromSettings({
      ucCount: 1,
      whiteCount: 0,
      playerNumber: 3,
    });
    const players = state.getPlayers();
    state.vote(players[0], players[1]);

    expect(state.getPlayersWhoVoted().length).toEqual(0);

    state.start();
    state.vote(players[0], players[1]);
    expect(state.getPlayersWhoVoted().length).toEqual(0);
  });

  it('should not allow voting against yourself', () => {
    const { state } = getVotingState({
      ucCount: 1,
      whiteCount: 0,
      playerNumber: 3,
    });

    const [clientId, player] = Array.from(state.clientToPlayer)[0];
    state.vote(clientId, player);
    expect(state.getPlayersWhoVoted().length).toEqual(0);
  });

  it('should not allow voting against unknown player', () => {
    const { state } = getVotingState({
      ucCount: 1,
      whiteCount: 0,
      playerNumber: 3,
    });

    const [clientId] = Array.from(state.clientToPlayer)[0];
    state.vote(clientId, 'dsdsa');
    expect(state.getPlayersWhoVoted().length).toEqual(0);
  });
});


function expectInitialState(state: GameState) {
  expect(state.clientToPlayer.size).toEqual(0);
  expect(state.playerToWords.size).toEqual(0);
  expect(state.playerToRole.size).toEqual(0);
  expect(state.playerToAssignedWord.size).toEqual(0);
  expect(state.currentPlayersVote.size).toEqual(0);
  expect(state.clientToPlayer.size).toEqual(0);
  expect(state.underCoverCount).toEqual(0);
  expect(state.mrWhiteCount).toEqual(0);
  expect(state.turn).toEqual(0);
  expect(state.originalPlayerNumber).toEqual(0);
  expect(state.remainingVilains).toEqual(0);
  expect(state.remainingCivilians).toEqual(0);
  expect(state.votedOutPlayers.length).toEqual(0);
  expect(state.status).toEqual(Status.LOBBY);
}

function buildStateDataFromSettings(settings: Settings): StateData {
  const state = new GameState();
  const clientIdPrefix = 'clientId';
  const playerPrefix = 'player';
  const playerToClient = new Map<string, string>();
  let playerCount = 0;
  while (playerCount !== settings.playerNumber) {
    const clientId = `${clientIdPrefix}${playerCount}`;
    const playerId = `${playerPrefix}${playerCount}`;
    playerToClient.set(playerId, clientId);
    state.addPlayer(clientId, playerId);
    playerCount += 1;
  }
  let ucCount = 0;
  while (ucCount !== settings.ucCount) {
    state.addUndercover();
    ucCount += 1;
  }

  let whiteCount = 0;
  while (whiteCount !== settings.whiteCount) {
    state.addMrWhite();
    whiteCount += 1;
  }
  return {
    state,
    playerToClient,
  };
}

function getVotingState(settings: Settings): StateData {
  const { state, playerToClient } = buildStateDataFromSettings(settings);
  state.start();
  return {
    state: describeWords(state, playerToClient),
    playerToClient,
  };
}

function describeWords(state: GameState, playerToClient: Map<string, string>) {
  const newState = state;
  newState.playersOrder
    .filter((player) => newState.votedOutPlayers.indexOf(player) === -1)
    .forEach((player, idx) => {
      newState.addWord(`word${idx}`, playerToClient.get(player));
    });
  return newState;
}

function getFinishedVotingState(settings: Settings, voteSettings: VoteSettings) {
  const { state, playerToClient } = getVotingState(settings);
  if (voteSettings.roleOut) {
    const players = state.getPlayers();
    const playerOut = getFirstPlayerWithRole(state, voteSettings.roleOut);
    const otherPlayer = getFirstDifferentPlayer(state, playerOut);

    players.forEach((player) => {
      if (player !== playerOut) {
        state.vote(playerToClient.get(player), playerOut);
      } else {
        state.vote(playerToClient.get(player), otherPlayer);
      }
    });
    return state;
  }
  return drawVote(state, playerToClient);
}

function drawVote(state: GameState, playerToClient: Map<string, string>): GameState {
  const votedAgainst = new Set();
  const players = state.getPlayers();
  let count = 0;
  players.forEach((player) => {
    let against = players[count % players.length];
    while (against === player || votedAgainst.has(against)) {
      count += 1;
      against = players[count % players.length];
    }
    votedAgainst.add(against);
    state.vote(playerToClient.get(player), against);
  });
  return state;
}

function getFirstPlayerWithRole(state: GameState, role: Role) {
  const players = state.getPlayers();
  let count = 0;
  let player = players[count];
  while (state.playerToRole.get(player) !== role && count < players.length - 1) {
    count += 1;
    player = players[count];
  }
  return player;
}

function getFirstDifferentPlayer(state: GameState, player: string) {
  const players = state.getPlayers();
  let count = 0;
  let differentPlayer = players[count];
  while (differentPlayer === player) {
    count += 1;
    differentPlayer = players[count];
  }
  return differentPlayer;
}
