import nodemailer from 'nodemailer';
import twilio from 'twilio';
import { getItinerary } from '../itinerary';

const transporter = nodemailer.createTransport({
  service: 'gmail', // or your service
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const twilioClient = twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);

export async function sendConfirmation(itineraryId: string, email?: string, phone?: string) {
  const itinerary = await getItinerary(itineraryId);
  if (!itinerary) return;

  const subject = 'Booking Confirmation';
  const text = `Your booking is confirmed. Total: ${itinerary.total} ${itinerary.currency}`;

  if (email) {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject,
      text,
    });
  }

  if (phone) {
    await twilioClient.messages.create({
      body: text,
      from: process.env.TWILIO_PHONE,
      to: phone,
    });
  }
}