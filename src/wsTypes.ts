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
