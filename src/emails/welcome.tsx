import {
  Button,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';
import { BaseLayout } from './base-layout';

interface WelcomeEmailProps {
  userName: string;
  loginUrl: string;
}

export const WelcomeEmail = ({
  userName,
  loginUrl,
}: WelcomeEmailProps) => {
  return (
    <BaseLayout preview="Bienvenido a Spikes CRM">
      <Section style={content}>
        <Text style={heading}>Bienvenido a Spikes CRM</Text>
        <Text style={paragraph}>Hola {userName},</Text>
        <Text style={paragraph}>
          Tu cuenta ha sido creada exitosamente en Spikes CRM. Ahora puedes acceder al sistema y comenzar a gestionar tus contratos y clientes.
        </Text>
        <Section style={featureBox}>
          <Text style={featureTitle}>Con Spikes CRM podras:</Text>
          <Text style={featureItem}>- Gestionar leads y oportunidades</Text>
          <Text style={featureItem}>- Crear y administrar contratos</Text>
          <Text style={featureItem}>- Hacer seguimiento de tus comisiones</Text>
          <Text style={featureItem}>- Organizar tus tareas diarias</Text>
        </Section>
        <Section style={buttonContainer}>
          <Button style={button} href={loginUrl}>
            Acceder a Spikes CRM
          </Button>
        </Section>
        <Text style={paragraph}>
          Si tienes alguna pregunta, no dudes en contactar con tu supervisor o con el equipo de soporte.
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

const featureBox = {
  backgroundColor: '#f6f9fc',
  borderRadius: '8px',
  padding: '16px 24px',
  margin: '24px 0',
};

const featureTitle = {
  color: '#10b981',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0 0 12px',
};

const featureItem = {
  color: '#525f7f',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '0',
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

export default WelcomeEmail;
