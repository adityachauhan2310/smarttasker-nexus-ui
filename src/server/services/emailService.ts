import nodemailer from 'nodemailer';
import config from '../config/config';
import fs from 'fs';
import path from 'path';
import handlebars from 'handlebars';

// Email queue for retrying failed emails
interface QueuedEmail {
  id: string;
  to: string;
  subject: string;
  html: string;
  text?: string;
  attempts: number;
  lastAttempt: Date;
  createdAt: Date;
}

// In-memory queue for simplicity. In production, use a persistent queue like Redis or a database
const emailQueue: QueuedEmail[] = [];
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 5 * 60 * 1000; // 5 minutes

// Initialize email transport
let transporter: nodemailer.Transporter;

/**
 * Initialize the email service
 */
export const initEmailService = (): void => {
  // Use different configurations based on environment
  if (config.env === 'production') {
    // Configure production email service (e.g., AWS SES, SendGrid, etc.)
    transporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.secure,
      auth: {
        user: config.email.auth.user,
        pass: config.email.auth.pass,
      },
    });
  } else {
    // For development/testing, use Ethereal (fake SMTP service)
    // Or configure to a real service with test credentials
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: config.email.auth.user || 'ethereal_user',
        pass: config.email.auth.pass || 'ethereal_pass',
      },
    });

    // Log email instead of sending in development
    if (config.env === 'development') {
      console.log('Email service initialized in development mode (emails will be logged)');
    }
  }

  // Start retry process for failed emails
  startEmailRetryProcess();
};

interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html: string;
  attachments?: any[];
  cc?: string | string[];
  bcc?: string | string[];
  from?: string;
}

/**
 * Send an email
 * @param options Email options
 * @returns Promise that resolves when email is sent or queued for retry
 */
export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  try {
    const { to, subject, text, html, attachments, cc, bcc } = options;

    // Use default from address if not specified
    const from = options.from || config.email.fromAddress;

    // Skip sending emails if disabled
    if (config.email.disabled) {
      console.log('Email sending is disabled. Would have sent:');
      console.log({ to, subject, text: text || html.substring(0, 100) + '...' });
      return true;
    }

    // In development, log email instead of sending (unless forced)
    if (config.env === 'development' && !config.email.sendInDevelopment) {
      console.log('------- EMAIL -------');
      console.log('To:', to);
      console.log('Subject:', subject);
      console.log('Content:', text || html.substring(0, 100) + '...');
      console.log('--------------------');
      return true;
    }

    // Send the email
    await transporter.sendMail({
      from,
      to,
      cc,
      bcc,
      subject,
      text,
      html,
      attachments,
    });

    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    
    // Queue for retry if it's a transient error
    if (isTransientError(error)) {
      queueEmailForRetry({
        id: generateUniqueId(),
        to: Array.isArray(options.to) ? options.to.join(',') : options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        attempts: 0,
        lastAttempt: new Date(),
        createdAt: new Date(),
      });
      return true; // Return true since it's queued for retry
    }
    
    return false;
  }
};

/**
 * Load an email template and compile it with data
 * @param templateName Name of the template file (without extension)
 * @param data Data to inject into template
 * @returns Compiled HTML string
 */
export const renderEmailTemplate = async (templateName: string, data: any): Promise<string> => {
  try {
    // Path to email templates
    const templatePath = path.join(__dirname, '../templates/email', `${templateName}.html`);
    
    // Read the template file
    const templateSource = await fs.promises.readFile(templatePath, 'utf8');
    
    // Compile the template
    const template = handlebars.compile(templateSource);
    
    // Render with data
    return template(data);
  } catch (error) {
    console.error(`Error rendering email template ${templateName}:`, error);
    
    // Fallback to simple template
    return `
      <html>
        <body>
          <h1>${data.title || 'Notification'}</h1>
          <p>${data.message || 'You have a new notification.'}</p>
        </body>
      </html>
    `;
  }
};

/**
 * Add email to retry queue
 */
function queueEmailForRetry(email: QueuedEmail): void {
  emailQueue.push(email);
  console.log(`Email to ${email.to} queued for retry. Queue size: ${emailQueue.length}`);
}

/**
 * Start the process to retry failed emails
 */
function startEmailRetryProcess(): void {
  // Process the queue every minute
  setInterval(() => {
    processEmailQueue().catch(err => {
      console.error('Error processing email queue:', err);
    });
  }, 60 * 1000);
}

/**
 * Process the email retry queue
 */
async function processEmailQueue(): Promise<void> {
  if (emailQueue.length === 0) {
    return;
  }

  console.log(`Processing email retry queue. ${emailQueue.length} emails in queue`);
  
  const now = new Date();
  const emailsToProcess = [...emailQueue];
  
  // Clear the queue
  emailQueue.length = 0;
  
  for (const email of emailsToProcess) {
    // Skip if not enough time has passed since last attempt
    const timeSinceLastAttempt = now.getTime() - email.lastAttempt.getTime();
    if (timeSinceLastAttempt < RETRY_DELAY_MS) {
      emailQueue.push(email); // Put back in queue
      continue;
    }
    
    // Skip if max attempts reached
    if (email.attempts >= MAX_RETRY_ATTEMPTS) {
      console.log(`Email to ${email.to} failed after ${email.attempts} attempts. Giving up.`);
      continue;
    }
    
    try {
      // Attempt to send the email
      await transporter.sendMail({
        from: config.email.fromAddress,
        to: email.to,
        subject: email.subject,
        text: email.text,
        html: email.html,
      });
      
      console.log(`Successfully sent queued email to ${email.to} on attempt ${email.attempts + 1}`);
    } catch (error) {
      console.error(`Failed to send queued email to ${email.to} (attempt ${email.attempts + 1}):`, error);
      
      // Update retry count and last attempt time
      email.attempts += 1;
      email.lastAttempt = new Date();
      
      // Put back in queue if under max attempts
      if (email.attempts < MAX_RETRY_ATTEMPTS) {
        emailQueue.push(email);
      }
    }
  }
}

/**
 * Check if an error is likely transient (temporary) and should be retried
 */
function isTransientError(error: any): boolean {
  // Common transient error codes
  const transientErrorCodes = [
    'ECONNRESET', 'ECONNREFUSED', 'ETIMEDOUT', 'ESOCKET', 
    'EENVELOPE', 'EAUTH', 'EMESSAGE'
  ];
  
  if (error.code && transientErrorCodes.includes(error.code)) {
    return true;
  }
  
  // Check for rate limiting or temporary server errors
  if (error.responseCode && (error.responseCode >= 400 && error.responseCode < 500)) {
    return true;
  }
  
  return false;
}

/**
 * Generate a unique ID for queued emails
 */
function generateUniqueId(): string {
  return `email_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export default {
  initEmailService,
  sendEmail,
  renderEmailTemplate,
}; 