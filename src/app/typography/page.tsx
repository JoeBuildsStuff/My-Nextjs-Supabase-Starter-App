import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

export default function TypographyPage() {
  // Sample content to demonstrate typography
  const sampleContent = `
    <h1>The Art of Typography</h1>
    <p>Typography is the art and technique of arranging type to make written language legible, readable and appealing when displayed.</p>
    <h2>Understanding Type</h2>
    <p>Good typography requires understanding of:</p>
    <ul>
      <li>Font selection and pairing</li>
      <li>Visual hierarchy</li>
      <li>Reading patterns</li>
    </ul>
    <h3>The Role of White Space</h3>
    <p>White space, or negative space, is just as important as the text itself. It helps to:</p>
    <ol>
      <li>Improve readability</li>
      <li>Create visual hierarchy</li>
      <li>Guide the reader's eye</li>
    </ol>
    <blockquote>
      <p>"Typography is the craft of endowing human language with a durable visual form."</p>
      <cite>— Robert Bringhurst</cite>
    </blockquote>
    <h4>Technical Considerations</h4>
    <p>When implementing typography on the web, we must consider:</p>
    <pre><code>// Example of setting typography
const typographyStyles = {
  fontFamily: 'serif',
  lineHeight: 1.6
}</code></pre>
    <p>Below is a <a href="#">link example</a> and some <strong>bold text</strong> along with <em>italic text</em>.</p>
  `

  return (
    <div className="container mx-auto max-w-6xl py-10">
      <div className="space-y-6">
        {/* Introduction */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold">Tailwind Typography Demo</h1>
          <p className="text-muted-foreground">
            Compare unstyled HTML with Tailwind Typography&apos;s prose classes.
          </p>
        </div>

        <Separator />

        <div className="grid gap-8 md:grid-cols-2">
          {/* Unstyled HTML */}
          <Card>
            <CardHeader>
              <CardTitle>Without Prose Class</CardTitle>
              <CardDescription>
                Raw HTML without any Tailwind Typography styles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div 
                dangerouslySetInnerHTML={{ __html: sampleContent }}
              />
            </CardContent>
          </Card>

          {/* Styled with Prose */}
          <Card>
            <CardHeader>
              <CardTitle>With Prose Class</CardTitle>
              <CardDescription>
                Same HTML wrapped with the prose class
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div 
                className="prose dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: sampleContent }}
              />
            </CardContent>
          </Card>
        </div>

        {/* Prose Variants */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Prose Size Variants</CardTitle>
            <CardDescription>
              Tailwind Typography provides different size variants
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="prose-sm dark:prose-invert">
              <h3>Prose Small</h3>
              <p>This text uses the prose-sm variant, perfect for smaller content areas.</p>
            </div>
            
            <div className="prose dark:prose-invert">
              <h3>Prose Default</h3>
              <p>This is the default prose size, suitable for most content.</p>
            </div>
            
            <div className="prose-lg dark:prose-invert">
              <h3>Prose Large</h3>
              <p>The prose-lg variant provides larger text for more emphasis.</p>
            </div>
            
            <div className="prose-xl dark:prose-invert">
              <h3>Prose Extra Large</h3>
              <p>Use prose-xl for hero sections or when you need maximum impact.</p>
            </div>
          </CardContent>
        </Card>

        {/* Prose Customization */}
        <Card>
          <CardHeader>
            <CardTitle>Prose Customization</CardTitle>
            <CardDescription>
              Examples of customized prose styles
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="prose prose-stone dark:prose-invert">
              <h4>Stone Theme</h4>
              <p>Using prose-stone for a more neutral color palette.</p>
            </div>

            <div className="prose prose-img:rounded-xl prose-headings:underline prose-a:text-blue-600 dark:prose-invert">
              <h4>Custom Modifiers</h4>
              <p>This example uses custom modifiers for specific elements. <a href="#">This is a blue link</a>.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}