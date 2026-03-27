import nodemailer from 'nodemailer';
import https from 'https';
import dns from 'dns';

// Fix Node.js 17+ resolving IPv6 first, which causes ENETUNREACH on Railway
dns.setDefaultResultOrder('ipv4first');

interface SendEmailOptions {
    to: string | string[];
    subject: string;
    html: string;
    fromName?: string;
}

export const createTransporter = () => {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.error('[EmailService] ERROR: EMAIL_USER or EMAIL_PASS environment variables are missing! Emails will not be sent.');
        return null; // Return null if not configured
    }
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: Number(process.env.SMTP_PORT || 465),
        secure: true, // Use Implicit SSL/TLS on port 465
        family: 4, // Force IPv4 to prevent ENETUNREACH errors on Railway
        connectionTimeout: 15000,
        greetingTimeout: 10000,
        socketTimeout: 20000,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    } as any);
};

const sendViaResend = async (payload: SendEmailOptions): Promise<void> => {
    if (!process.env.RESEND_API_KEY) {
        throw new Error('RESEND_API_KEY is not configured.');
    }

    const recipients = Array.isArray(payload.to) ? payload.to : [payload.to];
    const fromAddress = process.env.EMAIL_FROM || process.env.EMAIL_USER || 'onboarding@resend.dev';
    const fromName = payload.fromName || 'Insight App';

    const body = JSON.stringify({
        from: `${fromName} <${fromAddress}>`,
        to: recipients,
        subject: payload.subject,
        html: payload.html,
    });

    await new Promise<void>((resolve, reject) => {
        const request = https.request(
            {
                hostname: 'api.resend.com',
                path: '/emails',
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(body),
                },
                timeout: 15000,
            },
            (response) => {
                let responseBody = '';
                response.on('data', (chunk) => {
                    responseBody += chunk.toString();
                });
                response.on('end', () => {
                    if (response.statusCode && response.statusCode >= 200 && response.statusCode < 300) {
                        resolve();
                        return;
                    }
                    reject(new Error(`Resend API failed (${response.statusCode || 'unknown'}): ${responseBody}`));
                });
            }
        );

        request.on('timeout', () => {
            request.destroy(new Error('Resend API timeout'));
        });

        request.on('error', (error) => reject(error));
        request.write(body);
        request.end();
    });
};

export const sendEmailWithFallback = async (payload: SendEmailOptions): Promise<void> => {
    
    // First, try standard SMTP through Nodemailer
    const recipients = Array.isArray(payload.to) ? payload.to.join(',') : payload.to;
    const smtpTransporter = createTransporter();

    if (smtpTransporter) {
        try {
            const fromAddress = process.env.EMAIL_USER;
            const fromName = payload.fromName || 'Insight App';
            await smtpTransporter.sendMail({
                from: `${fromName} <${fromAddress}>`,
                to: recipients,
                subject: payload.subject,
                html: payload.html,
            });
            console.log('[EmailService] Email sent successfully via SMTP.');
            return;
        } catch (smtpError: any) {
            console.error('[EmailService] SMTP send failed:', smtpError?.message || smtpError);
        }
    }

    // Optional Fallback to Resend (only if configured and SMTP fails)
    if (process.env.RESEND_API_KEY) {
        try {
            console.log('[EmailService] Trying HTTPS fallback via Resend...');
            await sendViaResend(payload);
            console.log('[EmailService] Email sent successfully via Resend.');
            return;
        } catch (resendError: any) {
            console.error('[EmailService] Resend fallback also failed:', resendError?.message || resendError);
            throw resendError;
        }
    }

    throw new Error('All email delivery methods failed.');
};

const wrapHtml = (title: string, content: string) => `
<div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 500px; margin: auto; padding: 32px; background: #F8F9FF; border-radius: 12px; border: 1px solid #E5E7F5;">
    <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #0E1F43; font-size: 24px; margin: 0;">Insight</h1>
        <p style="color: #666; font-size: 14px; margin-top: 4px;">CCS Academic Research Repository</p>
    </div>
    <h2 style="color: #0E1F43; font-size: 18px; text-align: center; border-bottom: 2px solid #CDDDFF; padding-bottom: 12px; margin-bottom: 20px;">${title}</h2>
    <div style="color: #444; font-size: 15px; line-height: 1.6;">
        ${content}
    </div>
    <hr style="border: none; border-top: 1px solid #E5E7F5; margin: 30px 0 20px 0;" />
    <p style="color: #aaa; font-size: 12px; text-align: center; margin: 0;">
        This is an automated notification from the Insight platform. Please do not reply directly to this email.
    </p>
</div>
`;

