import {
  Button,
  Section,
  Text,
  Hr,
} from '@react-email/components';
import * as React from 'react';
import { BaseLayout } from './base-layout';

interface ContractNotificationEmailProps {
  userName: string;
  contractType: 'LUZ' | 'GAS' | 'TELEFONIA';
  customerName: string;
  contractStatus: string;
  contractUrl?: string;
  message?: string;
}

export const ContractNotificationEmail = ({
  userName,
  contractType,
  customerName,
  contractStatus,
  contractUrl,
  message,
}: ContractNotificationEmailProps) => {
  const statusColors: Record<string, string> = {
    'VALIDADO': '#10b981',
    'PENDIENTE': '#f59e0b',
    'RECHAZADO': '#ef4444',
    'EN_PROCESO': '#3b82f6',
  };

  const statusColor = statusColors[contractStatus] || '#6b7280';

  return (
    <BaseLayout preview={`Actualizacion de contrato: ${contractType} - ${customerName}`}>
      <Section style={content}>
        <Text style={heading}>Notificacion de Contrato</Text>
        <Text style={paragraph}>Hola {userName},</Text>
        <Text style={paragraph}>
          {message || `Se ha actualizado el estado de un contrato asignado a ti.`}
        </Text>

        <Section style={contractBox}>
          <Text style={contractLabel}>Tipo de Contrato</Text>
          <Text style={contractValue}>{contractType}</Text>

          <Hr style={divider} />

          <Text style={contractLabel}>Cliente</Text>
          <Text style={contractValue}>{customerName}</Text>

          <Hr style={divider} />

          <Text style={contractLabel}>Estado</Text>
          <Text style={{ ...contractValue, color: statusColor, fontWeight: 'bold' }}>
            {contractStatus}
          </Text>
        </Section>

        {contractUrl && (
          <Section style={buttonContainer}>
            <Button style={button} href={contractUrl}>
              Ver Contrato
            </Button>
          </Section>
        )}

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

const contractBox = {
  backgroundColor: '#f6f9fc',
  borderRadius: '8px',
  padding: '20px 24px',
  margin: '24px 0',
};

const contractLabel = {
  color: '#8898aa',
  fontSize: '12px',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
  margin: '0 0 4px',
};

const contractValue = {
  color: '#32325d',
  fontSize: '16px',
  fontWeight: '500',
  margin: '0 0 12px',
};

const divider = {
  borderColor: '#e6ebf1',
  margin: '12px 0',
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

export default ContractNotificationEmail;
