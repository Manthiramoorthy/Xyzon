const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

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
        subject,
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

const sendPersonalizedBulkService = async (template, recipients, attachments) => {
    let sent = 0;
    for (const recipient of recipients) {
        let html = template;
        for (const key in recipient) {
            html = html.replace(new RegExp(`{${key}}`, 'g'), recipient[key]);
        }
        await sendMailService({
            to: recipient.email,
            subject: 'Personalized Mail',
            content: html,
            attachments
        });
        sent++;
    }
    return sent;
};

module.exports = { sendMailService, sendPersonalizedBulkService };
