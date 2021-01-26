export interface Message {
  topic: string;
  subtopic: string;
}

export interface AddPlayerPayload extends Message {
  data: string;
}

export interface UpdatePlayerMessage extends Message {
  data: string[];
}
