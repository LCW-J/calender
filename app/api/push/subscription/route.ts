import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { NextResponse } from "next/server";

function validSubscription(value: unknown): value is {
  endpoint: string;
  keys: { p256dh: string; auth: string };
} {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  const keys = item.keys as Record<string, unknown> | undefined;
  if (typeof item.endpoint !== "string" || item.endpoint.length > 2048) return false;
  if (!item.endpoint.startsWith("https://")) return false;
  return !!keys && typeof keys.p256dh === "string" && typeof keys.auth === "string";
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!validSubscription(body)) {
    return NextResponse.json({ error: "Invalid push subscription" }, { status: 400 });
  }

  const existing = await prisma.pushSubscription.findUnique({ where: { endpoint: body.endpoint } });
  const sameBrowserKeys =
    existing && existing.p256dh === body.keys.p256dh && existing.auth === body.keys.auth;
  if (existing && existing.userId !== session.user.id && !sameBrowserKeys) {
    return NextResponse.json({ error: "Subscription belongs to another user" }, { status: 409 });
  }

  if (existing) {
    await prisma.pushSubscription.update({
      where: { id: existing.id },
      data: {
        userId: session.user.id,
        p256dh: body.keys.p256dh,
        auth: body.keys.auth,
        userAgent: request.headers.get("user-agent"),
      },
    });
  } else {
    await prisma.pushSubscription.create({
      data: {
        userId: session.user.id,
        endpoint: body.endpoint,
        p256dh: body.keys.p256dh,
        auth: body.keys.auth,
        userAgent: request.headers.get("user-agent"),
      },
    });
  }

  return NextResponse.json({ enabled: true });
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null);
  const endpoint = body && typeof body.endpoint === "string" ? body.endpoint : "";
  if (!endpoint) return NextResponse.json({ error: "Invalid endpoint" }, { status: 400 });

  await prisma.pushSubscription.deleteMany({
    where: { userId: session.user.id, endpoint },
  });
  return new NextResponse(null, { status: 204 });
}
