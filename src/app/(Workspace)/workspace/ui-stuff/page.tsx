import BadgeDemo from "./components/badge-example";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
export default function UiStuff() {
    return(
  <>
    <Card>
      <CardHeader>
        <CardTitle>Badges</CardTitle>
        <CardDescription>Various Badge Examples</CardDescription>
      </CardHeader>
      <CardContent>
        <BadgeDemo />
      </CardContent>
    </Card>
  </>
    )
}
