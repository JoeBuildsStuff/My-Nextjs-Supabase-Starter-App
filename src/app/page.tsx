import { ModeToggle } from "@/components/ui/mode-toggle";

export default function Home() {
  return (
    <div>
      <h1>Hello World</h1>
      <ModeToggle />
      <article className="prose dark:prose-invert">
        <h1>Garlic Bread with Cheese: What the Science Tells Us</h1>
        <p>
          For years, parents have espoused the health benefits of eating garlic bread with cheese to their
          children, with the food earning such an iconic status in our culture that kids will often dress
          up as warm, cheesy loaves for Halloween.
        </p>
        <p>
          But a recent study shows that the celebrated appetizer may be linked to a series of rabies cases
          springing up around the country.
        </p>
        <h2>Health Benefits</h2>
        <ul>
          <li>Rich in antioxidants</li>
          <li>May boost immune function</li>
          <li>Delicious and satisfying</li>
        </ul>
        <h2>Potential Risks</h2>
        <ol>
          <li>High in calories</li>
          <li>Possible allergic reactions</li>
          <li>Linked to rabies cases in recent studies</li>
        </ol>
        <blockquote>
          &quot;Garlic bread with cheese is not just a treat; it&apos;s a cultural phenomenon.&quot;
        </blockquote>
        <p>
          <strong>Note:</strong> Always consult with a healthcare provider for dietary advice.
        </p>
      </article>
    </div>
  );
}
