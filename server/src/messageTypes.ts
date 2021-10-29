import { Status, VoteResult, VoteUpdate } from './GameState';

export interface Message {
  topic: string;
  subtopic: string;
  roomId?: string;
}

export interface PlayerTopicPayload extends Message {
  data: string;
}

export interface SettingTopicPayload extends Message {
  data: string;
}

export interface AssignedWordResponse extends Message {
  data: string;
}

export interface SettingTopicResponse extends Message {
  data: {
    underCoverCount: number,
    mrWhiteCount: number,
  }
}

export interface InGamePayload extends Message {
  data: string;
}

export interface InGameResponse extends Message {
  data: {
    turn: number,
    player: string,
    playerToWords: [string, string[]][],
    state: Status
  }
}

export interface MrWhiteGuessResponse extends Message {
  data: {
    state: Status
  }
}

export interface PlayerTopicResponse extends Message {
  data: string[];
}

export interface VoteAgainstPayload extends Message {
  data: string;
}
export interface VoteResultResponse extends Message {
  data: VoteResult;
}

export interface VoteUpdateResponse extends Message {
  data: VoteUpdate;
}
