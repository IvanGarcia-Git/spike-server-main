import { Resend } from 'resend';
import { render } from '@react-email/components';
import * as React from 'react';

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

/**
 * Send email with HTML string
 */
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
      from: `Spikes CRM <${process.env.SENDER_EMAIL}>`,
      to: toAddresses,
      subject,
      html: htmlBody,
    });

    if (error) {
      console.error('Resend error:', error);
      throw error;
    }

    console.log('Email sent successfully:', data?.id);
    return data;
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
};

/**
 * Send email with React Email component
 */
export const sendReactEmail = async (
  toAddresses: string[],
  subject: string,
  reactComponent: React.ReactElement
) => {
  if (!resend) {
    console.warn('Email not sent: RESEND_API_KEY not configured');
    return null;
  }

  try {
    const htmlBody = await render(reactComponent);

    const { data, error } = await resend.emails.send({
      from: `Spikes CRM <${process.env.SENDER_EMAIL}>`,
      to: toAddresses,
      subject,
      html: htmlBody,
    });

    if (error) {
      console.error('Resend error:', error);
      throw error;
    }

    console.log('Email sent successfully:', data?.id);
    return data;
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
};

export default {
  sendEmail,
  sendReactEmail,
};
