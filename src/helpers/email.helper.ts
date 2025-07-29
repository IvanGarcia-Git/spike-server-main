import { Notification } from "../models/notification.entity";

export namespace EmailHelper {
  const getEmailStyles = (): string => {
    return `
        <style>
          body {
            font-family: 'Montserrat', sans-serif;
            padding: 20px;
            margin: 0;
            background-color: #f8f9fa;
          }
          .container {
            background-color: #ffffff;
            border-radius: 12px;
            padding: 30px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            max-width: 600px;
            margin: 40px auto;
          }
          .header {
            text-align: center;
            margin-bottom: 20px;
          }
          .logo {
            max-width: 180px;
          }
          h1 {
            color:rgb(243, 211, 0);
            font-size: 1.8rem;
            text-align: center;
          }
          p {
            color: #333;
            line-height: 1.6;
            font-size: 1rem;
          }
          .highlight {
            color: #f7941e;
            font-weight: bold;
          }
          .cta-button {
            display: block;
            width: 100%;
            text-align: center;
            background-color:rgb(243, 211, 0);
            color: #ffffff !important;
            padding: 12px;
            font-size: 1rem;
            font-weight: bold;
            border-radius: 6px;
            text-decoration: none;
            margin-top: 20px;
          }
          .cta-button:hover {
            background-color:rgb(208, 181, 3);
          }
          .button {
            display: inline-block;
            padding: 10px 20px;
            margin-top: 15px;
            background-color:rgb(243, 211, 0);
            color: #ffffff !important;
            text-decoration: none;
            border-radius: 5px;
          }
          .footer {
            margin-top: 20px;
            font-size: 0.9em;
            text-align: center;
            color: #777;
          }
        </style>
      `;
  };

  export const passwordResetEmail = (userUuid: string): string => {
    const apiUrl = process.env.CLIENT_BASE_URL;

    return `
          <!DOCTYPE html>
          <html>
          <head>
            ${getEmailStyles()}
          </head>
          <body>
            <div class="container">
              <h1>Restablecimiento de Contraseña</h1>
              <p>Hola,</p>
              <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en <span class="highlight">Arrakis</span>.</p>
              <p>Si no realizaste esta solicitud, puedes ignorar este correo. De lo contrario, haz clic en el siguiente enlace para continuar:</p>
              <a href="${apiUrl}/reset-password?token=${userUuid}" class="cta-button">Restablecer Contraseña</a>
              <p>Este enlace es válido por un tiempo limitado.</p>
              <p>Atentamente,<br>El equipo de Arrakis</p>
            </div>
          </body>
          </html>
        `;
  };

  export const notificationEmail = (notification: Notification): string => {

    const apiUrl = process.env.CLIENT_BASE_URL;
    const emailTitle = notification.subject || "Tienes una Nueva Notificación";
    const emailMessage = notification.content || `Tienes una nueva notificación del sistema: ${notification.eventType}`;
    const notificationUrl = notification.documentUri;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        ${getEmailStyles()}
      </head>
      <body>
        <div class="container">
          <h1>${emailTitle}</h1>
  
          <p>Hola,</p>
  
          <p>${emailMessage}</p>
  
          ${notificationUrl ?
        `
            <p>Puedes ver el archivo adjunto aqui:</p>
            <p><a href="${notificationUrl}" class="button">Ver Archivo</a></p>
            `
        : ''
      }
  
          <p>Este es un correo automático. Por favor, no respondas directamente.</p>
  
          <p>Atentamente,<br>El equipo de Arrakis</p>
  
          <p class="footer"><a href="${apiUrl}/notifications-settings">Gestionar mis preferencias de notificación</a></p>
  
        </div>
      </body>
      </html>
      `;
  };

}
