const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// Branding configuration: use COMPANY_* as primary, BRAND_* as secondary for backward compatibility
const BRAND = {
    name: process.env.COMPANY_NAME || 'Xyzon Innovations Private Limited',
    website: process.env.FRONTEND_URL || '#',
    // Prefer explicitly set BRAND_LOGO_URL, fallback to COMPANY_LOGO_URL if you introduce it later
    logo: process.env.BRAND_LOGO_URL || process.env.COMPANY_LOGO_URL || '',
    tagline: process.env.BRAND_TAGLINE || 'Innovating Events & Experiences',
    supportEmail: process.env.SUPPORT_EMAIL || process.env.MAIL_USER,
    socials: {
        linkedin: process.env.BRAND_LINKEDIN || '',
        instagram: process.env.BRAND_INSTAGRAM || '',
        twitter: process.env.BRAND_TWITTER || '',
        youtube: process.env.BRAND_YOUTUBE || ''
    }
};

// Build social links row
const buildSocialLinks = () => {
    const items = Object.entries(BRAND.socials)
        .filter(([_, url]) => !!url)
        .map(([key, url]) => {
            const label = key.charAt(0).toUpperCase() + key.slice(1);
            return `<a href="${url}" style="margin:0 6px; color:#555555; text-decoration:none; font-size:12px;" target="_blank" rel="noopener">${label}</a>`;
        }).join('');
    if (!items) return '';
    return `<div style="margin-top:10px;">${items}</div>`;
};

