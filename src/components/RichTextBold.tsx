import type { CSSProperties } from "react";

/**
 * Parágrafo simples: **negrito** com asteriscos duplos.
 */
export function RichTextBold({
  text,
  className = "",
  style,
}: {
  text: string;
  className?: string;
  style?: CSSProperties;
}) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <p className={className} style={style}>
      {parts.map((part, i) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <strong key={i} className="font-[800] text-black">
            {part.slice(2, -2)}
          </strong>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </p>
  );
}
