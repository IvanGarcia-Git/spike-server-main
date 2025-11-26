import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

export const sendEmail = async (
  toAddresses: string[],
  subject: string,
  htmlBody: string
) => {
  if (!resend) {
    console.warn('Email not sent: RESEND_API_KEY not configured');
    return null;
  }

  try {
    const { data, error } = await resend.emails.send({
      from: `Arrakis<${process.env.SENDER_EMAIL}>`,
      to: toAddresses,
      subject,
      html: htmlBody,
    });

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    throw error;
  }
};
