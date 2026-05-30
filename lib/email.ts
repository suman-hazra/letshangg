/**
 * Email sender via Resend.
 *
 * No SDK needed — Resend's REST API is one fetch call. Skipping the SDK
 * keeps the dep tree light and avoids version churn.
 *
 * Requires:
 *   - RESEND_API_KEY in env
 *   - A verified domain on Resend (here: letshangg.app)
 *
 * If RESEND_API_KEY is missing or the call fails, this returns silently —
 * email is a notification, not a transaction. Failures should never block
 * the user's match flow.
 */

const RESEND_ENDPOINT = "https://api.resend.com/emails";
const FROM_ADDRESS = "letshangg <hello@letshangg.app>";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://letshangg.app";

export async function sendMatchEmail(args: {
  toEmail: string;
  toName: string;
  friendName: string;
  promptCopy: string;
  matchId: string;
}): Promise<void> {
  if (!process.env.RESEND_API_KEY) return;

  const matchUrl = `${SITE_URL}/match/${args.matchId}`;
  const subject = `You matched with ${args.friendName} on letshangg`;
  const html = renderMatchHtml({
    toName: args.toName,
    friendName: args.friendName,
    promptCopy: args.promptCopy,
    matchUrl,
  });

  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: args.toEmail,
        subject,
        html,
      }),
    });

    if (!res.ok) {
      // Log to stderr so it's visible in Vercel logs, but don't throw.
      console.error("resend send failed", res.status, await res.text());
    }
  } catch (err) {
    console.error("resend send threw", err);
  }
}

function renderMatchHtml(args: {
  toName: string;
  friendName: string;
  promptCopy: string;
  matchUrl: string;
}): string {
  // Inline-styled HTML for max compatibility across mail clients.
  const safeName = escapeHtml(args.toName);
  const safeFriend = escapeHtml(args.friendName);
  const safeCopy = escapeHtml(args.promptCopy);
  const safeUrl = escapeAttr(args.matchUrl);

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>You matched with ${safeFriend}</title>
</head>
<body style="margin:0;padding:0;background:#f7f5f2;font-family:-apple-system,BlinkMacSystemFont,'DM Sans',Helvetica,Arial,sans-serif;color:#1a1714;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f7f5f2;">
    <tr>
      <td align="center" style="padding:48px 24px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:480px;">
          <tr>
            <td style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#7a7570;">
              letshangg
            </td>
          </tr>
          <tr>
            <td style="padding-top:12px;">
              <span style="display:inline-block;width:6px;height:6px;border-radius:3px;background:#e8855a;vertical-align:middle;"></span>
              <span style="margin-left:8px;font-size:11px;letter-spacing:3px;text-transform:uppercase;font-weight:600;color:#1a1714;">Matched</span>
            </td>
          </tr>
          <tr>
            <td style="padding-top:24px;font-family:'DM Serif Display',Georgia,serif;font-size:34px;line-height:1.15;color:#1a1714;">
              ${safeName}, you and ${safeFriend} both said yes.
            </td>
          </tr>
          <tr>
            <td style="padding-top:24px;font-size:16px;line-height:1.5;color:#1a1714;">
              <em style="color:#7a7570;">"${safeCopy}"</em>
            </td>
          </tr>
          <tr>
            <td style="padding-top:32px;">
              <a href="${safeUrl}" style="display:inline-block;background:#1a1714;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:999px;font-size:14px;font-weight:600;">Open conversation</a>
            </td>
          </tr>
          <tr>
            <td style="padding-top:40px;font-size:13px;color:#7a7570;">
              The text never had to be sent. You both opted in privately. Now you can plan it.
            </td>
          </tr>
          <tr>
            <td style="padding-top:48px;font-size:11px;color:#7a7570;">
              <a href="${SITE_URL}" style="color:#7a7570;text-decoration:none;">letshangg.app</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendFriendRequestEmail(args: {
  toEmail: string;
  toName: string;
  requesterName: string;
  friendsUrl: string;
}): Promise<void> {
  if (!process.env.RESEND_API_KEY) return;

  const subject = `${args.requesterName} wants to hang with you on letshangg`;
  const html = renderFriendRequestHtml({
    toName: args.toName,
    requesterName: args.requesterName,
    friendsUrl: args.friendsUrl,
  });

  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: args.toEmail,
        subject,
        html,
      }),
    });

    if (!res.ok) {
      console.error("resend send failed", res.status, await res.text());
    }
  } catch (err) {
    console.error("resend send threw", err);
  }
}

function renderFriendRequestHtml(args: {
  toName: string;
  requesterName: string;
  friendsUrl: string;
}): string {
  const safeName = escapeHtml(args.toName);
  const safeRequester = escapeHtml(args.requesterName);
  const safeUrl = escapeAttr(args.friendsUrl);

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${safeRequester} wants to hang</title>
</head>
<body style="margin:0;padding:0;background:#f7f5f2;font-family:-apple-system,BlinkMacSystemFont,'DM Sans',Helvetica,Arial,sans-serif;color:#1a1714;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f7f5f2;">
    <tr>
      <td align="center" style="padding:48px 24px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:480px;">
          <tr>
            <td style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#7a7570;">
              letshangg
            </td>
          </tr>
          <tr>
            <td style="padding-top:12px;">
              <span style="display:inline-block;width:6px;height:6px;border-radius:3px;background:#e8855a;vertical-align:middle;"></span>
              <span style="margin-left:8px;font-size:11px;letter-spacing:3px;text-transform:uppercase;font-weight:600;color:#1a1714;">Friend request</span>
            </td>
          </tr>
          <tr>
            <td style="padding-top:24px;font-family:'DM Serif Display',Georgia,serif;font-size:34px;line-height:1.15;color:#1a1714;">
              ${safeName}, ${safeRequester} wants to hang.
            </td>
          </tr>
          <tr>
            <td style="padding-top:24px;font-size:16px;line-height:1.5;color:#7a7570;">
              Accept the request to start getting matched on things you'd both enjoy.
            </td>
          </tr>
          <tr>
            <td style="padding-top:32px;">
              <a href="${safeUrl}" style="display:inline-block;background:#1a1714;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:999px;font-size:14px;font-weight:600;">See friend request</a>
            </td>
          </tr>
          <tr>
            <td style="padding-top:48px;font-size:11px;color:#7a7570;">
              <a href="${SITE_URL}" style="color:#7a7570;text-decoration:none;">letshangg.app</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeAttr(s: string): string {
  return escapeHtml(s);
}
