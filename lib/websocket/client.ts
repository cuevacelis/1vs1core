"use client";

import { useEffect, useRef, useState, useCallback } from "react";

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

export function useWebSocket(url: string) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WSMessage | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const connect = useCallback(() => {
    try {
      const ws = new WebSocket(url);

      ws.onopen = () => {
        console.log("WebSocket connected");
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const message: WSMessage = JSON.parse(event.data);
          setLastMessage(message);
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };

      ws.onclose = () => {
        console.log("WebSocket disconnected");
        setIsConnected(false);
        wsRef.current = null;

        // Attempt to reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 3000);
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
      };

      wsRef.current = ws;
    } catch (error) {
      console.error("Error creating WebSocket connection:", error);
    }
  }, [url]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  const send = useCallback((message: WSMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.error("WebSocket is not connected");
    }
  }, []);

  const subscribe = useCallback(
    (matchId: number, userId?: number, isAdmin?: boolean) => {
      send({
        type: "subscribe",
        matchId,
        data: { userId, isAdmin },
      });
    },
    [send],
  );

  const unsubscribe = useCallback(() => {
    send({ type: "unsubscribe" });
  }, [send]);

  const sendChampionSelected = useCallback(
    (matchId: number, playerId: number, championId: number, data?: any) => {
      send({
        type: "champion_selected",
        matchId,
        playerId,
        championId,
        data,
      });
    },
    [send],
  );

  const sendChampionLocked = useCallback(
    (matchId: number, playerId: number, championId: number, data?: any) => {
      send({
        type: "champion_locked",
        matchId,
        playerId,
        championId,
        data,
      });
    },
    [send],
  );

  return {
    isConnected,
    lastMessage,
    send,
    subscribe,
    unsubscribe,
    sendChampionSelected,
    sendChampionLocked,
  };
}
