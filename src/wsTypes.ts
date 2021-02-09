export interface VoteResult {
  turn: number;
  result: 'DRAW' | 'OUT';
  playerOut?: string;
  playerOutRole?: Role;
  voteDetails?: [string, number][];
  gameState: Status;
}

export enum Role {
  UNDERCOVER = 'Undercover',
  MR_WHITE = 'Mr. White',
  OTHER = 'Civilian',
}

export interface VoteUpdate {
  playersWhoVoted: string[];
  state: string;
}
export interface Message {
  topic: string;
  subtopic: string;
}

export interface AddPlayerPayload extends Message {
  data: string;
}

export interface GetWordResponse extends Message {
  data: string;
}

export interface AddWordPayload extends Message {
  data: string;
}

export interface VoteAgainstPayload extends Message {
  data: string;
}

export interface GuessWordPayload extends Message {
  data: string;
}

export interface GuessWordResponse extends Message {
  data: Status;
}

export interface SettingTopicResponse extends Message {
  data: {
    underCoverCount: number,
    mrWhiteCount: number,
  }
}

export interface UpdatePlayerMessage extends Message {
  data: string[];
}
export interface InGameResponse extends Message {
  data: {
    turn: number,
    player: string,
    playerToWords: any[],
    state: string
  }
}

export interface VoteUpdateResponse extends Message {
  data: VoteUpdate;
}

export interface VoteResultResponse extends Message {
  data: VoteResult;
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
