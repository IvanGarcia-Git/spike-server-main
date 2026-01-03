import * as React from 'react';
import { sendReactEmail, sendEmail } from '../helpers/resend.helper';
import { PasswordResetEmail } from '../emails/password-reset';
import { WelcomeEmail } from '../emails/welcome';
import { ContractNotificationEmail } from '../emails/contract-notification';
import { LiquidationNotificationEmail } from '../emails/liquidation-notification';

const CLIENT_BASE_URL = process.env.CLIENT_BASE_URL || 'http://localhost:4000';

export module EmailService {

  /**
   * Send password reset email
   */
  export const sendPasswordResetEmail = async (
    email: string,
    userUuid: string,
    userName?: string
  ) => {
    const resetUrl = `${CLIENT_BASE_URL}/reset-password?token=${userUuid}`;

    const emailComponent = React.createElement(PasswordResetEmail, {
      userName: userName || 'Usuario',
      resetUrl,
    });

    return sendReactEmail(
      [email],
      'Restablecer Contrasena - Spikes CRM',
      emailComponent
    );
  };

  /**
   * Send welcome email to new users
   */
  export const sendWelcomeEmail = async (
    email: string,
    userName: string
  ) => {
    const loginUrl = `${CLIENT_BASE_URL}/login`;

    const emailComponent = React.createElement(WelcomeEmail, {
      userName,
      loginUrl,
    });

    return sendReactEmail(
      [email],
      'Bienvenido a Spikes CRM',
      emailComponent
    );
  };

  /**
   * Send contract notification email
   */
  export const sendContractNotificationEmail = async (
    email: string,
    userName: string,
    contractType: 'LUZ' | 'GAS' | 'TELEFONIA',
    customerName: string,
    contractStatus: string,
    contractUuid?: string,
    message?: string
  ) => {
    const contractUrl = contractUuid
      ? `${CLIENT_BASE_URL}/contratos/${contractUuid}`
      : undefined;

    const emailComponent = React.createElement(ContractNotificationEmail, {
      userName,
      contractType,
      customerName,
      contractStatus,
      contractUrl,
      message,
    });

    return sendReactEmail(
      [email],
      `Actualizacion de Contrato ${contractType} - ${customerName}`,
      emailComponent
    );
  };

  /**
   * Send liquidation notification email
   */
  export const sendLiquidationNotificationEmail = async (
    email: string,
    userName: string,
    period: string,
    totalAmount: number,
    contractCount: number,
    status: string,
    liquidationUuid?: string,
    documentUrl?: string
  ) => {
    const liquidationUrl = liquidationUuid
      ? `${CLIENT_BASE_URL}/liquidaciones/${liquidationUuid}`
      : undefined;

    const emailComponent = React.createElement(LiquidationNotificationEmail, {
      userName,
      period,
      totalAmount,
      contractCount,
      status,
      liquidationUrl,
      documentUrl,
    });

    return sendReactEmail(
      [email],
      `Liquidacion ${period} - Spikes CRM`,
      emailComponent
    );
  };

  /**
   * Send generic notification email (uses legacy HTML template)
   */
  export const sendNotificationEmail = async (
    email: string,
    subject: string,
    htmlContent: string
  ) => {
    return sendEmail([email], subject, htmlContent);
  };
}
