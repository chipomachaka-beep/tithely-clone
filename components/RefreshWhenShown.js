"use client";

// Reloads the page's data from the server when you come back to it: switching
// back to this browser tab, or returning with the Back button. That way a
// treasurer page left open never shows old totals.
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RefreshWhenShown() {
  const router = useRouter();

  useEffect(() => {
    function refreshIfVisible() {
      if (document.visibilityState === "visible") {
        router.refresh();
      }
    }
    function refreshIfRestored(event) {
      if (event.persisted) {
        router.refresh();
      }
    }
    document.addEventListener("visibilitychange", refreshIfVisible);
    window.addEventListener("pageshow", refreshIfRestored);
    return () => {
      document.removeEventListener("visibilitychange", refreshIfVisible);
      window.removeEventListener("pageshow", refreshIfRestored);
    };
  }, [router]);

  return null;
}