// Wrap inner HTML with consistent branded template
const wrapEmail = (inner, { preheader } = {}) => {
    const pre = preheader ? `<span style="display:none !important; visibility:hidden; opacity:0; color:transparent; height:0; width:0; overflow:hidden;">${preheader}</span>` : '';
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charSet="UTF-8" />
            <meta name="viewport" content="width=device-width,initial-scale=1" />
            <title>${BRAND.name} Notification</title>
        </head>
        <body style="margin:0; padding:0; background-color:#f2f4f6; font-family:Arial,Helvetica,sans-serif;">
            ${pre}
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#f2f4f6; padding:30px 0;">
                <tr>
                    <td align="center">
                        <table role="presentation" width="600" style="max-width:600px; width:100%; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 2px 6px rgba(0,0,0,0.06);">
                            <tr>
                                <td style="background:linear-gradient(135deg,#001f6b,#003d99); padding:24px 30px; text-align:center; color:#ffffff;">
                                    ${BRAND.logo ? `<img src="${BRAND.logo}" alt="${BRAND.name}" style="max-width:160px; height:auto; display:block; margin:0 auto 10px;" />` : `<h1 style="margin:0; font-size:24px; font-weight:600; letter-spacing:.5px;">${BRAND.name}</h1>`}
                                    <div style="font-size:13px; opacity:.85; margin-top:4px;">${BRAND.tagline}</div>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding:30px;">
                                    ${inner}
                                </td>
                            </tr>
                            <tr>
                                <td style="background:#fafbfc; padding:22px 30px; text-align:center; font-size:12px; color:#666666; border-top:1px solid #eceff3;">
                                    <div style="margin-bottom:8px;">
                                        <a href="${BRAND.website}" style="color:#0044cc; text-decoration:none; font-weight:600;">${BRAND.website.replace(/^https?:\/\//, '')}</a>
                                    </div>
                                    <div style="line-height:1.5;">Need help? <a href="mailto:${BRAND.supportEmail}" style="color:#0044cc; text-decoration:none;">${BRAND.supportEmail}</a></div>
                                    ${buildSocialLinks()}
                                    <div style="margin-top:14px; color:#999999;">© ${new Date().getFullYear()} ${BRAND.name}. All rights reserved.</div>
                                    <div style="margin-top:6px; color:#bbbbbb;">This is an automated message, please do not reply.</div>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>`;
};

const sendMailService = async ({ to, cc, bcc, subject, content, attachments }) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.MAIL_USER,
            pass: process.env.MAIL_PASS
        }
    });
    console.log('Transporter created successfully');
    console.log('Sending mail with options:', {
        from: process.env.MAIL_USER,
        to: to || undefined,
        cc: cc || undefined,
        bcc: bcc || undefined,
        subject: subject,
        html: content,
        attachments: Array.isArray(attachments) ? attachments.map(att => ({
            filename: att.filename,
        })) : undefined
    }
    )
    const mailOptions = {
        from: process.env.MAIL_USER,
        to: to || undefined,
        cc: cc || undefined,
        bcc: bcc || undefined,
        subject,
        html: content,
        attachments: Array.isArray(attachments) ? attachments.map(att => {
            if (att.content) {
                console.log(att.encoding)

                console.log('Attachment filename:', att.filename);
                console.log('Attachment contentType:', att.contentType);
                return {
                    filename: att.filename,
                    content: Buffer.from(att.content, 'base64'),
                    contentType: att.contentType || undefined
                };
            } else if (att.path) {
                return {
                    filename: att.filename,
                    path: att.path
                };
            }
            return null;
        }).filter(Boolean) : undefined
    };
    await transporter.sendMail(mailOptions);
    return 'Email sent successfully';
};

const sendPersonalizedBulkService = async (subject, template, recipients, attachments) => {
    let sent = 0;
    for (const recipient of recipients) {
        let html = template;
        for (const key in recipient) {
            html = html.replace(new RegExp(`{${key}}`, 'g'), recipient[key]);
        }
        await sendMailService({
            to: recipient.email,
            subject: subject,
            content: html,
            attachments
        });
        sent++;
    }
    return sent;
};

// Event Registration Confirmation Email
const sendEventRegistrationConfirmation = async (registration, event, paymentDetails = null) => {
    const subject = `Registration Confirmed: ${event.title}`;

    let paymentSection = '';
    if (event.eventType === 'paid' && paymentDetails) {
        paymentSection = `
            <div style="background-color: #e8f5e8; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h3 style="color: #2e7d32; margin: 0 0 10px 0;">Payment Confirmed</h3>
                <p style="margin: 5px 0;"><strong>Amount Paid:</strong> ₹${paymentDetails.amount}</p>
                <p style="margin: 5px 0;"><strong>Payment ID:</strong> ${paymentDetails.razorpayPaymentId}</p>
                <p style="margin: 5px 0;"><strong>Payment Date:</strong> ${new Date(paymentDetails.paidAt).toLocaleDateString()}</p>
            </div>
        `;
    } else if (event.eventType === 'free') {
        paymentSection = `
            <div style="background-color: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h3 style="color: #1976d2; margin: 0 0 10px 0;">Free Event</h3>
                <p style="margin: 5px 0;">No payment required for this event.</p>
            </div>
        `;
    }

    const inner = `
        <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #333333; margin-bottom: 10px;">Registration Confirmed!</h1>
            <p style="color: #666666; font-size: 16px;">Thank you for registering for our event</p>
        </div>
        <div style="background-color:#f8f9fa; padding:20px; border-radius:8px; margin-bottom:20px;">
            <h2 style="color:#333333; margin-top:0;">${event.title}</h2>
            <p style="color:#666666; margin-bottom:15px;">${event.description}</p>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
                <div><strong>Date:</strong><br>${new Date(event.startDate).toLocaleDateString()} - ${new Date(event.endDate).toLocaleDateString()}</div>
                <div><strong>Time:</strong><br>${new Date(event.startDate).toLocaleTimeString()} - ${new Date(event.endDate).toLocaleTimeString()}</div>
            </div>
            ${event.eventMode === 'online' ? `<div style="margin-top:15px;"><strong>Event Link:</strong><br><a href="${event.eventLink}" style="color:#007bff;">${event.eventLink}</a></div>` : `<div style="margin-top:15px;"><strong>Venue:</strong><br>${event.venue}<br>${event.address}</div>`}
        </div>
        ${paymentSection}
        <div style="background-color:#fff3e0; padding:15px; border-radius:5px; margin:20px 0;">
            <h3 style="color:#ef6c00; margin:0 0 10px 0;">Registration Details</h3>
            <p style="margin:5px 0;"><strong>Registration ID:</strong> ${registration.registrationId}</p>
            <p style="margin:5px 0;"><strong>Name:</strong> ${registration.name}</p>
            <p style="margin:5px 0;"><strong>Email:</strong> ${registration.email}</p>
            ${registration.phone ? `<p style=\"margin:5px 0;\"><strong>Phone:</strong> ${registration.phone}</p>` : ''}
        </div>
        <div style="text-align:center; margin:30px 0;">
            <p style="color:#666666;">We'll send you a reminder email closer to the event date.</p>
            <p style="color:#666666;">If you have any questions, please contact our support team.</p>
        </div>
    `;
    const content = wrapEmail(inner, { preheader: `Registration confirmed for ${event.title}` });

    return await sendMailService({
        to: registration.email,
        subject,
        content
    });
};

// Event Reminder Email
const sendEventReminder = async (registration, event) => {
    const subject = `Reminder: ${event.title} - Starting Soon!`;

    const inner = `
        <div style="text-align:center; margin-bottom:30px;">
            <h1 style="color:#ff9800; margin-bottom:10px;">Event Reminder</h1>
            <p style="color:#666666; font-size:16px;">Don't forget about your upcoming event!</p>
        </div>
        <div style="background-color:#fff3e0; padding:20px; border-radius:8px; margin-bottom:20px; border-left:4px solid #ff9800;">
            <h2 style="color:#333333; margin-top:0;">${event.title}</h2>
            <p style="color:#666666; margin-bottom:15px;">${event.shortDescription || event.description}</p>
            <div style="background-color:#ffffff; padding:15px; border-radius:5px; margin:15px 0;">
                <h3 style="color:#ff9800; margin-top:0;">Event Details</h3>
                <p><strong>Date:</strong> ${new Date(event.startDate).toLocaleDateString()}</p>
                <p><strong>Time:</strong> ${new Date(event.startDate).toLocaleTimeString()}</p>
                ${event.eventMode === 'online' ? `<p><strong>Join Link:</strong> <a href="${event.eventLink}" style="color:#007bff;">${event.eventLink}</a></p>` : `<p><strong>Venue:</strong> ${event.venue}</p><p><strong>Address:</strong> ${event.address}</p>`}
            </div>
            <div style="background-color:#e8f5e8; padding:15px; border-radius:5px;">
                <p style="margin:0;"><strong>Your Registration ID:</strong> ${registration.registrationId}</p>
            </div>
        </div>
        <div style="text-align:center; margin:30px 0;">
            <a href="${process.env.FRONTEND_URL}/events/${event._id}" style="display:inline-block; padding:12px 30px; background-color:#ff9800; color:#ffffff; text-decoration:none; border-radius:5px; font-weight:bold;">View Event Details</a>
        </div>
    `;
    const content = wrapEmail(inner, { preheader: `Reminder: ${event.title} starting soon` });

    return await sendMailService({
        to: registration.email,
        subject,
        content
    });
};

// Certificate Email
const sendCertificateEmail = async (certificate, registration, event) => {
    const subject = `Your Certificate - ${event.title}`;

    const inner = `
        <div style="text-align:center; margin-bottom:30px;">
            <h1 style="color:#4caf50; margin-bottom:10px;">Congratulations!</h1>
            <p style="color:#666666; font-size:16px;">Your certificate is ready</p>
        </div>
        <div style="background-color:#e8f5e8; padding:20px; border-radius:8px; margin-bottom:20px; border-left:4px solid #4caf50;">
            <h2 style="color:#333333; margin-top:0;">Certificate Issued</h2>
            <p style="color:#666666; margin-bottom:15px;">Thank you for attending <strong>${event.title}</strong>. Your certificate of participation has been generated.</p>
            <div style="background-color:#ffffff; padding:15px; border-radius:5px; margin:15px 0;">
                <h3 style="color:#4caf50; margin-top:0;">Certificate Details</h3>
                <p><strong>Certificate ID:</strong> ${certificate.certificateId}</p>
                <p><strong>Recipient:</strong> ${certificate.recipientName}</p>
                <p><strong>Issue Date:</strong> ${new Date(certificate.issueDate).toLocaleDateString()}</p>
                <p><strong>Verification Code:</strong> ${certificate.verificationCode}</p>
            </div>
        </div>
        <div style="text-align:center; margin:30px 0;">
            <a href="${process.env.FRONTEND_URL}/certificates/${certificate.certificateId}" style="display:inline-block; padding:12px 30px; background-color:#4caf50; color:#ffffff; text-decoration:none; border-radius:5px; font-weight:bold; margin:5px;">Download Certificate</a>
            <a href="${process.env.FRONTEND_URL}/certificates/verify/${certificate.verificationCode}" style="display:inline-block; padding:12px 30px; background-color:#2196f3; color:#ffffff; text-decoration:none; border-radius:5px; font-weight:bold; margin:5px;">Verify Certificate</a>
        </div>
        <div style="background-color:#f8f9fa; padding:15px; border-radius:5px; text-align:center;">
            <p style="margin:0; color:#666666;">You can verify the authenticity of this certificate using the verification code above.</p>
        </div>
    `;
    const content = wrapEmail(inner, { preheader: `Your certificate for ${event.title}` });

    return await sendMailService({
        to: certificate.recipientEmail,
        subject,
        content
    });
};

// Send enquiry notification to admin
const sendEnquiryNotification = async (enquiry) => {
    const subject = `New Enquiry Received - ${enquiry.subject}`;

    const inner = `
        <h2 style="color:#333; text-align:center; border-bottom:2px solid #007bff; padding-bottom:10px;">New Enquiry Received</h2>
        <div style="background-color:#f8f9fa; padding:15px; border-radius:5px; margin:20px 0;">
            <h3 style="color:#495057; margin-top:0;">Customer Information</h3>
            <p><strong>Name:</strong> ${enquiry.name}</p>
            <p><strong>Email:</strong> ${enquiry.email}</p>
            ${enquiry.phone ? `<p><strong>Phone:</strong> ${enquiry.phone}</p>` : ''}
            <p><strong>Category:</strong> ${enquiry.category}</p>
            <p><strong>Submitted:</strong> ${new Date(enquiry.createdAt).toLocaleString()}</p>
        </div>
        <div style="background-color:#fff3cd; padding:15px; border-radius:5px; margin:20px 0;">
            <h3 style="color:#856404; margin-top:0;">Enquiry Details</h3>
            <p><strong>Subject:</strong> ${enquiry.subject}</p>
            <div style="background-color:white; padding:10px; border-left:4px solid #007bff; margin-top:10px;">
                <strong>Message:</strong><br>${enquiry.message.replace(/\n/g, '<br>')}
            </div>
        </div>
        <div style="text-align:center; margin-top:30px;">
            <p style="color:#6c757d; font-size:14px;">Please log in to the admin panel to respond to this enquiry.</p>
        </div>
    `;
    const content = wrapEmail(inner, { preheader: `New enquiry: ${enquiry.subject}` });

    // Send to all admin users
    const adminEmail = process.env.ADMIN_EMAIL || process.env.MAIL_USER;

    return await sendMailService({
        to: adminEmail,
        subject,
        content
    });
};

// Send enquiry response to customer
const sendEnquiryResponse = async ({ customerEmail, customerName, subject, message, originalEnquiry }) => {
    const responseSubject = `Re: ${originalEnquiry.subject}`;

    const inner = `
        <h2 style="color:#007bff; text-align:center; border-bottom:2px solid #007bff; padding-bottom:10px;">Response to Your Enquiry</h2>
        <div style="margin:20px 0;">
            <p>Dear <strong>${customerName}</strong>,</p>
            <p>Thank you for contacting us. Here is our response to your enquiry:</p>
        </div>
        <div style="background-color:#f8f9fa; padding:15px; border-radius:5px; margin:20px 0;">
            <h3 style="color:#495057; margin-top:0;">${subject}</h3>
            <div style="line-height:1.6;">${message.replace(/\n/g, '<br>')}</div>
        </div>
        <div style="background-color:#e9ecef; padding:15px; border-radius:5px; margin:20px 0;">
            <h4 style="color:#6c757d; margin-top:0;">Your Original Enquiry:</h4>
            <p><strong>Subject:</strong> ${originalEnquiry.subject}</p>
            <p><strong>Date:</strong> ${new Date(originalEnquiry.createdAt).toLocaleDateString()}</p>
            <div style="background-color:white; padding:10px; border-left:4px solid #6c757d; margin-top:10px;">${originalEnquiry.message.replace(/\n/g, '<br>')}</div>
        </div>
        <div style="margin:30px 0; padding:15px; background-color:#d1ecf1; border-radius:5px;">
            <p style="margin:0; color:#0c5460;"><strong>Need further assistance?</strong><br>Feel free to reply to this email or contact us again through our website.</p>
        </div>
        <div style="text-align:center; margin-top:30px; padding-top:10px;">
            <p style="color:#6c757d; font-size:13px; margin:0;">Best regards,<br><strong>${BRAND.name} Team</strong></p>
        </div>
    `;
    const content = wrapEmail(inner, { preheader: `Re: ${originalEnquiry.subject}` });

    return await sendMailService({
        to: customerEmail,
        subject: responseSubject,
        content
    });
};

module.exports = {
    sendMailService,
    sendPersonalizedBulkService,
    sendEventRegistrationConfirmation,
    sendEventReminder,
    sendCertificateEmail,
    sendEnquiryNotification,
    sendEnquiryResponse
};
