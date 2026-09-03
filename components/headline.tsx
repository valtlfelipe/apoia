/**
 * Renders `text` with `highlight` (if it appears literally inside it) wrapped
 * in the `.mark` treatment. Headlines can be fully customized via ENV, so
 * this degrades gracefully to plain text when the substring isn't found
 * rather than assuming any particular sentence structure.
 */
export function Headline({ text, highlight }: { text: string; highlight?: string }) {
  const index = highlight ? text.indexOf(highlight) : -1;
  if (index === -1 || !highlight) {
    return <>{text}</>;
  }

  const before = text.slice(0, index);
  const after = text.slice(index + highlight.length);

  return (
    <>
      {before}
      <span className="mark">{highlight}</span>
      {after}
    </>
  );
}
