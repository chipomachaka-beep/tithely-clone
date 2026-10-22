"use client";

// Opens the browser's print window. From there people can print on paper
// or choose "Save as PDF".
export default function PrintButton() {
  return (
    <button type="button" className="button button-accent" onClick={() => window.print()}>
      Print or save as PDF
    </button>
  );
}
