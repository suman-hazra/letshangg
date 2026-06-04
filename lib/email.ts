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
  const safeFriend = escapeHtml(args.friendName);
  const safeCopy = escapeHtml(args.promptCopy);
  const safeUrl = escapeAttr(args.matchUrl);
  const safeSiteUrl = escapeAttr(SITE_URL);
  const safeLogoUrl = escapeAttr(`${SITE_URL.replace(/\/$/, "")}/logo-mark.png`);
  const safeNameInitial = escapeHtml(initialFor(args.toName));
  const safeFriendInitial = escapeHtml(initialFor(args.friendName));

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>You matched with ${safeFriend}</title>
</head>
<body style="margin:0;padding:0;background:#f6fbff;font-family:-apple-system,BlinkMacSystemFont,'Plus Jakarta Sans','DM Sans',Helvetica,Arial,sans-serif;color:#2d3e4e;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f6fbff;background-image:linear-gradient(180deg,#f6fbff 0%,#fff8f4 100%);">
    <tr>
      <td align="center" style="padding:28px 16px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:430px;">
          <tr>
            <td align="center" style="padding:0 0 18px;">
              <img src="${safeLogoUrl}" width="57" alt="letshangg" style="display:block;border:0;height:auto;opacity:.92;">
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:0 0 18px;">
              <span style="display:inline-block;background:#f09070;background-image:linear-gradient(135deg,#f09070,#e87060);color:#ffffff;border-radius:999px;padding:11px 22px;font-size:13px;line-height:1;font-weight:800;letter-spacing:.12em;text-transform:uppercase;box-shadow:0 6px 20px rgba(232,112,96,.28);">
                Matched
              </span>
            </td>
          </tr>
          <tr>
            <td style="background:rgba(255,255,255,.78);border:1px solid rgba(255,255,255,.9);border-radius:26px;padding:26px 24px;text-align:center;box-shadow:0 8px 28px rgba(44,62,78,.1);">
              <div style="font-family:'Lora','DM Serif Display',Georgia,serif;font-size:23px;line-height:1.26;font-weight:700;color:#2d3e4e;">
                ${safeCopy}
              </div>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-top:24px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center" width="86" style="width:86px;">
                    <div style="margin:0 auto;width:56px;height:56px;border-radius:999px;border:3px solid #ffffff;background:#f0e4fa;color:#7a4faa;font-family:'Lora','DM Serif Display',Georgia,serif;font-size:23px;line-height:56px;font-weight:700;text-align:center;box-shadow:0 4px 14px rgba(44,62,78,.12);">${safeNameInitial}</div>
                    <div style="padding-top:8px;font-size:12px;line-height:1.25;font-weight:800;color:#2d3e4e;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">You</div>
                  </td>
                  <td align="center" width="34" style="width:34px;color:#e87060;font-size:20px;line-height:56px;">+</td>
                  <td align="center" width="86" style="width:86px;">
                    <div style="margin:0 auto;width:56px;height:56px;border-radius:999px;border:3px solid #ffffff;background:#dceefa;color:#4a7fa5;font-family:'Lora','DM Serif Display',Georgia,serif;font-size:23px;line-height:56px;font-weight:700;text-align:center;box-shadow:0 4px 14px rgba(44,62,78,.12);">${safeFriendInitial}</div>
                    <div style="padding-top:8px;font-size:12px;line-height:1.25;font-weight:800;color:#2d3e4e;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${safeFriend}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-top:16px;font-family:'Lora','DM Serif Display',Georgia,serif;font-size:15px;line-height:1.4;font-style:italic;color:#7f96a8;">
              you both said yes
            </td>
          </tr>
          <tr>
            <td style="padding-top:28px;">
              <a href="${safeUrl}" style="display:block;background:#8cc0eb;background-image:linear-gradient(135deg,#8cc0eb,#6aaad8);color:#ffffff;text-decoration:none;text-align:center;padding:15px 24px;border-radius:999px;font-size:15px;line-height:1.2;font-weight:800;box-shadow:0 8px 24px rgba(108,170,216,.36);">Open Conversation</a>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-top:20px;font-size:13px;line-height:1.5;color:#7f96a8;">
              The text never had to be sent. You both opted in privately. Now you can plan it.
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-top:34px;font-size:11px;color:#9aacba;">
              <a href="${safeSiteUrl}" style="color:#9aacba;text-decoration:none;">letshangg.app</a>
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
  const safeSiteUrl = escapeAttr(SITE_URL);
  const safeLogoUrl = escapeAttr(`${SITE_URL.replace(/\/$/, "")}/logo-mark.png`);
  const safeRequesterInitial = escapeHtml(initialFor(args.requesterName));

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${safeRequester} wants to hang</title>
</head>
<body style="margin:0;padding:0;background:#f6fbff;font-family:-apple-system,BlinkMacSystemFont,'Plus Jakarta Sans','DM Sans',Helvetica,Arial,sans-serif;color:#2d3e4e;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f6fbff;background-image:linear-gradient(180deg,#f6fbff 0%,#fff8f4 100%);">
    <tr>
      <td align="center" style="padding:28px 16px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:430px;">
          <tr>
            <td align="center" style="padding:0 0 18px;">
              <img src="${safeLogoUrl}" width="57" alt="letshangg" style="display:block;border:0;height:auto;opacity:.92;">
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:0 0 18px;">
              <span style="display:inline-block;background:#f09070;background-image:linear-gradient(135deg,#f09070,#e87060);color:#ffffff;border-radius:999px;padding:11px 22px;font-size:13px;line-height:1;font-weight:800;letter-spacing:.12em;text-transform:uppercase;box-shadow:0 6px 20px rgba(232,112,96,.28);">
                Friend request
              </span>
            </td>
          </tr>
          <tr>
            <td style="background:rgba(255,255,255,.78);border:1px solid rgba(255,255,255,.9);border-radius:26px;padding:26px 24px;text-align:center;box-shadow:0 8px 28px rgba(44,62,78,.1);">
              <div style="margin:0 auto 16px;width:56px;height:56px;border-radius:999px;border:3px solid #ffffff;background:#dceefa;color:#4a7fa5;font-family:'Lora','DM Serif Display',Georgia,serif;font-size:23px;line-height:56px;font-weight:700;text-align:center;box-shadow:0 4px 14px rgba(44,62,78,.12);">${safeRequesterInitial}</div>
              <div style="font-family:'Lora','DM Serif Display',Georgia,serif;font-size:23px;line-height:1.26;font-weight:700;color:#2d3e4e;">
                ${safeName}, ${safeRequester} wants to hang.
              </div>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-top:20px;font-size:13px;line-height:1.5;color:#7f96a8;">
              Accept the request to start getting matched on things you'd both enjoy.
            </td>
          </tr>
          <tr>
            <td style="padding-top:28px;">
              <a href="${safeUrl}" style="display:block;background:#8cc0eb;background-image:linear-gradient(135deg,#8cc0eb,#6aaad8);color:#ffffff;text-decoration:none;text-align:center;padding:15px 24px;border-radius:999px;font-size:15px;line-height:1.2;font-weight:800;box-shadow:0 8px 24px rgba(108,170,216,.36);">See Friend Request</a>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-top:34px;font-size:11px;color:#9aacba;">
              <a href="${safeSiteUrl}" style="color:#9aacba;text-decoration:none;">letshangg.app</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function initialFor(s: string): string {
  return s.trim().charAt(0).toUpperCase() || "?";
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
