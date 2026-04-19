import { NextResponse } from "next/server";

export function ok(data, status = 200) {
  return NextResponse.json({ ok: true, ...data }, { status });
}

export function fail(message, status = 400, details = null) {
  return NextResponse.json(
    {
      ok: false,
      message,
      details
    },
    { status }
  );
}
