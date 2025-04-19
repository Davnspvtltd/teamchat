import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import { ProtectedRoute } from "./lib/protected-route";
import { WebSocketProvider } from "./lib/websocket";
import { AuthProvider } from "./hooks/use-auth";
import { useState, useEffect } from "react";

// Create a separated Router component that only renders after initialization
function Router() {
  const [initialized, setInitialized] = useState(false);
  
  // Simple effect to delay rendering slightly to ensure auth is properly loaded
  useEffect(() => {
    const timer = setTimeout(() => {
      setInitialized(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);
  
  if (!initialized) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-pulse text-center">
        <div className="h-8 w-8 mx-auto border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-2 text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>;
  }
  
  return (
    <Switch>
      <ProtectedRoute path="/" component={HomePage} />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

// Create a safe WebSocket wrapper that doesn't break on auth errors
function SafeWebSocketProvider({ children }: { children: React.ReactNode }) {
  try {
    return <WebSocketProvider>{children}</WebSocketProvider>;
  } catch (error) {
    console.error("Error in WebSocketProvider:", error);
    return <>{children}</>;
  }
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light">
        <TooltipProvider>
          <AuthProvider>
            <SafeWebSocketProvider>
              <Toaster />
              <Router />
            </SafeWebSocketProvider>
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
