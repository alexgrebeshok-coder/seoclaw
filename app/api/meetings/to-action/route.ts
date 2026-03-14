import { NextRequest, NextResponse } from "next/server";

import { authorizeRequest } from "@/app/api/middleware/auth";
import { createMeetingToActionPacket } from "@/lib/meetings/meeting-to-action";
import { serverError, validationError } from "@/lib/server/api-utils";
import { meetingToActionSchema } from "@/lib/validators/meeting-to-action";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const authResult = await authorizeRequest(request, {
    permission: "RUN_MEETING_TO_ACTION",
  });

  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const body = await request.json();
    const parsed = meetingToActionSchema.safeParse(body);

    if (!parsed.success) {
      return validationError(parsed.error);
    }

    const packet = await createMeetingToActionPacket(parsed.data);
    return NextResponse.json(packet, { status: 201 });
  } catch (error) {
    return serverError(
      error,
      "Failed to create meeting-to-action packet.",
      "MEETING_TO_ACTION_FAILED"
    );
  }
}
