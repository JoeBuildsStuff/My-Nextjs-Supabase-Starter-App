import { Badge } from "@/components/ui/badge"

export default function BadgeDemo() {
  return (
    <div className="prose dark:prose-invert flex flex-col">
      <div className="space-y-2">
        <h4 className="mt-0">Badge Variants</h4>
        <div className="flex flex-wrap gap-4">
          <Badge variant="default">Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="destructive">Destructive</Badge>
          <Badge variant="outline">Outline</Badge>
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="">Color Variants</h4>
        <div className="flex flex-wrap gap-4">
          <Badge variant="gray">Gray</Badge>
          <Badge variant="red">Red</Badge>
          <Badge variant="yellow">Yellow</Badge>
          <Badge variant="green">Green</Badge>
          <Badge variant="blue">Blue</Badge>
          <Badge variant="indigo">Indigo</Badge>
          <Badge variant="purple">Purple</Badge>
          <Badge variant="pink">Pink</Badge>
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="">Usage Examples</h4>
        <div className="flex flex-wrap gap-4">
          <Badge variant="green">Completed</Badge>
          <Badge variant="yellow">In Progress</Badge>
          <Badge variant="red">High Priority</Badge>
          <Badge variant="blue">Feature</Badge>
          <Badge variant="gray">Documentation</Badge>
        </div>
      </div>
    </div>
  )
}
