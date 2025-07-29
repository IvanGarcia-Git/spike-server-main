import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendEmail = async (
  toAddresses: string[],
  subject: string,
  htmlBody: string
) => {
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