'use client'

import React, { useActionState } from "react";
import { SampleAction, SampleActionResult } from "@/api/sample/Actions";

export default function SampleCallServerAction(): React.ReactElement {
  const [actionResult, sampleAction, isPending] = useActionState<SampleActionResult>(SampleAction, { accountId: "", message: "" });

  return (
    <div>
      <form action={sampleAction}>
        <button type="submit">Call Server Action</button>
      </form>
      <p>{isPending ? "..." : actionResult.message}</p>
    </div>
  );
}