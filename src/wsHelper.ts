import type { AddPlayerPayload } from "./wsTypes";

export function wrapAddPlayerPayload(message: string): AddPlayerPayload {
  return {
    topic: 'player',
    subtopic: 'add',
    data: message
  }
}
