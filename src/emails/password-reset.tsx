import {
  Button,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';
import { BaseLayout } from './base-layout';

interface PasswordResetEmailProps {
  userName?: string;
  resetUrl: string;
}

export const PasswordResetEmail = ({
  userName = 'Usuario',
  resetUrl,
}: PasswordResetEmailProps) => {
  return (
    <BaseLayout preview="Restablece tu contrasena de Spikes CRM">
      <Section style={content}>
        <Text style={heading}>Restablecimiento de Contrasena</Text>
        <Text style={paragraph}>Hola {userName},</Text>
        <Text style={paragraph}>
          Hemos recibido una solicitud para restablecer la contrasena de tu cuenta en Spikes CRM.
        </Text>
        <Text style={paragraph}>
          Si no realizaste esta solicitud, puedes ignorar este correo. De lo contrario, haz clic en el siguiente boton para continuar:
        </Text>
        <Section style={buttonContainer}>
          <Button style={button} href={resetUrl}>
            Restablecer Contrasena
          </Button>
        </Section>
        <Text style={smallText}>
          Este enlace es valido por 24 horas. Si expira, deberas solicitar un nuevo restablecimiento.
        </Text>
        <Text style={paragraph}>
          Atentamente,<br />
          El equipo de Spikes CRM
        </Text>
      </Section>
    </BaseLayout>
  );
};

const content = {
  padding: '24px 48px',
};

const heading = {
  fontSize: '24px',
  fontWeight: 'bold',
  color: '#10b981',
  textAlign: 'center' as const,
  margin: '0 0 24px',
};

const paragraph = {
  color: '#525f7f',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 0',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#10b981',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 28px',
};

const smallText = {
  color: '#8898aa',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '16px 0',
  textAlign: 'center' as const,
};

export default PasswordResetEmail;
