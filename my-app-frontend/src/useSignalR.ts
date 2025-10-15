import { useEffect, useState } from "react";
import {
  HubConnection,
  HubConnectionBuilder,
  LogLevel,
} from "@microsoft/signalr";

export default function useSignalR(url: string) {
  const [connection, setConnection] = useState<HubConnection | null>(null);



  useEffect(() => {
    let active = true;

    const conn = new HubConnectionBuilder()
      .withUrl(url)
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Information)
      .build();

    const startConnection = async () => {
      try {
        await conn.start();
        if (active) {
          console.log("✅ SignalR connected");
          setConnection(conn);
        }
      } catch (err) {
        console.error("❌ SignalR start error:", err);
        setTimeout(startConnection, 1000); // retry
      }
    };

    conn.onreconnecting(error => console.log("🔄 Reconnecting...", error));
    conn.onreconnected(connectionId => console.log("✅ Reconnected:", connectionId));
    conn.onclose(error => console.warn("⚠️ Connection closed", error));

    startConnection();

    return () => {
      active = false;
      conn.stop()
        .then(() => console.log("🛑 SignalR stopped"))
        .catch(err => console.error("Stop error:", err));
    };
  }, [url]);

  return { connection };
}
