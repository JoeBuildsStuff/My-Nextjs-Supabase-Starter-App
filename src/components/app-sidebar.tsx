"use client"

import * as React from "react"
import {
  AudioWaveform,
  Command,
  GalleryVerticalEnd,
  FormInput,
  Table,
  LayoutDashboard,
  Badge,
  Presentation,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

import { User } from '@supabase/supabase-js'

// Add interface for the user data
interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  userData: User;
}

// Update the data object
const data = {
  teams: [
    {
      name: "Acme Inc",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
    {
      name: "Acme Corp.",
      logo: AudioWaveform,
      plan: "Startup",
    },
    {
      name: "Evil Corp.",
      logo: Command,
      plan: "Free",
    },
  ],
  navMain: [
    {
      title: "Workspace",
      url: "/workspace",
      icon: LayoutDashboard,
      isActive: true,
      items: [
        {
          title: "Canvas",
          url: "/workspace/canvas",
          icon: Presentation,
        },
        {
          title: "Forms",
          url: "/workspace/forms",
          icon: FormInput,
          items: [
            {
              title: "Basic",
              url: "/workspace/forms/basic",
            },
            {
              title: "Advanced",
              url: "/workspace/forms/advanced",
            },
          ],
        },
        {
          title: "Tables",
          url: "/workspace/tables",
          icon: Table,
          items: [
            {
              title: "Table 1",
              url: "/workspace/tables/1",
            },
            {
              title: "Table 2",
              url: "/workspace/tables/2",
            },
            {
              title: "Table 3",
              url: "/workspace/tables/3",
            },
          ],
        },
        {
          title: "UI Stuff",
          url: "/workspace/ui-stuff",
          icon: Badge,
        },
      ],
    },
  ],      
}

export function AppSidebar({ userData, ...props }: AppSidebarProps) {
  const user = {
    name: userData.user_metadata?.full_name || userData.email?.split('@')[0] || 'User',
    email: userData.email || '',
    avatar: userData.user_metadata?.avatar_url || userData.user_metadata?.picture || '',
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
