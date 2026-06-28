import nodemailer from 'nodemailer';

const sendEmail = async ({ to, subject, html }) => {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  // Fallback to console simulation if configurations are missing
  if (!emailUser || !emailPass) {
    console.log('\n======================================');
    console.log(`[EMAIL SEND SIMULATION] (Missing EMAIL_USER/EMAIL_PASS in .env)`);
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Content:`);
    // Simple tag stripping for clean console logging
    console.log(html.replace(/<\/?[^>]+(>|$)/g, ""));
    console.log('======================================\n');
    return;
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: emailUser,
      pass: emailPass,
    },
  });

  const mailOptions = {
    from: `"Lumina Atelier" <${emailUser}>`,
    to,
    subject,
    html,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`[EMAIL SENT SUCCESS] to ${to}`);
  } catch (error) {
    console.error(`[EMAIL SEND ERROR] failed to send email to ${to}:`, error.message);
    throw new Error('Failed to send email. Please check server Gmail App Password settings.');
  }
};

export default sendEmail;
