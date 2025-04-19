import { useAuth } from "@/hooks/use-auth";
import { AlertCircle, Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";
import { useState } from "react";

// Create a wrapper component that uses hooks properly
function ProtectedRouteInner({
  path,
  component: Component,
}: {
  path: string;
  component: () => React.JSX.Element;
}) {
  // Safely try to use auth
  let user = null;
  let isLoading = false;
  let error = null;
  
  try {
    const auth = useAuth();
    user = auth.user;
    isLoading = auth.isLoading;
    error = auth.error;
  } catch (e) {
    console.error("Error accessing auth context:", e);
    error = e instanceof Error ? e : new Error("Authentication error");
  }

  // Handle auth errors
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="mb-4 bg-destructive/10 p-3 rounded-md flex items-center">
          <AlertCircle className="h-5 w-5 text-destructive mr-2" />
          <span className="text-destructive font-medium">Authentication Error</span>
        </div>
        <p className="text-center mb-4 text-muted-foreground">
          There was a problem with authentication. Please try logging in again.
        </p>
        <a 
          href="/auth" 
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Go to Login
        </a>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-center text-muted-foreground">Verifying authentication...</p>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return <Redirect to="/auth" />;
  }

  // Authenticated - render the component
  return <Component />;
}

// Main protected route that wraps the inner component
export function ProtectedRoute({
  path,
  component,
}: {
  path: string;
  component: () => React.JSX.Element;
}) {
  return (
    <Route path={path}>
      <ProtectedRouteInner path={path} component={component} />
    </Route>
  );
}
