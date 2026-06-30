import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly workerUrl: string;

  constructor(private config: ConfigService) {
    this.workerUrl = this.config.get('CLOUDFLARE_EMAIL_WORKER_URL', 'http://localhost:8787');
  }

  private async sendViaWorker(to: string, subject: string, htmlContent: string): Promise<void> {
    const response = await fetch(`${this.workerUrl}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, subject, htmlContent }),
    });

    if (!response.ok) {
      const error = await response.text();
      this.logger.error(`Cloudflare email worker error: ${response.status} ${error}`);
      throw new Error(`Failed to send email via Cloudflare Worker: ${response.status}`);
    }
  }

  async sendVerificationEmail(to: string, token: string, username: string) {
    const frontendUrl = this.config.get('FRONTEND_URL', 'http://localhost:3000');
    const link = `${frontendUrl}/verificar-email?token=${token}`;

    const htmlContent = `
      <div style="max-width:560px;margin:0 auto;font-family:Arial,sans-serif;background:#0a0a0f;color:#e0e0e0;padding:32px;border-radius:12px;border:1px solid #1f1f2a;">
        <h1 style="font-size:24px;color:#fff;margin:0 0 8px;">Kuroshi.lat</h1>
        <p style="color:#a0a0b0;margin:0 0 24px;">Hola <strong style="color:#fff;">${username}</strong>,</p>
        <p style="color:#a0a0b0;margin:0 0 24px;">Gracias por registrarte. Para verificar tu direcci&oacute;n de email, haz clic en el siguiente bot&oacute;n:</p>
        <a href="${link}" style="display:inline-block;padding:12px 32px;background:#e63946;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold;font-size:14px;">Verificar email</a>
        <p style="color:#a0a0b0;margin:24px 0 0;font-size:12px;">O copia y pega este enlace en tu navegador:</p>
        <p style="color:#6b6b80;font-size:12px;word-break:break-all;margin:4px 0 0;">${link}</p>
        <p style="color:#6b6b80;font-size:12px;margin:24px 0 0;border-top:1px solid #1f1f2a;padding-top:16px;">Este enlace expira en 24 horas. Si no creaste esta cuenta, ignora este email.</p>
      </div>
    `;

    await this.sendViaWorker(to, 'Verifica tu email en Kuroshi.lat', htmlContent);
  }

  async sendPasswordResetConfirmation(to: string, token: string, username: string) {
    const frontendUrl = this.config.get('FRONTEND_URL', 'http://localhost:3000');
    const link = `${frontendUrl}/reset-password?token=${token}`;

    const htmlContent = `
      <div style="max-width:560px;margin:0 auto;font-family:Arial,sans-serif;background:#0a0a0f;color:#e0e0e0;padding:32px;border-radius:12px;border:1px solid #1f1f2a;">
        <h1 style="font-size:24px;color:#fff;margin:0 0 8px;">Kuroshi.lat</h1>
        <p style="color:#a0a0b0;margin:0 0 24px;">Hola <strong style="color:#fff;">${username}</strong>,</p>
        <p style="color:#a0a0b0;margin:0 0 24px;">Recibimos una solicitud para cambiar la contrase&ntilde;a de tu cuenta. Si fuiste t&uacute;, haz clic en <strong>Aceptar</strong> para recibir una contrase&ntilde;a temporal.</p>
        <a href="${link}" style="display:inline-block;padding:12px 32px;background:#e63946;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold;font-size:14px;">Aceptar &mdash; quiero cambiar mi contrase&ntilde;a</a>
        <p style="color:#a0a0b0;margin:24px 0 0;font-size:12px;">Si no solicitaste este cambio, ignora este email.</p>
        <p style="color:#6b6b80;font-size:12px;margin:12px 0 0;border-top:1px solid #1f1f2a;padding-top:16px;">Este enlace expira en 30 minutos.</p>
      </div>
    `;

    await this.sendViaWorker(to, '¿Olvidaste tu contraseña? — Kuroshi.lat', htmlContent);
  }

  async sendTemporaryPassword(to: string, tempPassword: string, username: string) {
    const htmlContent = `
      <div style="max-width:560px;margin:0 auto;font-family:Arial,sans-serif;background:#0a0a0f;color:#e0e0e0;padding:32px;border-radius:12px;border:1px solid #1f1f2a;">
        <h1 style="font-size:24px;color:#fff;margin:0 0 8px;">Kuroshi.lat</h1>
        <p style="color:#a0a0b0;margin:0 0 24px;">Hola <strong style="color:#fff;">${username}</strong>,</p>
        <p style="color:#a0a0b0;margin:0 0 24px;">Aqu&iacute; tienes tu contrase&ntilde;a temporal:</p>
        <div style="background:#1a1a2a;border:1px solid #2a2a3a;border-radius:8px;padding:16px;text-align:center;margin:0 0 24px;">
          <span style="font-family:monospace;font-size:18px;color:#fff;letter-spacing:2px;">${tempPassword}</span>
        </div>
        <p style="color:#a0a0b0;margin:0 0 24px;">Usa esta contrase&ntilde;a para iniciar sesi&oacute;n. Una vez dentro, te recomendamos cambiarla desde tu panel de <strong>Configuraci&oacute;n &rarr; Cuenta</strong>.</p>
        <p style="color:#6b6b80;font-size:12px;margin:12px 0 0;border-top:1px solid #1f1f2a;padding-top:16px;">Si no solicitaste este cambio, contacta con soporte inmediatamente.</p>
      </div>
    `;

    await this.sendViaWorker(to, 'Tu contraseña temporal — Kuroshi.lat', htmlContent);
  }
}
