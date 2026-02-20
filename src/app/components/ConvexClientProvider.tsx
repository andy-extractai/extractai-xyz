"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ReactNode, useState } from "react";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL ?? "https://fearless-gazelle-923.convex.cloud";

export default function ConvexClientProvider({ children }: { children: ReactNode }) {
  const [convex] = useState(() => new ConvexReactClient(CONVEX_URL));
  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
