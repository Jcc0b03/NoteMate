import Link from "next/link";
import {
  BookOpen,
  Search,
  Settings,
  Star,
  Plus,
  MoreVertical,
  FileText,
  Clock,
  Menu
} from "lucide-react";

export default function Dashboard() {
  return (
    <div className="flex min-h-screen bg-background text-foreground font-sans">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card hidden md:flex flex-col">
        <div className="p-6 flex items-center gap-2 border-b border-border/40">
          <div className="size-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
            <BookOpen className="size-5" />
          </div>
          <span className="text-xl font-bold tracking-tight">NoteMate</span>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
          <NavItem href="#" icon={<FileText className="size-4" />} active>All Notes</NavItem>
          <NavItem href="#" icon={<Star className="size-4" />}>Favorites</NavItem>
          <NavItem href="#" icon={<Clock className="size-4" />}>Recent</NavItem>
          <NavItem href="#" icon={<BookOpen className="size-4" />}>Notebooks</NavItem>
        </nav>

        <div className="p-4 border-t border-border/40">
          <NavItem href="#" icon={<Settings className="size-4" />}>Settings</NavItem>
          <div className="mt-4 flex items-center gap-3 px-3 py-2">
            <div className="size-8 rounded-full bg-muted overflow-hidden flex items-center justify-center">
              <span className="text-xs font-semibold">JD</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium">John Doe</span>
              <span className="text-xs text-muted-foreground">Pro Plan</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-background/50">
        {/* Header */}
        <header className="h-16 border-b border-border flex items-center justify-between px-6 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex items-center gap-4 md:hidden">
            <button className="p-2 -ml-2 hover:bg-muted rounded-md text-muted-foreground">
              <Menu className="size-5" />
            </button>
            <span className="font-bold">NoteMate</span>
          </div>

          <div className="hidden md:flex flex-1 max-w-xl relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search notes..."
              className="w-full h-10 pl-10 pr-4 rounded-full bg-muted/50 border-none focus:ring-2 focus:ring-primary/20 focus:bg-background transition-all"
            />
          </div>

          <div className="flex items-center gap-3">
            <button className="hidden md:flex items-center gap-2 h-9 px-4 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20">
              <Plus className="size-4" />
              <span>New Note</span>
            </button>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="flex-1 p-6 md:p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto space-y-8">

            {/* Welcome Section */}
            <div className="flex flex-col gap-1">
              <h1 className="text-3xl font-bold tracking-tight">Good morning, John</h1>
              <p className="text-muted-foreground">Here's an overview of your workspace.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard label="Total Notes" value="128" trend="+4 this week" />
              <StatCard label="Favorites" value="12" />
              <StatCard label="Notebooks" value="5" />
            </div>

            {/* Recent Notes Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Recent Notes</h2>
                <Link href="#" className="text-sm text-primary hover:underline">View all</Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <NoteCard
                  title="Project Ideas 2024"
                  preview=" brainstorming session: 1. AI integration for..."
                  date="2h ago"
                  tag="Work"
                  color="blue"
                />
                <NoteCard
                  title="Meeting Notes: Design Sync"
                  preview="Attendees: Sarah, Mike, Tom. Action items: ..."
                  date="5h ago"
                  tag="Meeting"
                  color="green"
                />
                <NoteCard
                  title="Grocery List"
                  preview="Milk, Eggs, Bread, Avocados, Coffee beans..."
                  date="1d ago"
                  tag="Personal"
                  color="orange"
                />
                <NoteCard
                  title="React Components Structure"
                  preview="Atomic design principles: Atoms, Molecules..."
                  date="2d ago"
                  tag="Dev"
                  color="purple"
                />
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}

function NavItem({ href, icon, children, active }: { href: string; icon: React.ReactNode; children: React.ReactNode; active?: boolean }) {
  return (
    <Link
      href={href}
      className={`
        flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors
        ${active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
        }
      `}
    >
      {icon}
      {children}
    </Link>
  );
}

function StatCard({ label, value, trend }: { label: string; value: string; trend?: string }) {
  return (
    <div className="p-6 rounded-xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow">
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <div className="flex items-end justify-between">
          <span className="text-3xl font-bold">{value}</span>
          {trend && <span className="text-xs text-green-600 font-medium bg-green-500/10 px-2 py-1 rounded-full">{trend}</span>}
        </div>
      </div>
    </div>
  );
}

function NoteCard({ title, preview, date, tag, color }: { title: string; preview: string; date: string; tag: string; color: string }) {
  // Simple color mapping for demo
  const colorStyles: Record<string, string> = {
    blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    green: "bg-green-500/10 text-green-600 dark:text-green-400",
    orange: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
    purple: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  };

  return (
    <div className="group p-5 rounded-xl border border-border bg-card shadow-sm hover:shadow-md hover:border-primary/50 transition-all cursor-pointer flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-md ${colorStyles[color] || "bg-muted text-muted-foreground"}`}>
          {tag}
        </span>
        <button className="text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity">
          <MoreVertical className="size-4" />
        </button>
      </div>
      <div>
        <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">{title}</h3>
        <p className="text-muted-foreground text-sm mt-1 line-clamp-2">{preview}</p>
      </div>
      <div className="mt-auto pt-2 flex items-center gap-2 text-xs text-muted-foreground">
        <Clock className="size-3" />
        <span>{date}</span>
      </div>
    </div>
  );
}
