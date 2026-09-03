import type { Metadata } from "next";
import type { ReactNode } from "react";

// Applies to the whole /admin subtree, including the (unauthenticated)
// login page — never index any of it, regardless of login state.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return children;
}
