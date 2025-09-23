import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER, // set in .env
        pass: process.env.EMAIL_PASS  // set in .env
    }
});

async function sendInvoiceEmail(to, subject, text, attachment) {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to,
        subject,
        text,
        attachments: attachment ? [attachment] : []
    };
    await transporter.sendMail(mailOptions);
}

export default sendInvoiceEmail;
