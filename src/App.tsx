
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { AuthProvider } from "./hooks/useAuth";
import { PostHogProvider } from "./lib/posthog";
import { useEffect } from "react";
import { validateEnv } from "./lib/env";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => {
  // Validate environment variables on app startup
  useEffect(() => {
    validateEnv();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <PostHogProvider>
          <TooltipProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </PostHogProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
