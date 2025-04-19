import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

interface WebSocketContextType {
  sendMessage: (type: string, payload: any) => void;
  lastMessage: any;
  connected: boolean;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export const WebSocketProvider = ({ children }: { children: ReactNode }) => {
  // Wrap auth in try/catch to prevent breaking the app if there's an auth error
  let user = null;
  try {
    const auth = useAuth();
    user = auth.user;
  } catch (error) {
    console.error("Error accessing auth context:", error);
  }
  
  const { toast } = useToast();
  const [connected, setConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<any>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  // Function to create and setup WebSocket connection
  const setupWebSocket = () => {
    try {
      if (!user) return null;

      // Setup WebSocket connection
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      console.log(`Attempting to connect to WebSocket at ${wsUrl}`);
      const socket = new WebSocket(wsUrl);
      
      socket.onopen = () => {
        console.log("WebSocket connected");
        setConnected(true);
        reconnectAttemptsRef.current = 0;
        
        // Authenticate the WebSocket connection with userId
        try {
          const authMessage = {
            type: "auth",
            payload: { userId: user.id }
          };
          console.log("Sending WebSocket authentication:", authMessage);
          socket.send(JSON.stringify(authMessage));
        } catch (error) {
          console.error("Error authenticating WebSocket:", error);
        }
      };

      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log("WebSocket message received:", message);
          
          // Handle auth_success message specifically
          if (message.type === "auth_success") {
            console.log("WebSocket authentication successful!");
            toast({
              title: "Connected",
              description: "Real-time messaging connection established",
              variant: "default"
            });
          }
          
          setLastMessage(message);
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };

      socket.onclose = (event) => {
        console.log(`WebSocket disconnected with code ${event.code}`);
        setConnected(false);
        
        // Try to reconnect if not a normal closure and we have not exceeded max attempts
        if (event.code !== 1000 && reconnectAttemptsRef.current < maxReconnectAttempts) {
          const timeout = Math.min(1000 * (2 ** reconnectAttemptsRef.current), 30000);
          console.log(`Attempting to reconnect in ${timeout}ms (attempt ${reconnectAttemptsRef.current + 1})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current += 1;
            socketRef.current = setupWebSocket();
          }, timeout);
        } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          console.log("Max reconnect attempts reached, giving up");
          toast({
            title: "Connection lost",
            description: "Could not reconnect to the messaging service",
            variant: "destructive"
          });
        }
      };

      socket.onerror = (error) => {
        console.error("WebSocket error:", error);
      };

      return socket;
    } catch (error) {
      console.error("Error setting up WebSocket:", error);
      return null;
    }
  };

  // Connect to WebSocket when user is authenticated
  useEffect(() => {
    // Clear any existing reconnect timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    // Close any existing connection
    if (socketRef.current) {
      try {
        if (socketRef.current.readyState === WebSocket.OPEN) {
          socketRef.current.close();
        }
      } catch (error) {
        console.error("Error closing WebSocket:", error);
      }
      socketRef.current = null;
    }
    
    if (!user) {
      setConnected(false);
      return;
    }

    // Reset reconnect attempts
    reconnectAttemptsRef.current = 0;
    
    // Setup new connection
    socketRef.current = setupWebSocket();

    // Cleanup
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      if (socketRef.current) {
        try {
          if (socketRef.current.readyState === WebSocket.OPEN) {
            socketRef.current.close();
          }
        } catch (error) {
          console.error("Error closing WebSocket during cleanup:", error);
        }
      }
    };
  }, [user]);

  // Periodic ping to keep the connection alive
  useEffect(() => {
    if (!connected) return;

    const pingInterval = setInterval(() => {
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        try {
          socketRef.current.send(JSON.stringify({ type: "ping" }));
        } catch (error) {
          console.error("Error sending ping:", error);
        }
      }
    }, 30000); // Send ping every 30 seconds

    return () => clearInterval(pingInterval);
  }, [connected]);

  // Send message to server
  const sendMessage = (type: string, payload: any) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      console.warn("Cannot send message, WebSocket not connected");
      return;
    }
    
    try {
      socketRef.current.send(JSON.stringify({ type, payload }));
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  return (
    <WebSocketContext.Provider value={{ sendMessage, lastMessage, connected }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error("useWebSocket must be used within a WebSocketProvider");
  }
  return context;
};
