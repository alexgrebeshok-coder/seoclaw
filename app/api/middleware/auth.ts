import { NextRequest, NextResponse } from "next/server";

import { getSession } from "@/lib/auth/get-session";
import { buildAccessProfile, type AccessProfile } from "@/lib/auth/access-profile";
import {
  canAccessWorkspace,
  hasPermission,
  resolveAccessibleWorkspace,
  type PlatformPermission,
  type PlatformWorkspaceId,
} from "@/lib/policy/access";
import { jsonError } from "@/lib/server/api-utils";

const DEFAULT_API_KEY = process.env.DASHBOARD_API_KEY;
const SKIP_AUTH = process.env.CEOCLAW_SKIP_AUTH === "true";

export interface AuthorizedRequestContext {
  accessProfile: AccessProfile;
  workspace: ReturnType<typeof resolveAccessibleWorkspace>;
}

interface AuthorizeRequestOptions {
  apiKey?: string | null;
  permission?: PlatformPermission;
  requireApiKey?: boolean;
  requireSession?: boolean;
  workspaceId?: PlatformWorkspaceId;
}

export async function authorizeRequest(
  request: NextRequest,
  options: AuthorizeRequestOptions = {}
): Promise<AuthorizedRequestContext | NextResponse> {
  // For cron jobs and webhooks that use API keys
  if (options.requireApiKey) {
    if (!DEFAULT_API_KEY) {
      return jsonError(500, "AUTH_NOT_CONFIGURED", "DASHBOARD_API_KEY environment variable is not set.");
    }

    const authorization = request.headers.get("authorization");
    if (!authorization || !authorization.startsWith("Bearer ")) {
      return jsonError(401, "UNAUTHORIZED", "Bearer token is required.");
    }

    const token = authorization.replace("Bearer ", "");
    const expectedApiKey = options.apiKey ?? DEFAULT_API_KEY;
    if (token !== expectedApiKey) {
      return jsonError(403, "INVALID_API_KEY", "Provided bearer token is invalid.");
    }

    // API key authenticated - use system access profile
    const accessProfile = buildAccessProfile({
      role: "EXEC",
      userId: "system",
      workspaceId: "executive",
    });

    const workspace = resolveAccessibleWorkspace(
      accessProfile.role,
      options.workspaceId ?? accessProfile.workspaceId
    );

    return {
      accessProfile: { ...accessProfile, workspaceId: workspace.id },
      workspace,
    };
  }

  // For regular API routes - require session authentication
  if (!SKIP_AUTH && options.requireSession !== false) {
    const session = await getSession();

    if (!session?.user) {
      return jsonError(401, "UNAUTHORIZED", "Authentication required. Please sign in.");
    }

    // Build access profile from session
    const accessProfile = buildAccessProfile({
      userId: session.user.id,
      name: session.user.name,
      role: session.user.role,
      organizationSlug: session.user.organizationSlug,
      workspaceId: session.user.workspaceId ?? options.workspaceId,
    });

    if (options.workspaceId && !canAccessWorkspace(accessProfile.role, options.workspaceId)) {
      return jsonError(
        403,
        "WORKSPACE_FORBIDDEN",
        `Role ${accessProfile.role} cannot access workspace ${options.workspaceId}.`
      );
    }

    if (options.permission && !hasPermission(accessProfile.role, options.permission)) {
      return jsonError(
        403,
        "PERMISSION_DENIED",
        `Role ${accessProfile.role} does not have permission ${options.permission}.`
      );
    }

    const workspace = resolveAccessibleWorkspace(
      accessProfile.role,
      options.workspaceId ?? accessProfile.workspaceId
    );

    return {
      accessProfile: { ...accessProfile, workspaceId: workspace.id },
      workspace,
    };
  }

  // Skip auth mode (development only) - NOT RECOMMENDED for production
  if (SKIP_AUTH) {
    console.warn("⚠️ CEOCLAW_SKIP_AUTH is enabled. This should NOT be used in production!");
    const accessProfile = buildAccessProfile();
    const workspace = resolveAccessibleWorkspace(
      accessProfile.role,
      options.workspaceId ?? accessProfile.workspaceId
    );
    return {
      accessProfile: { ...accessProfile, workspaceId: workspace.id },
      workspace,
    };
  }

  // Default: deny access
  return jsonError(401, "UNAUTHORIZED", "Authentication required.");
}

export function withAuth(
  req: NextRequest,
  _res: NextResponse,
  next: () => void
) {
  // This sync wrapper is deprecated - use authorizeRequest directly
  console.warn("⚠️ withAuth() is deprecated. Use authorizeRequest() instead.");
  next();
}
