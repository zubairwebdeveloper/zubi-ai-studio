import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request) {
  try {
    const { email, name } = await request.json();

    const { data, error } = await resend.emails.send({
      from: "Zubair Developer <onboarding@resend.dev>",
      to: email,
      subject: "Welcome to Zubair Developer!",
      html: `
        <h1>Welcome ${name}!</h1>
        <p>Thank you for joining us.</p>
      `,
    });

    if (error) {
      return Response.json({ error: error.message }, { status: 400 });
    }

    return Response.json({ success: true, data });
  } catch (error) {
    return Response.json({ error: "Failed to send email" }, { status: 500 });
  }
}
