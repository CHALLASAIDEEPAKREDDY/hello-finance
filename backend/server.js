require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS - allow all origins
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Test route
app.get('/', (req, res) => {
  res.json({ status: 'Hello Finance API is running!' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.post('/api/contact', async (req, res) => {
  console.log('📨 Contact form received:', req.body);

  const { name, phone, email, message, datetime } = req.body;

  if (!name || !phone || !email || !message) {
    console.log('❌ Validation failed - missing fields');
    return res.status(400).json({ success: false, message: 'All fields required' });
  }

  const htmlEmail = `
  <div style="font-family:sans-serif;max-width:580px;margin:0 auto;">
    <div style="background:linear-gradient(135deg,#0a1f3c,#0f2a4f);padding:28px 32px;color:#fff;border-radius:12px 12px 0 0">
      <h2 style="margin:0;font-size:20px;">🏠 Hello Finance — New Loan Enquiry</h2>
    </div>
    <div style="padding:28px 32px;background:#fff;border:1px solid #e2e9f2;">
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:10px 0;color:#5d7186;font-size:12px;font-weight:700;text-transform:uppercase;width:130px;">Full Name</td><td style="padding:10px 0;font-weight:500;">${name}</td></tr>
        <tr><td style="padding:10px 0;color:#5d7186;font-size:12px;font-weight:700;text-transform:uppercase;">Phone</td><td style="padding:10px 0;font-weight:500;">${phone}</td></tr>
        <tr><td style="padding:10px 0;color:#5d7186;font-size:12px;font-weight:700;text-transform:uppercase;">Email</td><td style="padding:10px 0;font-weight:500;">${email}</td></tr>
        <tr><td style="padding:10px 0;color:#5d7186;font-size:12px;font-weight:700;text-transform:uppercase;">Date & Time</td><td style="padding:10px 0;font-weight:500;">${datetime || new Date().toLocaleString('en-IN', {timeZone:'Asia/Kolkata'})}</td></tr>
      </table>
      <div style="margin-top:16px;background:#f7f9fc;border-radius:8px;padding:14px 16px;">
        <p style="color:#5d7186;font-size:12px;font-weight:700;text-transform:uppercase;margin:0 0 6px;">Message</p>
        <p style="margin:0;color:#1a2a3a;">${message}</p>
      </div>
      <a href="mailto:${email}" style="display:inline-block;margin-top:18px;background:#f0b429;color:#0d1b2a;padding:10px 22px;border-radius:8px;font-weight:700;text-decoration:none;">Reply to ${name} →</a>
    </div>
    <div style="background:#f7f9fc;padding:14px 32px;font-size:12px;color:#5d7186;border-radius:0 0 12px 12px;border:1px solid #e2e9f2;border-top:none;">
      Hello Finance · support@hellofinance.in · +91 98737 37373
    </div>
  </div>`;

  try {
    await transporter.sendMail({
      from: `"Hello Finance Website" <${process.env.EMAIL_USER}>`,
      to: process.env.NOTIFY_EMAIL || 'ch.saideepakreddy@gmail.com',
      replyTo: email,
      subject: `New Loan Enquiry from ${name} — Hello Finance`,
      html: htmlEmail,
    });

    console.log(`✅ Email sent successfully to ${process.env.NOTIFY_EMAIL} from ${name}`);
    return res.status(200).json({ success: true, message: 'Email sent successfully!' });

  } catch (err) {
    console.error('❌ Email send error:', err.message);
    console.error('Full error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📧 Sending emails from: ${process.env.EMAIL_USER}`);
  console.log(`📬 Notifying: ${process.env.NOTIFY_EMAIL}`);
});
