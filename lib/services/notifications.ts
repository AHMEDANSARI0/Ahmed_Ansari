import { env } from "@/lib/env";

type InquiryNotification = {
  name: string;
  email: string;
  message: string;
};

export function isEmailConfigured() {
  return Boolean(env.RESEND_API_KEY && env.NOTIFICATION_EMAIL_FROM && env.NOTIFICATION_EMAIL_TO);
}

export async function queueInquiryNotification(payload: InquiryNotification) {
  if (!isEmailConfigured()) return { sent: false, reason: "not-configured" as const };

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.NOTIFICATION_EMAIL_FROM,
      to: [env.NOTIFICATION_EMAIL_TO],
      subject: `New inquiry from ${payload.name}`,
      text: `${payload.name} <${payload.email}>\n\n${payload.message}`,
    }),
  });

  if (!response.ok) {
    return { sent: false, reason: "provider-error" as const };
  }

  return { sent: true as const };
}
