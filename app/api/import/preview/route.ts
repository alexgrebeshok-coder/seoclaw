import { NextRequest, NextResponse } from "next/server";

import { authorizeRequest } from "@/app/api/middleware/auth";
import { extractImportFiles } from "@/app/api/import/_utils";
import { previewProjectImport } from "@/lib/import/project-import-service";
import { serverError } from "@/lib/server/api-utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const authResult = await authorizeRequest(request, {
      permission: "MANAGE_IMPORTS",
      workspaceId: "delivery",
    });
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const files = await extractImportFiles(request);
    const result = await previewProjectImport(files);
    return NextResponse.json(result);
  } catch (error) {
    return serverError(error, "Failed to build import preview.");
  }
}
