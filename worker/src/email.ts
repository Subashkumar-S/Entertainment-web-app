import { Resend } from "resend";
import config from "./config";
import logger from "./logger";
import { ReminderJobData } from "./types";

const resend = new Resend(config.resendApiKey);

// Render the scheduled time in the user's chosen zone (falls back to UTC).
const formatWhen = (iso: string, tz?: string): string => {
  try {
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: tz,
    }).format(new Date(iso));
  } catch {
    return new Date(iso).toUTCString();
  }
};

// Sends the reminder email. Throws on failure so BullMQ retries the job.
export const sendReminderEmail = async (data: ReminderJobData): Promise<void> => {
  const when = formatWhen(data.remindAtISO, data.remindTz);
  const link = `${config.clientOrigin}/title/${data.mediaType}/${data.titleId}`;
  const poster = data.posterPath ? `https://image.tmdb.org/t/p/w300${data.posterPath}` : "";

  const html = `
  <div style="font-family:'Outfit',Arial,sans-serif;background:#10141e;color:#fff;padding:32px;border-radius:12px;max-width:480px;margin:auto;">
    <p style="color:#fc4747;font-size:13px;letter-spacing:1px;margin:0 0 8px;">CINEPLAN REMINDER</p>
    <h1 style="font-size:22px;margin:0 0 16px;">Time to watch ${data.title}</h1>
    ${poster ? `<img src="${poster}" alt="${data.title}" style="width:100%;border-radius:8px;margin-bottom:16px;" />` : ""}
    <p style="color:#cfd5f0;margin:0 0 20px;">You planned to watch this around <strong>${when}</strong>. Grab some popcorn 🍿</p>
    <a href="${link}" style="display:inline-block;background:#fc4747;color:#fff;text-decoration:none;padding:12px 24px;border-radius:999px;">Open in Cineplan</a>
  </div>`;

  const { error } = await resend.emails.send({
    from: config.emailFrom,
    to: data.email,
    subject: `🎬 Time to watch ${data.title}`,
    html,
  });

  if (error) {
    throw new Error(`Resend send failed: ${typeof error === "string" ? error : JSON.stringify(error)}`);
  }
  logger.debug({ to: data.email, title: data.title }, "reminder email dispatched");
};
