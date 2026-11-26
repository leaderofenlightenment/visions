import {
  Aperture, AudioLines, BookOpen, BrainCircuit, BriefcaseBusiness, ChartNoAxesCombined, CircleDot,
  Eye, FileText, Folder, GitFork, Heart, Image, Layers3, LayoutDashboard, Leaf, Lightbulb, Link2,
  Network, PanelsTopLeft, Play, Settings, ShieldCheck,
} from 'lucide-react'

export const agentIcons = { vision: Eye, integration: Link2, story: BookOpen, insight: Lightbulb, outcome: ChartNoAxesCombined, negation: ShieldCheck, system: PanelsTopLeft }
export const outputIcons = { music: AudioLines, articles: FileText, posts: Play, threads: Layers3, visuals: Image }
export const moduleIcons = { lifestyle: Leaf, business: BriefcaseBusiness, relationships: Heart }
export const navIcons = {
  dashboard: LayoutDashboard, agents: BrainCircuit, lifestyle: Leaf, business: BriefcaseBusiness, relationships: Heart,
  codex: BookOpen, course: BookOpen, projects: Folder, knowledge: Network, content: Aperture, analytics: ChartNoAxesCombined, settings: Settings,
}
export const domainIcons = [BookOpen, BrainCircuit, CircleDot, Aperture, Network, GitFork, Heart, Leaf, BriefcaseBusiness]
