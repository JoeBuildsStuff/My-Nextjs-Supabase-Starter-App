import {
  CheckCircle,
  Circle,
  CircleOff,
  HelpCircle,
  Timer,
} from "lucide-react"

export const labels = [
  {
    value: "Content Creation",
    label: "Content Creation",
  },
  {
    value: "SEO",
    label: "SEO",
  },
  {
    value: "Publishing",
    label: "Publishing",
  },
  {
    value: "Promotion",
    label: "Promotion",
  },
  {
    value: "Feedback",
    label: "Feedback",
  },
]

export const statuses = [
  {
    value: "Backlog",
    label: "Backlog",
    icon: HelpCircle,
  },
  {
    value: "Todo",
    label: "Todo",
    icon: Circle,
  },
  {
    value: "In Progress",
    label: "In Progress",
    icon: Timer,
  },
  {
    value: "Done",
    label: "Done",
    icon: CheckCircle,
  },
  {
    value: "Canceled",
    label: "Canceled",
    icon: CircleOff,
  },
]

export const priorities = [
  {
    label: "Low",
    value: "Low",
  },
  {
    label: "Medium",
    value: "Medium",
  },
  {
    label: "High",
    value: "High",
  },
]
