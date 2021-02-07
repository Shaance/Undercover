export interface VoteResult {
  turn: number,
  result: 'DRAW' | 'OUT',
  playerOut?: string,
  voteDetails?: [string, number][]
}

export interface VoteUpdate {
  playersWhoVoted: string[]
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
    playerToWords: any[]
  }
}

export interface VoteUpdateResponse extends Message {
  data: VoteUpdate;
}

export interface VoteResultResponse extends Message {
  data: VoteResult;
}