import GameState from '../../GameState';

export interface StateData {
  state: GameState,
  playerToClient: Map<string, string>,
}

