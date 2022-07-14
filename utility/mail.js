const env = require('dotenv');
env.config({ path: './config.env' });

const nodemailer = require('nodemailer');

const mail = async (options) => {
  // 1 transporter qurishimiz kerak
  const transport = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
  // 2 mailni nastroyka qilamiz
  const mailOptions = {
    from: options.from,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
  };
  // 3 mailni jo'natish

  await transport.sendMail(mailOptions);
  console.log('kettdi');
};

// mail({
//   from: 'mironshohasadov2003@gmail.com',
//   to: 'magicsoft.uz@gmail.com',
//   subject: 'Salomlar ',
//   text: 'Umid akaaaa...',
// });

module.exports = mail;
