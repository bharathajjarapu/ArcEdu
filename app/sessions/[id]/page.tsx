"use client";

import { use } from "react";
import { SessionDetails } from "@/components/screens/session-details";

export default function SessionPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    return <SessionDetails sessionId={id} />;
}
