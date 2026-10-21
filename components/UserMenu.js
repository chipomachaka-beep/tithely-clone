"use client";

// The signed-in person's name, which opens a small menu with
// My Giving and Log out. It closes when you pick something or go elsewhere.
import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function UserMenu({ name, logoutAction }) {
  const menu = useRef(null);
  const pathname = usePathname();

  // Close the menu whenever the page changes.
  useEffect(() => {
    if (menu.current) {
      menu.current.open = false;
    }
  }, [pathname]);

  // Close it when clicking anywhere outside it.
  useEffect(() => {
    function closeIfOutside(event) {
      if (menu.current && !menu.current.contains(event.target)) {
        menu.current.open = false;
      }
    }
    document.addEventListener("click", closeIfOutside);
    return () => document.removeEventListener("click", closeIfOutside);
  }, []);

  return (
    <details ref={menu} className="user-menu">
      <summary>
        {name}
        <span className="user-menu-caret" aria-hidden="true">
          ▾
        </span>
      </summary>
      <div className="user-menu-list">
        <Link href="/history">My Giving</Link>
        <form action={logoutAction}>
          <button type="submit">Log out</button>
        </form>
      </div>
    </details>
  );
}