export const sendApprovalEmail = async (to: string, title: string, status: 'approved' | 'rejected') => {
    try {
        const transporter = createTransporter();
        if (!transporter) return;

        const subject = status === 'approved' 
            ? 'Your study has been approved on Insight!'
            : 'Update on your study submission';
        
        let content = '';
        if (status === 'approved') {
            content = `<p>Congratulations!</p><p>Your study <b>"${title}"</b> has been successfully approved by the administration and is now live on Insight.</p><p>Thank you for contributing to our research community!</p>`;
        } else {
            content = `<p>Submission Update</p><p>Unfortunately, your study <b>"${title}"</b> has been rejected.</p><p>Please review our submission guidelines or contact your administrator for more details.</p>`;
        }

        const html = wrapHtml(subject, content);

        await transporter.sendMail({
            from: `"Insight App" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html,
        });
        console.log(`[EmailService] Sent ${status} email to ${to}`);
    } catch (e) {
        console.error('[EmailService] error sending email: ', e);
    }
};

export const sendResearchUpdateEmail = async (to: string, studiesCount: number) => {
    try {
        const transporter = createTransporter();
        if (!transporter) return;

        const subject = 'New Research is available on Insight!';
        const content = `<p>We thought you'd like to know that there are <b>${studiesCount} new studies</b> this week.</p><p>Log into Insight to check out the latest research.</p>`;
        const html = wrapHtml('Insight Weekly Update', content);

        await transporter.sendMail({
            from: `"Insight App" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html,
        });
        console.log(`[EmailService] Sent weekly update email to ${to}`);
    } catch (e) {
        console.error('[EmailService] error sending weekly update: ', e);
    }
};

export const sendAdminNewRegistrationEmail = async (adminEmails: string[], userEmail: string, role: string) => {
    try {
        if (!adminEmails || adminEmails.length === 0) return;
        const transporter = createTransporter();
        if (!transporter) return;

        const subject = 'New User Registration Pending Verification';
        const content = `<p>A new user has just registered an account and their documents are awaiting your verification.</p>
                         <div style="background: #fff; padding: 16px; border: 1px dashed #CDDDFF; border-radius: 8px; margin: 16px 0;">
                            <b>User Email:</b> ${userEmail}<br/>
                            <b>Requested Role:</b> ${role}
                         </div>
                         <p>Please log in to the Insight Admin Dashboard to review and approve their request.</p>`;
        const html = wrapHtml('Admin Alert: Pending Registration', content);
        
        await transporter.sendMail({
            from: `"Insight App" <${process.env.EMAIL_USER}>`,
            to: adminEmails.join(','),
            subject,
            html,
        });
        console.log(`[EmailService] Sent admin registration alert to ${adminEmails.length} admins.`);
    } catch (e) {
        console.error('[EmailService] error sending admin alert: ', e);
    }
};

export const sendAdminNewLiteratureEmail = async (adminEmails: string[], uploaderEmail: string, studyTitle: string) => {
    try {
        if (!adminEmails || adminEmails.length === 0) return;
        const transporter = createTransporter();
        if (!transporter) return;

        const subject = 'New Literature Uploaded for Review';
        const content = `<p>A new research document has just been uploaded and is awaiting your review.</p>
                         <div style="background: #fff; padding: 16px; border: 1px dashed #CDDDFF; border-radius: 8px; margin: 16px 0;">
                            <b>Study Title:</b> "${studyTitle}"<br/>
                            <b>Uploaded By:</b> ${uploaderEmail}
                         </div>
                         <p>Please log in to the Insight Admin Dashboard to review and approve this submission.</p>`;
        const html = wrapHtml('Admin Alert: Pending Literature', content);
        
        await transporter.sendMail({
            from: `"Insight App" <${process.env.EMAIL_USER}>`,
            to: adminEmails.join(','),
            subject,
            html,
        });
        console.log(`[EmailService] Sent admin literature alert to ${adminEmails.length} admins.`);
    } catch (e) {
        console.error('[EmailService] error sending admin literature alert: ', e);
    }
};