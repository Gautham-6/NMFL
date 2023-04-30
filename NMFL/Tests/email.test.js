const nodemailer = require('nodemailer');
const { sendMail } = require('../public/scripts/EmailSender');

jest.mock('nodemailer');

describe('sendMail function', () => {
  beforeEach(() => {
    nodemailer.createTransport.mockClear();
    nodemailer.createTransport().sendMail.mockClear();
  });

  it('should send an email with the correct options', async () => {
    const to = 'test@example.com';
    const subject = 'Test Email Subject';
    const body = '<p>Test Email Body</p>';
    await sendMail(to, subject, body);

    expect(nodemailer.createTransport).toHaveBeenCalledWith({
      service: 'gmail',
      host: 'smtp.gmail.com',
      auth: {
        user: 'ser517.team3.nmfl@gmail.com',
        pass: 'czbmkivxzmbhptip'
      }
    });
    expect(nodemailer.createTransport().sendMail).toHaveBeenCalledWith({
      from: 'ser517.team3.nmfl@gmail.com',
      to,
      subject,
      html: body
    }, expect.any(Function));
  });

  it('should log an error if the email fails to send', async () => {

    const to = 'test@example.com';
    const subject = 'Test Email Subject';
    const body = '<p>Test Email Body</p>';

    nodemailer.createTransport().sendMail.mockRejectedValue(new Error('Email failed to send'));

    await sendMail(to, subject, body);

    expect(nodemailer.createTransport).toHaveBeenCalledWith({
      service: 'gmail',
      host: 'smtp.gmail.com',
      auth: {
        user: 'ser517.team3.nmfl@gmail.com',
        pass: 'czbmkivxzmbhptip'
      }
    });

    expect(nodemailer.createTransport().sendMail).toHaveBeenCalledWith({
      from: 'ser517.team3.nmfl@gmail.com',
      to,
      subject,
      html: body
    }, expect.any(Function));

    expect(console.log).toHaveBeenCalledWith('Email failed to send');
  });
});
