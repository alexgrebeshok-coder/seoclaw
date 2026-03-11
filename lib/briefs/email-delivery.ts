import { generatePortfolioBrief, generateProjectBrief } from "@/lib/briefs/generate";
import { resolveBriefLocale, type BriefLocale } from "@/lib/briefs/locale";
import {
  getEmailConnectorConfig,
  getEmailDefaultTo,
  sendEmailTextMessage,
} from "@/lib/connectors/email-client";

type EmailDeliveryScope = "portfolio" | "project";

export interface EmailBriefDeliveryRequest {
  scope: EmailDeliveryScope;
  projectId?: string;
  locale?: BriefLocale;
  recipient?: string | null;
  dryRun?: boolean;
}

export interface EmailBriefDeliveryResult {
  scope: EmailDeliveryScope;
  locale: BriefLocale;
  recipient: string | null;
  headline: string;
  delivered: boolean;
  dryRun: boolean;
  subject: string;
  previewText: string;
  bodyText: string;
  messageId?: string;
}

interface EmailBriefDeliveryDeps {
  env?: NodeJS.ProcessEnv;
  generatePortfolio?: typeof generatePortfolioBrief;
  generateProject?: typeof generateProjectBrief;
  sendMessage?: typeof sendEmailTextMessage;
}

export async function deliverBriefByEmail(
  request: EmailBriefDeliveryRequest,
  deps: EmailBriefDeliveryDeps = {}
): Promise<EmailBriefDeliveryResult> {
  const env = deps.env ?? process.env;
  const locale = resolveBriefLocale(request.locale);
  const generatePortfolio = deps.generatePortfolio ?? generatePortfolioBrief;
  const generateProject = deps.generateProject ?? generateProjectBrief;
  const sendMessage = deps.sendMessage ?? sendEmailTextMessage;

  if (request.scope === "project" && !request.projectId) {
    throw new Error("projectId is required for project brief delivery.");
  }

  const brief =
    request.scope === "portfolio"
      ? await generatePortfolio({ locale })
      : await generateProject(request.projectId!, { locale });

  const recipient = request.recipient?.trim() || getEmailDefaultTo(env);

  if (request.dryRun) {
    return {
      scope: request.scope,
      locale,
      recipient: recipient ?? null,
      headline: brief.headline,
      delivered: false,
      dryRun: true,
      subject: brief.formats.emailDigest.subject,
      previewText: brief.formats.emailDigest.preview,
      bodyText: brief.formats.emailDigest.body,
    };
  }

  if (!recipient) {
    throw new Error("Email recipient is required when no EMAIL_DEFAULT_TO is configured.");
  }

  const config = getEmailConnectorConfig(env);
  if (!config) {
    throw new Error("SMTP is not configured.");
  }

  const sendResult = await sendMessage(
    {
      config,
      to: recipient,
      subject: brief.formats.emailDigest.subject,
      text: brief.formats.emailDigest.body,
    }
  );

  if (!sendResult.ok) {
    throw new Error(sendResult.message);
  }

  return {
    scope: request.scope,
    locale,
    recipient,
    headline: brief.headline,
    delivered: true,
    dryRun: false,
    subject: brief.formats.emailDigest.subject,
    previewText: brief.formats.emailDigest.preview,
    bodyText: brief.formats.emailDigest.body,
    messageId: sendResult.messageId,
  };
}
