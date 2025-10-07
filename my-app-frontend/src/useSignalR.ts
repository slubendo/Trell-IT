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
        // Retry after 1 seconds
        setTimeout(startConnection, 1000);
      }
    };

    // lifecycle events
    conn.onclose(error => {
      console.warn("⚠️ SignalR closed", error);
      if (active) {
        // don’t null the connection — it can reconnect
        startConnection();
      }
    });

    conn.onreconnecting(error => {
      console.log("🔄 Reconnecting...", error);
    });

    conn.onreconnected(connectionId => {
      console.log("✅ Reconnected:", connectionId);
      if (active) setConnection(conn);
    });

    // Start connection
    startConnection();

    // Cleanup
    return () => {
      active = false;
      // @ts-expect-error ...
      conn.off(); // remove all listeners
      conn.stop()
        .then(() => console.log("🛑 SignalR stopped"))
        .catch(err => console.error("Stop error:", err));
    };
  }, [url]);

  return { connection };
}
