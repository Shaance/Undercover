import WebSocket from 'ws';
import express from 'express';
import { Express } from 'express-serve-static-core';
import factory from './ConfigLog4j';
import {
  handlePlayer,
  updateSettings,
  handleClosingConection,
  createGameState,
  handleGame,
  getWordFor,
  handleVote,
  getState,
  getClientsFromSameRoom,
} from './GameManager';
import { getUniqueID } from './helper';
import {
  Message, PlayerTopicPayload, SettingTopicPayload, InGamePayload, VoteAgainstPayload,
} from './messageTypes';

const logger = factory.getLogger('index');
const lookup = new Map<string, WebSocket>();
const expressServer = express();
const expressServerPort = 8081;
const websocketPort = 8080;

function setUpWebsocketConnection(wss: WebSocket.Server) {
  const updateClients = (clients: WebSocket[], message: string) => {
    logger.info(`Dispatching message to ${clients.length} clients.`);
    logger.info(`[OUT] ${message}`);
    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  };

  wss.on('connection', (ws: WebSocket) => {
    const clientId = getUniqueID();
    lookup.set(clientId, ws);
    ws.on('message', (message: WebSocket.Data) => {
      const parsedMessage: Message = JSON.parse(message.toString());
      logger.info(`[IN] received ${message} [${clientId}]`);
      const state = getState(parsedMessage?.roomId?.toUpperCase());
      if (!state) return;
      if (parsedMessage.topic === 'player') {
        const response = handlePlayer(parsedMessage as PlayerTopicPayload, parsedMessage.roomId, clientId);
        const webSockets = getClientsFromSameRoom(clientId).map((client) => lookup.get(client));
        updateClients(webSockets, JSON.stringify(response));
      } else if (parsedMessage.topic === 'settings') {
        const response = updateSettings(parsedMessage as SettingTopicPayload, clientId);
        const webSockets = getClientsFromSameRoom(clientId).map((client) => lookup.get(client));
        updateClients(webSockets, JSON.stringify(response));
      } else if (parsedMessage.topic === 'game') {
        const response = handleGame(clientId, parsedMessage as InGamePayload);
        const roomClients = getClientsFromSameRoom(clientId);
        const webSockets = roomClients.map((client) => lookup.get(client));
        updateClients(webSockets, JSON.stringify(response));
        logger.info(JSON.stringify(roomClients));
        if (parsedMessage.subtopic === 'start') {
          roomClients.forEach((client) => {
            const word = getWordFor(client, state);
            updateClients([lookup.get(client)], JSON.stringify(word));
          });
        }
      } else if (parsedMessage.topic === 'vote') {
        const response = handleVote(parsedMessage as VoteAgainstPayload, clientId);
        if (response) {
          const webSockets = getClientsFromSameRoom(clientId).map((client) => lookup.get(client));
          updateClients(webSockets, JSON.stringify(response));
        }
      }
    });

    ws.on('close', () => {
      const webSockets = getClientsFromSameRoom(clientId).map((client) => lookup.get(client));
      const response = handleClosingConection(clientId);
      lookup.delete(clientId);
      if (response.data?.length > 0) {
        updateClients(webSockets, JSON.stringify(response));
      }
    });
  });
}

function setUpExpressConnection(server: Express, port: number) {
  server.use((_, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header(
      'Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept',
    );
    next();
  });

  server.get('/rooms/:id', (req, res) => {
    const state = getState(req.params.id);
    if (state) {
      res.send(JSON.stringify(state.getPlayers()));
    } else {
      res.status(404).send(`Room ${req.params.id} does not exist`);
    }
  });

  server.post('/rooms', (_, res) => {
    res.send(JSON.stringify(createGameState()));
  });

  server.listen(port, () => {
    logger.info(`Express server started at http://localhost:${port}`);
  });
}

function main() {
  setUpWebsocketConnection(new WebSocket.Server({ port: websocketPort }));
  logger.info(`WebSocket server started at ws://localhost:${websocketPort}`);
  setUpExpressConnection(expressServer, expressServerPort);
}

main();
