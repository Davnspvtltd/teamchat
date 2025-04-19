import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

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
          
          // Add a timestamp when the message was received
          message._receivedAt = Date.now();
          
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
          
          // If this is a pong response, don't reset lastMessage or show toast
          // This keeps our connection alive without spamming the UI
          if (message.type !== "pong") {
            setLastMessage(message);
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };

      socket.onclose = (event) => {
        console.log(`WebSocket disconnected with code ${event.code}`);
        setConnected(false);
        
        // Consider 1005 (no status) and 1006 (abnormal closure) as non-fatal errors
        // that require reconnection. 1000 is normal closure (e.g. user logged out)
        const nonFatalCodes = [1005, 1006, 1001, 1012, 1013];
        const shouldReconnect = event.code !== 1000 && 
          (nonFatalCodes.includes(event.code) || reconnectAttemptsRef.current < maxReconnectAttempts);
        
        if (shouldReconnect) {
          // Implement exponential backoff with a minimum of 1 second and max of 30 seconds
          const timeout = Math.min(1000 * Math.pow(1.5, reconnectAttemptsRef.current), 30000);
          console.log(`Attempting to reconnect in ${timeout}ms (attempt ${reconnectAttemptsRef.current + 1})`);
          
          // Clear any existing timeout
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
          }
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current += 1;
            
            // Only attempt to reconnect if the user is still logged in
            if (user) {
              console.log(`Attempting reconnection, attempt ${reconnectAttemptsRef.current}`);
              socketRef.current = setupWebSocket();
            } else {
              console.log("User logged out, abandoning reconnection attempts");
            }
          }, timeout);
        } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          console.log("Max reconnect attempts reached, giving up");
          
          // Only show the toast if user hasn't manually logged out (code 1000)
          if (event.code !== 1000) {
            toast({
              title: "Connection lost",
              description: "Could not reconnect to the messaging service. Please refresh the page.",
              variant: "destructive"
            });
          }
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

  // Heartbeat mechanism to keep the connection alive and detect stale connections
  useEffect(() => {
    if (!connected) return;
    
    // Send more frequent pings (every 15 seconds) to prevent connection timeouts
    const pingInterval = setInterval(() => {
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        try {
          console.log("Sending ping to keep WebSocket connection alive");
          socketRef.current.send(JSON.stringify({ type: "ping" }));
        } catch (error) {
          console.error("Error sending ping:", error);
          
          // If we can't send a ping, the connection might be dead but not yet detected
          // Force a reconnection
          try {
            console.log("Ping failed, forcing reconnection");
            if (socketRef.current) {
              socketRef.current.close(1000, "Ping failed");
            }
            // Reset connection
            reconnectAttemptsRef.current = 0;
            setTimeout(() => {
              socketRef.current = setupWebSocket();
            }, 1000);
          } catch (closeError) {
            console.error("Error force-closing WebSocket:", closeError);
          }
        }
      } else if (socketRef.current) {
        console.log(`WebSocket not in OPEN state, current state: ${socketRef.current.readyState}`);
      }
    }, 15000); // Send ping every 15 seconds
    
    // Add a secondary heartbeat check every 45 seconds to detect
    // connections that appear open but are actually stale
    const heartbeatInterval = setInterval(() => {
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        console.log("Running WebSocket heartbeat check");
        // If lastPingTime exists and it's been more than 60 seconds since we received 
        // any message, assume the connection is stale
        const lastMessageTime = lastMessage ? new Date(lastMessage._receivedAt || 0).getTime() : 0;
        const now = Date.now();
        const threshold = 60000; // 60 seconds
        
        if (lastMessageTime && (now - lastMessageTime > threshold)) {
          console.log(`No message received in ${(now - lastMessageTime) / 1000} seconds, forcing reconnection`);
          try {
            if (socketRef.current) {
              socketRef.current.close(1000, "Heartbeat timeout");
            }
            // Reset connection
            reconnectAttemptsRef.current = 0;
            setTimeout(() => {
              socketRef.current = setupWebSocket();
            }, 1000);
          } catch (error) {
            console.error("Error force-closing stale WebSocket:", error);
          }
        }
      }
    }, 45000); // Check every 45 seconds

    return () => {
      clearInterval(pingInterval);
      clearInterval(heartbeatInterval);
    };
  }, [connected, lastMessage]);

  // Send message to server with retry capability
  const sendMessage = (type: string, payload: any) => {
    if (!user) {
      console.warn("Cannot send message, user not authenticated");
      return;
    }
    
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      console.warn("WebSocket not connected, queuing message for when connection is established");
      
      // Attempt to reconnect if not already trying
      if (reconnectAttemptsRef.current === 0 && !reconnectTimeoutRef.current) {
        console.log("Attempting to reconnect WebSocket to send message");
        reconnectAttemptsRef.current = 0;
        socketRef.current = setupWebSocket();
      }
      
      // For important messages, fall back to REST API if available
      if (type === "message") {
        console.log("Sending message via REST API as fallback");
        try {
          apiRequest("POST", "/api/messages", {
            conversationId: payload.conversationId,
            content: payload.content,
            attachments: payload.attachments || []
          }).then(() => {
            console.log("Message sent via REST API successfully");
            queryClient.invalidateQueries({ 
              queryKey: [`/api/conversations/${payload.conversationId}/messages`] 
            });
          }).catch(error => {
            console.error("Failed to send message via REST API:", error);
            toast({
              title: "Message not sent",
              description: "Please try again later",
              variant: "destructive"
            });
          });
        } catch (error) {
          console.error("Error attempting to send message via REST API:", error);
        }
      }
      
      return;
    }
    
    try {
      console.log(`Sending WebSocket message of type '${type}'`, payload);
      const message = JSON.stringify({ type, payload });
      socketRef.current.send(message);
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Connection error",
        description: "Failed to send message, please try again",
        variant: "destructive"
      });
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
