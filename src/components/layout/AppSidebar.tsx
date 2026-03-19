import {
  LayoutDashboard, Briefcase, Zap, CheckCircle2, FileText, BarChart3,
  Sparkles, Settings, BookOpen, Globe, Link2, SlidersHorizontal, ChevronLeft
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarHeader, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

const mainItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Job Matches", url: "/jobs", icon: Briefcase },
  { title: "Auto Apply Queue", url: "/queue", icon: Zap },
  { title: "Applied Jobs", url: "/applied", icon: CheckCircle2 },
];

const resumeItems = [
  { title: "Resume Manager", url: "/resumes", icon: FileText },
  { title: "ATS Analyzer", url: "/ats", icon: BarChart3 },
  { title: "Resume Optimizer", url: "/optimizer", icon: Sparkles },
];

const configItems = [
  { title: "Preferences", url: "/preferences", icon: SlidersHorizontal },
  { title: "Answer Bank", url: "/answers", icon: BookOpen },
  { title: "Source Capabilities", url: "/sources", icon: Globe },
  { title: "Connected Accounts", url: "/accounts", icon: Link2 },
  { title: "Settings", url: "/settings", icon: Settings },
];

function SidebarSection({ label, items, collapsed }: { label: string; items: typeof mainItems; collapsed: boolean }) {
  const location = useLocation();
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild>
                <NavLink
                  to={item.url}
                  end
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150 hover:bg-accent"
                  activeClassName="bg-sidebar-accent text-sidebar-accent-foreground"
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {!collapsed && <span>{item.title}</span>}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function AppSidebar() {
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <Zap className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-bold text-lg">JobMatch AI</span>
            </div>
          )}
          <Button variant="ghost" size="icon" onClick={toggleSidebar} className="h-8 w-8">
            <ChevronLeft className={`h-4 w-4 transition-transform duration-150 ${collapsed ? "rotate-180" : ""}`} />
          </Button>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarSection label="Main" items={mainItems} collapsed={collapsed} />
        <SidebarSection label="Resume" items={resumeItems} collapsed={collapsed} />
        <SidebarSection label="Configuration" items={configItems} collapsed={collapsed} />
      </SidebarContent>
      <SidebarFooter className="p-4">
        {!collapsed && (
          <div className="text-xs text-muted-foreground text-center">
            JobMatch AI v1.0
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
