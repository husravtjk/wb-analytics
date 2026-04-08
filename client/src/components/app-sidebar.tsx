import { BarChart3, Package, Upload, Sun, Moon } from "lucide-react";
import { useLocation } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { useTheme } from "./theme-provider";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/", label: "Дашборд", icon: BarChart3 },
  { href: "/products", label: "Товары", icon: Package },
  { href: "/upload", label: "Загрузить", icon: Upload },
];

export default function AppSidebar() {
  const [location, setLocation] = useHashLocation();
  const { theme, toggle } = useTheme();

  return (
    <aside className="w-56 shrink-0 border-r border-sidebar-border bg-sidebar h-screen flex flex-col" data-testid="sidebar">
      {/* Logo */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <svg width="28" height="28" viewBox="0 0 32 32" fill="none" aria-label="WB Analytics">
            <rect x="2" y="2" width="28" height="28" rx="6" stroke="currentColor" strokeWidth="2" className="text-primary" />
            <path d="M8 22 L12 10 L16 18 L20 10 L24 22" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary" />
          </svg>
          <span className="font-semibold text-sm tracking-tight">WB Аналитика</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1">
        {navItems.map((item) => {
          const active = location === item.href;
          return (
            <button
              key={item.href}
              onClick={() => setLocation(item.href)}
              data-testid={`nav-${item.label}`}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                active
                  ? "bg-primary text-primary-foreground font-medium"
                  : "text-sidebar-foreground hover:bg-sidebar-accent"
              }`}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Theme toggle */}
      <div className="p-3 border-t border-sidebar-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggle}
          className="w-full justify-start gap-2 text-xs"
          data-testid="theme-toggle"
        >
          {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
          {theme === "dark" ? "Светлая тема" : "Тёмная тема"}
        </Button>
      </div>
    </aside>
  );
}
