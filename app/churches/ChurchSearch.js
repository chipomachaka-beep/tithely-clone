"use client";

// Search box and list of churches. Typing filters by name or town.
import { useState } from "react";
import Link from "next/link";

export default function ChurchSearch({ churches }) {
  const [query, setQuery] = useState("");
  const words = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  const matches = churches.filter((c) => {
    const text = `${c.name} ${c.city}`.toLowerCase();
    return words.every((word) => text.includes(word));
  });

  return (
    <>
      <label className="church-search">
        <span className="visually-hidden">Search by church name or town</span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by church name or town, e.g. Invitation Hill or Dickinson"
          autoFocus
        />
      </label>

      <p className="church-count" aria-live="polite">
        {matches.length === 0
          ? "No churches match your search."
          : `${matches.length} ${matches.length === 1 ? "church" : "churches"}`}
      </p>

      <ul className="church-list">
        {matches.map((c) =>
          c.active ? (
            <li key={c.slug}>
              <Link href={`/church/${c.slug}`} className="church-item church-item-active">
                <span className="church-mark" aria-hidden="true">
                  ✝
                </span>
                <span className="church-text">
                  <strong>{c.name}</strong>
                  <span>{c.city}</span>
                </span>
                <span className="church-go">Give here →</span>
              </Link>
            </li>
          ) : (
            <li key={c.slug}>
              <div className="church-item" aria-disabled="true">
                <span className="church-mark" aria-hidden="true">
                  ✝
                </span>
                <span className="church-text">
                  <strong>{c.name}</strong>
                  <span>{c.city}</span>
                </span>
                <span className="church-soon">Not on this demo yet</span>
              </div>
            </li>
          )
        )}
      </ul>
    </>
  );
}
