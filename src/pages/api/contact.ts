import type { APIRoute } from "astro";

export const prerender = false;

const MAX_LENGTHS = {
  name: 120,
  email: 200,
  phone: 60,
  message: 5000,
};

type ContactPayload = {
  name?: unknown;
  email?: unknown;
  phone?: unknown;
  message?: unknown;
  website?: unknown;
};

function clean(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function json(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const POST: APIRoute = async ({ request }) => {
  let payload: ContactPayload;

  try {
    payload = (await request.json()) as ContactPayload;
  } catch {
    return json({ success: false, error: "Invalid request body." }, 400);
  }

  // Honeypot: real users never fill this hidden field.
  if (clean(payload.website, 100)) {
    return json({ success: true });
  }

  const name = clean(payload.name, MAX_LENGTHS.name);
  const email = clean(payload.email, MAX_LENGTHS.email);
  const phone = clean(payload.phone, MAX_LENGTHS.phone);
  const message = clean(payload.message, MAX_LENGTHS.message);

  if (!name || !email || !phone || !message) {
    return json(
      { success: false, error: "Please complete every field before sending." },
      400,
    );
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json(
      { success: false, error: "Please enter a valid email address." },
      400,
    );
  }

  const lead = {
    name,
    email,
    phone,
    message,
    submittedAt: new Date().toISOString(),
    source: "flyingpromotion.com",
  };

  const webhookUrl = import.meta.env.CONTACT_WEBHOOK_URL;
  const resendKey = import.meta.env.RESEND_API_KEY;
  const toEmail = import.meta.env.CONTACT_TO_EMAIL;
  const fromEmail = import.meta.env.CONTACT_FROM_EMAIL;

  try {
    if (webhookUrl) {
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(lead),
      });

      if (!res.ok) {
        console.error("Contact webhook failed:", res.status, await res.text());
        return json(
          {
            success: false,
            error: "We could not deliver your message. Please try again.",
          },
          502,
        );
      }

      return json({ success: true });
    }

    if (resendKey && toEmail && fromEmail) {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [toEmail],
          reply_to: email,
          subject: `New project enquiry from ${name}`,
          text: [
            `Name: ${name}`,
            `Email: ${email}`,
            `Phone: ${phone}`,
            "",
            message,
          ].join("\n"),
          html: `
            <h2 style="margin:0 0 16px">New project enquiry</h2>
            <p><strong>Name:</strong> ${escapeHtml(name)}</p>
            <p><strong>Email:</strong> ${escapeHtml(email)}</p>
            <p><strong>Phone:</strong> ${escapeHtml(phone)}</p>
            <p><strong>Message:</strong></p>
            <p style="white-space:pre-wrap">${escapeHtml(message)}</p>
          `,
        }),
      });

      if (!res.ok) {
        console.error("Resend failed:", res.status, await res.text());
        return json(
          {
            success: false,
            error: "We could not deliver your message. Please try again.",
          },
          502,
        );
      }

      return json({ success: true });
    }

    // No delivery method configured. Never pretend the message was sent.
    console.error(
      "Contact form is not configured. Set CONTACT_WEBHOOK_URL or RESEND_API_KEY, CONTACT_TO_EMAIL and CONTACT_FROM_EMAIL.",
    );
    return json(
      {
        success: false,
        error:
          "The contact form is not connected yet. Please email us directly once the address is published, or try again later.",
      },
      503,
    );
  } catch (error) {
    console.error("Contact form error:", error);
    return json(
      {
        success: false,
        error: "Something went wrong while sending your message. Please try again.",
      },
      500,
    );
  }
};
