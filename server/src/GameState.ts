import { random, shuffleArray } from './helper';
import getWordPair from './words';

export enum Role {
  UNDERCOVER = 'Undercover',
  MR_WHITE = 'Mr. White',
  CIVILIAN = 'Civilian',
}

export enum Status {
  LOBBY = 'LOBBY',
  PLAYING = 'PLAYING',
  VOTING = 'VOTING',
  FINISHED_VOTING = 'FINISHED_VOTING',
  DRAW_VOTE = 'DRAW_VOTE',
  MR_WHITE_GUESS_WAITING = 'MR_WHITE_GUESS_WAITING',
  WON = 'WON',
  LOST = 'LOST',
}

export interface InGameInfo {
  turn: number,
  player: string,
  playerToWords: Map<string, string[]>
}

export interface VoteResult {
  turn: number,
  result: 'DRAW' | 'OUT',
  playerOut?: string,
  playerOutRole?: Role,
  voteDetails?: [string, number][],
  gameState: Status,
  goodWord?: string,
  undercoverWord?: string,
}

export interface VoteUpdate {
  playersWhoVoted: string[]
}

export default class GameState {
  clientToPlayer: Map<string, string>;

  playerToWords: Map<string, string[]>;

  playerToRole: Map<string, Role>;

  underCoverCount: number;

  mrWhiteCount: number;

  remainingVilains: number;

  remainingCivilians: number;

  status: Status;

  turn: number;

  playersOrder: string[];

  playerToAssignedWord: Map<string, string>;

  votedOutPlayers: string[];

  // key: vote from, value: vote against
  currentPlayersVote: Map<string, string>;

  originalPlayerNumber: number;

  goodWord: string;

  undercoverWord: string;

  constructor() {
    this.clientToPlayer = new Map();
    this.playerToWords = new Map();
    this.playerToRole = new Map();
    this.playerToAssignedWord = new Map();
    this.currentPlayersVote = new Map();
    this.underCoverCount = 0;
    this.mrWhiteCount = 0;
    this.turn = 0;
    this.originalPlayerNumber = 0;
    this.remainingVilains = 0;
    this.remainingCivilians = 0;
    this.votedOutPlayers = [];
    this.status = Status.LOBBY;
  }

  addPlayer(clientId: string, player: string) {
    this.clientToPlayer.set(clientId, player);
  }

  getPlayers(): string[] {
    return Array.from(this.clientToPlayer.values());
  }

  getUndercoverCount() {
    return this.underCoverCount;
  }

  getMrWhiteCount() {
    return this.mrWhiteCount;
  }

  removePlayer(clientId: string) {
    const player = this.clientToPlayer.get(clientId);
    const role = this.playerToRole.get(player);
    if (role === Role.CIVILIAN) {
      this.remainingCivilians -= 1;
    } else {
      this.remainingVilains -= 1;
    }
    this.clientToPlayer.delete(clientId);
    this.playerToRole.delete(player);
    this.playerToWords.delete(player);
    this.playerToAssignedWord.delete(player);
    this.currentPlayersVote.delete(player);
    this.votedOutPlayers = this.votedOutPlayers.filter((p) => p !== player);
    if (this.playerToRole.size === 0) {
      this.resetState();
    }
    return this;
  }

  addUndercover() {
    if (this.underCoverCount + this.mrWhiteCount < this.clientToPlayer.size) {
      this.underCoverCount += 1;
      this.remainingVilains += 1;
    }
  }

  guess(word: string) {
    if (word.toUpperCase() !== this.goodWord.toUpperCase()) {
      if (this.remainingVilains === 0) {
        this.status = Status.WON;
      } else {
        this.status = Status.PLAYING;
      }
    } else {
      this.status = Status.LOST;
    }
    return this;
  }

  vote(clientId: string, against: string) {
    if (this.status === Status.DRAW_VOTE || this.status === Status.VOTING) {
      if (this.status === Status.DRAW_VOTE) {
        this.resetCurrentVote();
        this.status = Status.VOTING;
      }
      const playerId = this.clientToPlayer.get(clientId);
      const againstExists = this.playerToAssignedWord.has(against);
      if (againstExists && playerId !== against) {
        this.currentPlayersVote.set(playerId, against);
        if (this.currentPlayersVote.size + this.votedOutPlayers.length === this.originalPlayerNumber) {
          this.status = Status.FINISHED_VOTING;
        }
      }
    }
  }

  getStatus() {
    return this.status;
  }

  resetCurrentVote() {
    this.currentPlayersVote = new Map();
  }

  getPlayersWhoVoted() {
    return Array.from(this.currentPlayersVote).map((pair) => pair[0]);
  }

  getVotedOutPlayers() {
    return this.votedOutPlayers;
  }

