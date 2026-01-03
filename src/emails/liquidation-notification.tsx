import {
  Button,
  Section,
  Text,
  Hr,
} from '@react-email/components';
import * as React from 'react';
import { BaseLayout } from './base-layout';

interface LiquidationNotificationEmailProps {
  userName: string;
  period: string;
  totalAmount: number;
  contractCount: number;
  status: string;
  liquidationUrl?: string;
  documentUrl?: string;
}

export const LiquidationNotificationEmail = ({
  userName,
  period,
  totalAmount,
  contractCount,
  status,
  liquidationUrl,
  documentUrl,
}: LiquidationNotificationEmailProps) => {
  const statusLabels: Record<string, string> = {
    'PENDIENTE': 'Pendiente de Aprobacion',
    'APROBADA': 'Aprobada',
    'PAGADA': 'Pagada',
    'RECHAZADA': 'Rechazada',
  };

  const statusColors: Record<string, string> = {
    'PENDIENTE': '#f59e0b',
    'APROBADA': '#10b981',
    'PAGADA': '#3b82f6',
    'RECHAZADA': '#ef4444',
  };

  const formattedAmount = new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(totalAmount);

  return (
    <BaseLayout preview={`Liquidacion ${period} - ${formattedAmount}`}>
      <Section style={content}>
        <Text style={heading}>Notificacion de Liquidacion</Text>
        <Text style={paragraph}>Hola {userName},</Text>
        <Text style={paragraph}>
          Se ha generado una nueva liquidacion correspondiente al periodo {period}.
        </Text>

        <Section style={summaryBox}>
          <Text style={summaryTitle}>Resumen de Liquidacion</Text>

          <Section style={summaryRow}>
            <Text style={summaryLabel}>Periodo</Text>
            <Text style={summaryValue}>{period}</Text>
          </Section>

          <Hr style={divider} />

          <Section style={summaryRow}>
            <Text style={summaryLabel}>Contratos</Text>
            <Text style={summaryValue}>{contractCount} contratos</Text>
          </Section>

          <Hr style={divider} />

          <Section style={summaryRow}>
            <Text style={summaryLabel}>Estado</Text>
            <Text style={{ ...summaryValue, color: statusColors[status] || '#6b7280' }}>
              {statusLabels[status] || status}
            </Text>
          </Section>

          <Hr style={divider} />

          <Section style={totalRow}>
            <Text style={totalLabel}>Total a Percibir</Text>
            <Text style={totalValue}>{formattedAmount}</Text>
          </Section>
        </Section>

        <Section style={buttonContainer}>
          {liquidationUrl && (
            <Button style={button} href={liquidationUrl}>
              Ver Liquidacion
            </Button>
          )}
          {documentUrl && (
            <Button style={secondaryButton} href={documentUrl}>
              Descargar PDF
            </Button>
          )}
        </Section>

        <Text style={smallText}>
          Si tienes alguna pregunta sobre esta liquidacion, contacta con tu supervisor.
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

const summaryBox = {
  backgroundColor: '#f6f9fc',
  borderRadius: '8px',
  padding: '24px',
  margin: '24px 0',
};

const summaryTitle = {
  color: '#10b981',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 16px',
  textAlign: 'center' as const,
};

const summaryRow = {
  display: 'flex',
  justifyContent: 'space-between',
};

const summaryLabel = {
  color: '#8898aa',
  fontSize: '14px',
  margin: '0',
};

const summaryValue = {
  color: '#32325d',
  fontSize: '14px',
  fontWeight: '500',
  margin: '0',
  textAlign: 'right' as const,
};

const divider = {
  borderColor: '#e6ebf1',
  margin: '12px 0',
};

const totalRow = {
  display: 'flex',
  justifyContent: 'space-between',
  marginTop: '8px',
};

const totalLabel = {
  color: '#32325d',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0',
};

const totalValue = {
  color: '#10b981',
  fontSize: '20px',
  fontWeight: 'bold',
  margin: '0',
  textAlign: 'right' as const,
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
  marginRight: '12px',
};

const secondaryButton = {
  backgroundColor: '#ffffff',
  border: '2px solid #10b981',
  borderRadius: '8px',
  color: '#10b981',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
};

const smallText = {
  color: '#8898aa',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '16px 0',
  textAlign: 'center' as const,
};

export default LiquidationNotificationEmail;
