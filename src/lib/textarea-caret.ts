/**
 * Approximate caret coordinates inside a <textarea> by mirroring its content
 * to a hidden <div> with identical typography + box metrics, then measuring
 * a span positioned at the target character offset.
 *
 * Adapted from the public-domain technique used by jh3y/component/co.
 * Returns viewport-relative pixel coordinates (top/left) plus the current
 * line height — caller usually offsets `top + lineHeight` to render below
 * the caret line.
 */

const MIRRORED_PROPERTIES = [
  "boxSizing",
  "width",
  "height",
  "overflowX",
  "overflowY",
  "borderTopWidth",
  "borderRightWidth",
  "borderBottomWidth",
  "borderLeftWidth",
  "borderStyle",
  "paddingTop",
  "paddingRight",
  "paddingBottom",
  "paddingLeft",
  "fontStyle",
  "fontVariant",
  "fontWeight",
  "fontStretch",
  "fontSize",
  "fontSizeAdjust",
  "lineHeight",
  "fontFamily",
  "textAlign",
  "textTransform",
  "textIndent",
  "textDecoration",
  "letterSpacing",
  "wordSpacing",
  "tabSize",
] as const;

export type CaretCoords = {
  /** Viewport-relative top of the caret line (in CSS pixels). */
  top: number;
  /** Viewport-relative left of the caret. */
  left: number;
  /** Computed line-height of the textarea. */
  lineHeight: number;
};

export function getTextareaCaretCoords(
  textarea: HTMLTextAreaElement,
  position: number,
): CaretCoords {
  const div = document.createElement("div");
  document.body.appendChild(div);

  const style = window.getComputedStyle(textarea);
  for (const prop of MIRRORED_PROPERTIES) {
    (div.style as unknown as Record<string, string>)[prop] = style.getPropertyValue(
      // camelCase -> kebab-case
      prop.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase()),
    );
  }
  div.style.position = "absolute";
  div.style.visibility = "hidden";
  div.style.whiteSpace = "pre-wrap";
  div.style.wordWrap = "break-word";
  // Use offsets that match the textarea but render off-screen.
  div.style.top = "0";
  div.style.left = "-9999px";

  div.textContent = textarea.value.substring(0, position);

  const span = document.createElement("span");
  // Trailing character so the span has a measurable box.
  span.textContent = textarea.value.substring(position) || ".";
  div.appendChild(span);

  const rect = textarea.getBoundingClientRect();
  const lineHeight = parseFloat(style.lineHeight || "0") || parseFloat(style.fontSize) * 1.4;
  const coords: CaretCoords = {
    top: rect.top + span.offsetTop - textarea.scrollTop,
    left: rect.left + span.offsetLeft - textarea.scrollLeft,
    lineHeight,
  };

  document.body.removeChild(div);
  return coords;
}
