import { WebSocketServer, WebSocket } from "ws";
import { IncomingMessage } from "http";
import { parse } from "url";

export interface WSMessage {
  type:
    | "subscribe"
    | "unsubscribe"
    | "champion_selected"
    | "champion_locked"
    | "match_update";
  matchId?: number;
  playerId?: number;
  championId?: number;
  data?: any;
}

interface Client {
  ws: WebSocket;
  matchId?: number;
  userId?: number;
  isAdmin?: boolean;
}

export class TournamentWebSocketServer {
  private wss: WebSocketServer;
  private clients: Set<Client> = new Set();

  constructor(port: number) {
    this.wss = new WebSocketServer({ port });
    this.setupServer();
  }

  private setupServer() {
    this.wss.on("connection", (ws: WebSocket, req: IncomingMessage) => {
      const client: Client = { ws };
      this.clients.add(client);

      console.log("New WebSocket connection");

      ws.on("message", (data: string) => {
        try {
          const message: WSMessage = JSON.parse(data.toString());
          this.handleMessage(client, message);
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      });

      ws.on("close", () => {
        this.clients.delete(client);
        console.log("WebSocket connection closed");
      });

      ws.on("error", (error) => {
        console.error("WebSocket error:", error);
        this.clients.delete(client);
      });
    });

    console.log(`WebSocket server started on port ${this.wss.options.port}`);
  }

  private handleMessage(client: Client, message: WSMessage) {
    switch (message.type) {
      case "subscribe":
        if (message.matchId) {
          client.matchId = message.matchId;
          client.userId = message.data?.userId;
          client.isAdmin = message.data?.isAdmin;
          console.log(`Client subscribed to match ${message.matchId}`);
        }
        break;

      case "unsubscribe":
        client.matchId = undefined;
        console.log("Client unsubscribed");
        break;

      case "champion_selected":
        // Broadcast champion selection to all clients watching this match
        if (client.matchId) {
          this.broadcastToMatch(
            client.matchId,
            {
              type: "champion_selected",
              matchId: client.matchId,
              playerId: message.playerId,
              championId: message.championId,
              data: message.data,
            },
            client,
          );
        }
        break;

      case "champion_locked":
        // Broadcast lock event to all clients watching this match
        if (client.matchId) {
          this.broadcastToMatch(client.matchId, {
            type: "champion_locked",
            matchId: client.matchId,
            playerId: message.playerId,
            championId: message.championId,
            data: message.data,
          });
        }
        break;

      case "match_update":
        // Admin only - broadcast match status updates
        if (client.isAdmin && message.matchId) {
          this.broadcastToMatch(message.matchId, {
            type: "match_update",
            matchId: message.matchId,
            data: message.data,
          });
        }
        break;
    }
  }

  private broadcastToMatch(
    matchId: number,
    message: WSMessage,
    exclude?: Client,
  ) {
    const messageStr = JSON.stringify(message);

    this.clients.forEach((client) => {
      if (
        client !== exclude &&
        client.matchId === matchId &&
        client.ws.readyState === WebSocket.OPEN
      ) {
        client.ws.send(messageStr);
      }
    });
  }

  public broadcastMatchUpdate(matchId: number, data: any) {
    this.broadcastToMatch(matchId, {
      type: "match_update",
      matchId,
      data,
    });
  }

  public close() {
    this.clients.forEach((client) => {
      client.ws.close();
    });
    this.wss.close();
  }
}

// Singleton instance
let wsServer: TournamentWebSocketServer | null = null;

export function getWebSocketServer(): TournamentWebSocketServer {
  if (!wsServer) {
    const port = parseInt(process.env.WS_PORT || "3001");
    wsServer = new TournamentWebSocketServer(port);
  }
  return wsServer;
}