  computeVoteResult(): VoteResult | undefined {
    if (this.status !== Status.FINISHED_VOTING) {
      return undefined;
    }
    const votesAgainst = new Map<string, number>();
    let draw = false;
    let maxVote = 0;
    let playerOut: string;

    Array.from(this.currentPlayersVote)
      .forEach((pair) => {
        const votedOutPlayer = pair[1];
        if (!votesAgainst.has(votedOutPlayer)) {
          votesAgainst.set(votedOutPlayer, 0);
        }
        const newCount = votesAgainst.get(votedOutPlayer) + 1;
        votesAgainst.set(votedOutPlayer, newCount);
        if (newCount > maxVote) {
          maxVote = newCount;
          draw = false;
          playerOut = votedOutPlayer;
        } else if (newCount === maxVote) {
          draw = true;
        }
      });

    const voteDetails = Array.from(votesAgainst);
    if (draw) {
      this.status = Status.DRAW_VOTE;
      return {
        turn: this.turn,
        result: 'DRAW',
        voteDetails,
        gameState: this.status,
      };
    }

    if (this.votedOutPlayers.indexOf(playerOut) === -1) {
      this.votedOutPlayers.push(playerOut);
      const role = this.playerToRole.get(playerOut);
      if (role === Role.MR_WHITE || role === Role.UNDERCOVER) {
        this.remainingVilains -= 1;
      } else {
        this.remainingCivilians -= 1;
      }
      if (role === Role.MR_WHITE) {
        this.status = Status.MR_WHITE_GUESS_WAITING;
      } else if (this.remainingVilains === 0) {
        this.status = Status.WON;
      } else if (this.remainingCivilians === 1) {
        this.status = Status.LOST;
      } else {
        this.status = Status.PLAYING;
      }
    }
    this.skipVotedOutPlayers();
    const finishedStatus = this.status === Status.WON || this.status === Status.LOST;
    return {
      turn: this.turn,
      result: 'OUT',
      playerOut,
      playerOutRole: this.playerToRole.get(playerOut),
      voteDetails,
      gameState: this.status,
      goodWord: finishedStatus ? this.goodWord : undefined,
      undercoverWord: finishedStatus && this.underCoverCount > 0 ? this.undercoverWord : undefined,
    };
  }

  removeUndercover() {
    if (this.underCoverCount > 0) {
      this.underCoverCount -= 1;
      this.remainingVilains -= 1;
    }
  }

  addMrWhite() {
    if (this.underCoverCount + this.mrWhiteCount < this.clientToPlayer.size) {
      this.mrWhiteCount += 1;
      this.remainingVilains += 1;
    }
  }

  removeMrWhite() {
    if (this.mrWhiteCount > 0) {
      this.mrWhiteCount -= 1;
      this.remainingVilains -= 1;
    }
  }

  getPlayerToWords() {
    return this.playerToWords;
  }

  clearWords() {
    this.playerToWords = new Map();
  }

  start() {
    this.renewWord();
    this.votedOutPlayers = [];
    this.status = Status.PLAYING;
    this.originalPlayerNumber = this.clientToPlayer.size;
    this.remainingVilains = this.underCoverCount + this.mrWhiteCount;
    this.remainingCivilians = this.originalPlayerNumber - this.remainingVilains;
  }

  getTurn(): number {
    return this.turn;
  }

  getPlayerAt(turn: number): string {
    return this.playersOrder[turn % this.playersOrder.length];
  }

  addWord(word: string, clientId: string) {
    const player = this.clientToPlayer.get(clientId);
    const playerTurn = this.getPlayerAt(this.turn) === player;
    if (this.status !== Status.VOTING && playerTurn && word) {
      this.playerToWords.get(this.getPlayerAt(this.turn)).push(word);
      this.turn += 1;
      if (this.turn !== 0 && this.turn % this.originalPlayerNumber === 0) {
        this.resetCurrentVote();
        this.status = Status.VOTING;
      }
      this.skipVotedOutPlayers();
    }
  }

  getWord(clientId: string): string {
    const player = this.clientToPlayer.get(clientId);
    return this.playerToAssignedWord.get(player);
  }

  private setPlayersOrder() {
    let tmpOrder = shuffleArray(this.getPlayers());
    while (this.playerToRole.get(tmpOrder[0]) === Role.MR_WHITE) {
      tmpOrder = shuffleArray(this.getPlayers());
    }
    this.playersOrder = tmpOrder;
  }

  private assignWord() {
    const [first, second] = getWordPair();
    this.goodWord = first.toLowerCase();
    this.undercoverWord = second.toLowerCase();
    this.playerToRole.forEach((role, player) => {
      if (role === Role.MR_WHITE) {
        this.playerToAssignedWord.set(player, '');
      } else if (role === Role.UNDERCOVER) {
        this.playerToAssignedWord.set(player, second);
      } else {
        this.playerToAssignedWord.set(player, first);
      }
    });
  }

  private initPlayerToWords() {
    this.playersOrder.forEach((player: string) => {
      this.playerToWords.set(player, []);
    });
  }

  private distributeRoles() {
    let ucCount = this.underCoverCount;
    let whiteCount = this.mrWhiteCount;
    const players = this.getPlayers();
    const distribution: number[] = players.map(() => {
      if (ucCount > 0) {
        ucCount -= 1;
        return 1;
      }
      if (whiteCount > 0) {
        whiteCount -= 1;
        return 2;
      }
      return 0;
    });

    players.forEach((player) => {
      let randomIdx = random(0, players.length);
      while (distribution[randomIdx] === -1) {
        randomIdx = random(0, players.length);
      }
      this.playerToRole.set(player, numberToRole(distribution[randomIdx]));
      distribution[randomIdx] = -1;
    });
  }

  private skipVotedOutPlayers() {
    while (this.votedOutPlayers.indexOf(this.getPlayerAt(this.turn)) !== -1) {
      this.turn += 1;
      if (this.turn !== 0 && this.turn % this.originalPlayerNumber === 0) {
        this.resetCurrentVote();
        this.status = Status.VOTING;
      }
    }
  }

  private renewWord() {
    this.distributeRoles();
    this.setPlayersOrder();
    this.assignWord();
    this.initPlayerToWords();
    this.turn = 0;
  }

  private resetState() {
    this.turn = 0;
    this.underCoverCount = 0;
    this.mrWhiteCount = 0;
    this.originalPlayerNumber = 0;
    this.remainingVilains = 0;
    this.currentPlayersVote = new Map();
    this.votedOutPlayers = [];
    this.status = Status.LOBBY;
  }
}

function numberToRole(nb: number) {
  if (nb === 0) {
    return Role.CIVILIAN;
  }
  if (nb === 1) {
    return Role.UNDERCOVER;
  }
  return Role.MR_WHITE;
}
