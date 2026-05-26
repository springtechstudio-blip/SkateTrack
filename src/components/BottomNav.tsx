import { Link, useLocation } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Flame, FileText, Settings } from "lucide-react";
import { RollerSkate } from "@/components/icons/RollerSkate";

export function BottomNav() {
  const { pathname } = useLocation();
  const { user } = useAuth();

  const coachQ = useQuery({
    queryKey: ["coach_mode"],
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase.from("user_settings").select("coach_mode").eq("user_id", user.id).maybeSingle();
      return data?.coach_mode ?? false;
    },
    enabled: !!user,
    staleTime: 0,
  });

  const isCoach = coachQ.data ?? false;

  const items = [
    { to: "/app", label: "Abitudini", icon: Flame },
    { to: "/app/notes", label: "Note", icon: FileText },
    { to: isCoach ? "/app/coach" : "/app/skating", label: isCoach ? "Allenatore" : "Skating", icon: RollerSkate },
    { to: "/app/settings", label: "Impostazioni", icon: Settings },
  ] as const;

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-border bg-sidebar/95 backdrop-blur-xl">
      <div className="mx-auto max-w-xl grid grid-cols-4">
        {items.map(({ to, label, icon: Icon }) => {
          const active = to === "/app" ? pathname === "/app" : pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className="flex flex-col items-center gap-1 py-3 transition-colors"
              aria-label={label}
            >
              <Icon
                className={`h-5 w-5 transition-colors ${active ? "text-primary" : "text-muted-foreground"}`}
                strokeWidth={active ? 2.4 : 2}
              />
              <span className={`text-[10px] font-medium ${active ? "text-primary" : "text-muted-foreground"}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
