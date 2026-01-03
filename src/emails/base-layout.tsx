import {
  Body,
  Container,
  Head,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface BaseLayoutProps {
  preview: string;
  children: React.ReactNode;
}

export const BaseLayout = ({ preview, children }: BaseLayoutProps) => {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={logoText}>Spikes CRM</Text>
          </Section>
          {children}
          <Section style={footer}>
            <Text style={footerText}>
              Este es un correo automatico de Spikes CRM.
            </Text>
            <Text style={footerText}>
              Por favor, no respondas directamente a este mensaje.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  borderRadius: '12px',
  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
  maxWidth: '600px',
};

const header = {
  padding: '20px 48px',
  borderBottom: '1px solid #e6ebf1',
};

const logoText = {
  fontSize: '24px',
  fontWeight: 'bold',
  color: '#10b981',
  textAlign: 'center' as const,
  margin: '0',
};

const footer = {
  padding: '20px 48px',
  borderTop: '1px solid #e6ebf1',
  marginTop: '20px',
};

const footerText = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
  textAlign: 'center' as const,
  margin: '4px 0',
};

export default BaseLayout;
