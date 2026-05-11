import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

/**
 * Thin wrapper around nodemailer.
 *
 * - If `SMTP_HOST` is configured in env, connect to that real SMTP server.
 * - Otherwise (typical dev), spin up a free Ethereal sandbox account on boot.
 *   Ethereal accepts the email and returns a preview URL — no real delivery,
 *   safe for demos. The preview URL is returned with each `sendMail` result so
 *   the caller can hand it back to the UI.
 *
 * Either path produces a `nodemailer.Transporter` and a `defaultFrom` address.
 */
@Injectable()
export class MailerService implements OnModuleInit {
  private readonly logger = new Logger(MailerService.name);
  private transporter!: nodemailer.Transporter;
  private defaultFrom!: string;
  private ethereal = false;

  constructor(private readonly config: ConfigService) {}

  async onModuleInit() {
    const host = this.config.get<string>('SMTP_HOST');
    if (host) {
      this.transporter = nodemailer.createTransport({
        host,
        port: parseInt(this.config.get<string>('SMTP_PORT') ?? '587', 10),
        secure: this.config.get<string>('SMTP_SECURE') === 'true',
        auth: {
          user: this.config.get<string>('SMTP_USER'),
          pass: this.config.get<string>('SMTP_PASS'),
        },
      });
      this.defaultFrom =
        this.config.get<string>('SMTP_FROM') ?? 'HMS <no-reply@hms.lb>';
      this.logger.log(`Using real SMTP host ${host}`);
      return;
    }

    // No real SMTP configured — fall back to Ethereal so dev still works.
    try {
      const test = await nodemailer.createTestAccount();
      this.transporter = nodemailer.createTransport({
        host: test.smtp.host,
        port: test.smtp.port,
        secure: test.smtp.secure,
        auth: { user: test.user, pass: test.pass },
      });
      this.defaultFrom = `HMS Reminders <${test.user}>`;
      this.ethereal = true;
      this.logger.log(
        `No SMTP_HOST set — using Ethereal sandbox (user=${test.user}). Sent emails are NOT delivered to real inboxes; preview URLs returned per-message.`,
      );
    } catch (err) {
      this.logger.warn(
        `Could not create Ethereal account (${(err as Error).message}). Reminder emails will be skipped until SMTP is configured.`,
      );
    }
  }

  /**
   * Send an email. Returns the underlying nodemailer info plus a `previewUrl`
   * (only when running on Ethereal — for real SMTP this is `null`).
   */
  async sendMail(opts: {
    to: string;
    subject: string;
    html: string;
    text?: string;
  }): Promise<{ messageId: string; previewUrl: string | null }> {
    if (!this.transporter) {
      throw new Error('Mailer not initialized — no SMTP configured.');
    }
    const info = await this.transporter.sendMail({
      from: this.defaultFrom,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
    });
    const previewUrl = this.ethereal
      ? (nodemailer.getTestMessageUrl(info) || null)
      : null;
    return { messageId: info.messageId, previewUrl };
  }

  isReady() {
    return Boolean(this.transporter);
  }
}
