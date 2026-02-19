"use client";

import { usePathname } from "next/navigation";
import ThemeProvider from "./ThemeProvider";
import Sidebar from "./Sidebar";

const FULL_SCREEN_ROUTES = ["/pokemon"];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isFullScreen = FULL_SCREEN_ROUTES.includes(pathname);

  return (
    <ThemeProvider>
      {!isFullScreen && <Sidebar />}
      <main className={isFullScreen ? "" : "lg:ml-56"}>
        {children}
      </main>
    </ThemeProvider>
  );
}
