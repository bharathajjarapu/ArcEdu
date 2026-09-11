import { Suspense } from "react";
import { Session } from "@/components/screens/session";

export const metadata = { title: "Session" };

// Suspense lets the static shell prerender while the route id is read on the client.
export default function Page() {
  return (
    <Suspense>
      <Session />
    </Suspense>
  );
}
