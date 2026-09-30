"use client";

import Link from "next/link";

// Next.js hash navigation scrolls without moving focus in this version.
// This small client boundary lets keyboard users actually skip navigation.
export function SkipLink() {
  return (
    <Link
      href="#main-content"
      className="skip-link"
      onClick={() => document.getElementById("main-content")?.focus()}
    >
      Skip to main content
    </Link>
  );
}
