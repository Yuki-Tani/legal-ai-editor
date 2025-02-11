'use client'

import React, { useState } from "react";

export default function SampleCallRouteHandler(): React.ReactElement {
  const [message, setMessage] = useState<string | null>(null);
  
  async function handleClick() {
    const res = await fetch("/api/sample");
    const json = await res.json();
    setMessage(json.message);
  }

  return (
    <div>
      <button onClick={handleClick}>Call API</button>
      <p>{message}</p>
    </div>
  );
}