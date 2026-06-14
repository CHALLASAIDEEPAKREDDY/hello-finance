require('dotenv').config();
const express    = require('express');
const nodemailer = require('nodemailer');
const path       = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

app.post('/api/contact', async (req, res) => {
  const { name, phone, email, message, datetime } = req.body;

  const errors = [];
  if (!name   || name.trim().length < 2)                          errors.push('name');
  if (!phone  || !/^[+]?[0-9\s\-]{10,14}$/.test(phone.trim()))  errors.push('phone');
  if (!email  || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errors.push('email');
  if (!message || message.trim().length < 10)                     errors.push('message');

  if (errors.length) {
    return res.status(400).json({ success: false, errors });
  }

  const htmlEmail = `
  <div style="font-family:sans-serif;max-width:580px;margin:0 auto;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.1)">
    <div style="background:linear-gradient(135deg,#0a1f3c,#0f2a4f);padding:28px 32px;color:#fff">
      <p style="color:#f0b429;font-size:12px;font-weight:700;letter-spacing:2px;margin:0 0 8px">NEW ENQUIRY</p>
      <h2 style="margin:0;font-size:20px">Hello Finance — Loan Enquiry</h2>
    </div>
    <div style="padding:28px 32px;background:#fff">
      <table style="width:100%;border-collapse:collapse">
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #eef3f9;color:#5d7186;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;width:140px">Full Name</td>
          <td style="padding:10px 0;border-bottom:1px solid #eef3f9;font-weight:500;color:#1a2a3a">${escapeHtml(name)}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #eef3f9;color:#5d7186;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase">Phone</td>
          <td style="padding:10px 0;border-bottom:1px solid #eef3f9;font-weight:500;color:#1a2a3a">${escapeHtml(phone)}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #eef3f9;color:#5d7186;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase">Email</td>
          <td style="padding:10px 0;border-bottom:1px solid #eef3f9;font-weight:500;color:#1a2a3a">${escapeHtml(email)}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #eef3f9;color:#5d7186;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase">Date &amp; Time</td>
          <td style="padding:10px 0;border-bottom:1px solid #eef3f9;font-weight:500;color:#1a2a3a">${escapeHtml(datetime || new Date().toLocaleString('en-IN',{timeZone:'Asia/Kolkata'}))}</td>
        </tr>
      </table>
      <div style="margin-top:20px;background:#f7f9fc;border-radius:10px;padding:16px 18px">
        <p style="color:#5d7186;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin:0 0 8px">Message</p>
        <p style="color:#1a2a3a;font-size:15px;line-height:1.7;margin:0">${escapeHtml(message).replace(/\n/g,'<br>')}</p>
      </div>
      <a href="mailto:${escapeHtml(email)}" style="display:inline-block;margin-top:20px;background:#f0b429;color:#0d1b2a;padding:10px 22px;border-radius:8px;font-weight:700;font-size:14px;text-decoration:none">Reply to ${escapeHtml(name)} →</a>
    </div>
    <div style="background:#f7f9fc;padding:16px 32px;font-size:12px;color:#5d7186;border-top:1px solid #e2e9f2">
      Hello Finance · support@hellofinance.in · +91 98737 37373
    </div>
  </div>`;

  try {
    await transporter.sendMail({
      from:    `"Hello Finance Website" <${process.env.EMAIL_USER}>`,
      to:      process.env.NOTIFY_EMAIL || 'ch.saideepakreddy@gmail.com',
      replyTo: email,
      subject: `New Loan Enquiry from ${name} — Hello Finance`,
      html:    htmlEmail,
    });

    console.log(`✅ Enquiry sent — ${name} <${email}>`);
    return res.status(200).json({ success: true, message: 'Enquiry sent successfully!' });

  } catch (err) {
    console.error('❌ Email error:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to send email.' });
  }
});

function escapeHtml(str) {
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
