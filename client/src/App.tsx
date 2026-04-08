import { Switch, Route, Router } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import Dashboard from "./pages/dashboard";
import Products from "./pages/products";
import Upload from "./pages/upload";
import NotFound from "./pages/not-found";
import AppSidebar from "./components/app-sidebar";
import { ThemeProvider } from "./components/theme-provider";

function AppLayout() {
  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar />
      <main className="flex-1 overflow-y-auto">
        <Router hook={useHashLocation}>
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/products" component={Products} />
            <Route path="/upload" component={Upload} />
            <Route component={NotFound} />
          </Switch>
        </Router>
      </main>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AppLayout />
        <Toaster />
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
