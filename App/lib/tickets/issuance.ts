import { supabaseAdmin } from "../core/supabase";
import { getItinerary } from "../itinerary";
import { updateBookingStatus } from "../itinerary";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import QRCode from "qrcode";
import { format, toZonedTime } from "date-fns-tz";

// Premium color palette
const COLORS = {
  navy: '#0B1F3B',
  charcoal: '#0F1115',
  ivory: '#FAF7F0',
  gold: '#C9A227',
  goldHighlight: '#E6D18A',
  teal: '#17C3B2',
  tealGlow: 'rgba(23,195,178,0.18)',
};

/**
 * Generate booking reference (PNR-style): e.g. ECO-7H2K9P
 */
export function generateBookingReference(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let ref = "";
  for (let i = 0; i < 6; i++) {
    ref += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `ECO-${ref}`;
}

/**
 * Convert hex to RGB
 */
function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16),
      ]
    : [0, 0, 0];
}

/**
 * Get Melbourne time
 */
function getMelbourneTime(date: Date = new Date()): string {
  const melbourneTime = toZonedTime(date, "Australia/Melbourne");
  return format(melbourneTime, "dd MMM yyyy, h:mm a", { timeZone: "Australia/Melbourne" });
}

/**
 * Create premium luxury e-ticket PDF
 */
export async function createTicketPDF(bookingData: {
  bookingReference: string;
  issueDate: string;
  passengers: Array<{
    title: string;
    firstName: string;
    lastName: string;
  }>;
  flights: Array<{
    from: { code: string; city?: string };
    to: { code: string; city?: string };
    date: string;
    departureTime?: string;
    arrivalTime?: string;
    duration?: string;
    airline?: string;
    flightNumber?: string;
    cabinClass?: string;
  }>;
  baggage?: {
    carryOn: boolean;
    checkedBags?: Array<{ type: string; quantity: number }>;
  };
  seats?: Array<{ passengerName: string; seatNumber: string }>;
  insurance?: { plan: string; price?: number };
  totalPaid: number;
  currency: string;
  paymentProvider: "Stripe" | "NOWPayments";
  bookingId: string;
  siteUrl?: string;
}): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    try {
      // A4 dimensions: 595.28 x 841.89 points
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 0, bottom: 0, left: 0, right: 0 },
      });

      const buffers: Buffer[] = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        resolve(Buffer.concat(buffers));
      });
      doc.on('error', reject);

      const pageWidth = 595.28;
      const pageHeight = 841.89;
      const margin = 30;
      const contentWidth = pageWidth - (margin * 2);
      const borderWidth = 1.5;
      const borderRadius = 8;

      // Background: Ivory with subtle gradient
      const [ivoryR, ivoryG, ivoryB] = hexToRgb(COLORS.ivory);
      const [tealR, tealG, tealB] = hexToRgb(COLORS.teal);
      
      // Gradient background (subtle teal glow top-left)
      const grad = doc.linearGradient(margin, margin, pageWidth - margin, pageHeight - margin);
      grad.stop(0, `rgb(${ivoryR}, ${ivoryG}, ${ivoryB})`);
      grad.stop(0.1, `rgb(${Math.round(tealR * 0.02 + ivoryR * 0.98)}, ${Math.round(tealG * 0.02 + ivoryG * 0.98)}, ${Math.round(tealB * 0.02 + ivoryB * 0.98)})`);
      grad.stop(1, `rgb(${ivoryR}, ${ivoryG}, ${ivoryB})`);
      doc.rect(0, 0, pageWidth, pageHeight).fill(grad);

      // Gold border with rounded corners
      const [goldR, goldG, goldB] = hexToRgb(COLORS.gold);
      doc.roundedRect(margin, margin, pageWidth - (margin * 2), pageHeight - (margin * 2), borderRadius)
        .lineWidth(borderWidth)
        .strokeColor(`rgb(${goldR}, ${goldG}, ${goldB})`)
        .stroke();

      // Logo path
      const cwd = process.cwd();
      const isAppDir = cwd.endsWith('App') || cwd.endsWith('App\\');
      const basePath = isAppDir ? cwd : path.join(cwd, 'App');
      const logoPath = path.join(basePath, 'public', 'brand', 'ecovira-logo-transparent.png');
      const fallbackLogoPath = path.join(basePath, 'public', 'ecovira-logo.png.png');

      // Watermark logo (centered, 5-8% opacity)
      let logoExists = false;
      if (fs.existsSync(logoPath) || fs.existsSync(fallbackLogoPath)) {
        const logoFile = fs.existsSync(logoPath) ? logoPath : fallbackLogoPath;
        try {
          doc.save();
          doc.opacity(0.06); // 6% opacity
          const logoWidth = 200;
          const logoHeight = 60;
          doc.image(logoFile, (pageWidth - logoWidth) / 2, (pageHeight - logoHeight) / 2, {
            width: logoWidth,
            height: logoHeight,
            fit: [logoWidth, logoHeight],
          });
          doc.restore();
          logoExists = true;
        } catch (err) {
          console.warn("[Ticket] Watermark logo failed:", err);
        }
      }

      let currentY = margin + 25;

      // Navy header bar
      const headerHeight = 70;
      const [navyR, navyG, navyB] = hexToRgb(COLORS.navy);
      doc.rect(margin + borderRadius, currentY, contentWidth - borderRadius * 2, headerHeight)
        .fillColor(`rgb(${navyR}, ${navyG}, ${navyB})`)
        .fill();

      // Logo in header (left)
      if (logoExists && (fs.existsSync(logoPath) || fs.existsSync(fallbackLogoPath))) {
        const logoFile = fs.existsSync(logoPath) ? logoPath : fallbackLogoPath;
        try {
          doc.image(logoFile, margin + 20, currentY + 10, {
            width: 120,
            height: 35,
            fit: [120, 35],
          });
        } catch (err) {
          // Fallback text
          doc.fontSize(18).font('Helvetica-Bold')
            .fillColor('white')
            .text('ECOVIRA AIR', margin + 20, currentY + 20);
        }
      } else {
        doc.fontSize(18).font('Helvetica-Bold')
          .fillColor('white')
          .text('ECOVIRA AIR', margin + 20, currentY + 20);
      }

      // Booking Reference pill (right side of header)
      const [charcoalR, charcoalG, charcoalB] = hexToRgb(COLORS.charcoal);
      const refText = bookingData.bookingReference;
      doc.font('Helvetica-Bold').fontSize(12);
      const refWidth = doc.widthOfString(refText) + 24;
      const refX = pageWidth - margin - refWidth - 20;
      const refY = currentY + 20;
      const refHeight = 28;

      // Pill background (charcoal)
      doc.roundedRect(refX, refY, refWidth, refHeight, refHeight / 2)
        .fillColor(`rgb(${charcoalR}, ${charcoalG}, ${charcoalB})`)
        .fill();

      // Gold border
      doc.roundedRect(refX, refY, refWidth, refHeight, refHeight / 2)
        .lineWidth(1)
        .strokeColor(`rgb(${goldR}, ${goldG}, ${goldB})`)
        .stroke();

      // Subtle teal glow effect (shadow)
      doc.save();
      doc.opacity(0.15);
      doc.roundedRect(refX + 1, refY + 2, refWidth, refHeight, refHeight / 2)
        .fillColor(`rgb(${tealR}, ${tealG}, ${tealB})`)
        .fill();
      doc.restore();

      // Reference text (ivory)
      doc.fontSize(12).font('Helvetica-Bold')
        .fillColor('rgb(255, 247, 240)') // Ivory text
        .text(refText, refX + 12, refY + 7);

      // Gold hairline underline
      doc.moveTo(margin + borderRadius, currentY + headerHeight)
        .lineTo(pageWidth - margin - borderRadius, currentY + headerHeight)
        .lineWidth(0.5)
        .strokeColor(`rgb(${goldR}, ${goldG}, ${goldB})`)
        .stroke();

      currentY += headerHeight + 25;

      // Issue date (small, right-aligned, above content)
      doc.fontSize(9).font('Helvetica')
        .fillColor(`rgb(${charcoalR}, ${charcoalG}, ${charcoalB})`)
        .text(`Issued: ${getMelbourneTime(new Date(bookingData.issueDate))} (Melbourne time)`, 
          margin, currentY - 15, { align: 'right', width: contentWidth });

      // Passengers section (premium card)
      doc.roundedRect(margin + 10, currentY, contentWidth - 20, 60, 4)
        .fillColor('white')
        .fill()
        .lineWidth(0.5)
        .strokeColor('rgb(230, 230, 230)')
        .stroke();

      doc.fontSize(10).font('Helvetica-Bold')
        .fillColor(`rgb(${charcoalR}, ${charcoalG}, ${charcoalB})`)
        .text('PASSENGER(S)', margin + 25, currentY + 12);

      const passengerNames = bookingData.passengers.map((p, idx) => {
        const name = `${p.title} ${p.firstName} ${p.lastName}`.trim();
        return `${idx + 1}. ${name}`;
      }).join(' | ');

      doc.fontSize(10).font('Helvetica')
        .fillColor(`rgb(${charcoalR}, ${charcoalG}, ${charcoalB})`)
        .text(passengerNames, margin + 25, currentY + 28, {
          width: contentWidth - 50,
          ellipsis: true,
        });

      currentY += 80;

      // Hero Itinerary Section (main focus)
      const itineraryCardHeight = 180;
      doc.roundedRect(margin + 10, currentY, contentWidth - 20, itineraryCardHeight, 6)
        .fillColor('white')
        .fill()
        .lineWidth(0.5)
        .strokeColor('rgb(230, 230, 230)')
        .stroke();

      const flight = bookingData.flights[0];
      const routeY = currentY + 25;

      // Large route line (IATA → IATA)
      doc.fontSize(32).font('Helvetica-Bold')
        .fillColor(`rgb(${navyR}, ${navyG}, ${navyB})`)
        .text(`${flight.from.code} → ${flight.to.code}`, margin + 25, routeY);

      // Subtle teal glow accent line under route
      doc.save();
      doc.opacity(0.25);
      doc.moveTo(margin + 25, routeY + 35)
        .lineTo(margin + 25 + 150, routeY + 35)
        .lineWidth(3)
        .strokeColor(`rgb(${tealR}, ${tealG}, ${tealB})`)
        .stroke();
      doc.restore();

      // Timeline row
      const timelineY = routeY + 50;
      const routeDetails = [
        flight.from.city ? `${flight.from.city} (${flight.from.code})` : flight.from.code,
        flight.to.city ? `${flight.to.city} (${flight.to.code})` : flight.to.code,
      ].join(' → ');

      doc.fontSize(9).font('Helvetica')
        .fillColor('rgb(102, 102, 102)')
        .text(routeDetails, margin + 25, timelineY);

      const dateTimeY = timelineY + 18;
      let dateTimeText = `Date: ${flight.date}`;
      if (flight.departureTime) {
        dateTimeText += ` | Depart: ${flight.departureTime}`;
      }
      if (flight.arrivalTime) {
        dateTimeText += ` | Arrive: ${flight.arrivalTime}`;
      }
      if (flight.duration) {
        dateTimeText += ` | Duration: ${flight.duration}`;
      }

      doc.fontSize(9).font('Helvetica')
        .fillColor(`rgb(${charcoalR}, ${charcoalG}, ${charcoalB})`)
        .text(dateTimeText, margin + 25, dateTimeY);

      // Airline/flight number/cabin
      const flightInfoY = dateTimeY + 18;
      const flightInfoParts = [
        flight.airline,
        flight.flightNumber,
        flight.cabinClass ? flight.cabinClass.charAt(0).toUpperCase() + flight.cabinClass.slice(1) : null,
      ].filter(Boolean);

      if (flightInfoParts.length > 0) {
        doc.fontSize(9).font('Helvetica')
          .fillColor(`rgb(${charcoalR}, ${charcoalG}, ${charcoalB})`)
          .text(flightInfoParts.join(' • '), margin + 25, flightInfoY);
      }

      currentY += itineraryCardHeight + 20;

      // Add-ons section (premium chips)
      const addOns: string[] = [];

      if (bookingData.baggage) {
        if (bookingData.baggage.carryOn) {
          addOns.push('Carry-on');
        }
        if (bookingData.baggage.checkedBags && bookingData.baggage.checkedBags.length > 0) {
          const checkedSummary = bookingData.baggage.checkedBags
            .map(b => `${b.quantity}x ${b.type}`)
            .join(', ');
          addOns.push(`Checked: ${checkedSummary}`);
        }
      }

      if (bookingData.seats && bookingData.seats.length > 0) {
        const seatsSummary = bookingData.seats
          .map(s => `${s.seatNumber}`)
          .join(', ');
        addOns.push(`Seats: ${seatsSummary}`);
      }

      if (bookingData.insurance && bookingData.insurance.plan !== 'none') {
        addOns.push(`Insurance: ${bookingData.insurance.plan.charAt(0).toUpperCase() + bookingData.insurance.plan.slice(1)}`);
      }

      if (addOns.length > 0) {
        let chipX = margin + 25;
        const chipY = currentY;
        const chipHeight = 24;
        const chipPadding = 12;

        doc.font('Helvetica').fontSize(9);
        addOns.forEach((text, idx) => {
          const chipWidth = doc.widthOfString(text) + chipPadding * 2;
          
          if (chipX + chipWidth > pageWidth - margin - 25 && idx > 0) {
            chipX = margin + 25;
            currentY += chipHeight + 8;
          }

          // Chip background (white with gold border)
          doc.roundedRect(chipX, currentY, chipWidth, chipHeight, chipHeight / 2)
            .fillColor('white')
            .fill()
            .lineWidth(1)
            .strokeColor(`rgb(${goldR}, ${goldG}, ${goldB})`)
            .stroke();

          doc.fontSize(9).font('Helvetica')
            .fillColor(`rgb(${charcoalR}, ${charcoalG}, ${charcoalB})`)
            .text(text, chipX + chipPadding, currentY + 6);

          chipX += chipWidth + 10;
        });

        currentY += chipHeight + 15;
      } else {
        currentY += 10;
      }

      // Payment summary (right-aligned table)
      const paymentY = currentY;
      const tableWidth = 220;
      const tableX = pageWidth - margin - tableWidth - 10;

      // Table header
      doc.fontSize(10).font('Helvetica-Bold')
        .fillColor(`rgb(${navyR}, ${navyG}, ${navyB})`)
        .text('PAYMENT SUMMARY', tableX, paymentY);

      let paymentTableY = paymentY + 20;

      // Payment provider
      doc.fontSize(9).font('Helvetica')
        .fillColor('rgb(127, 127, 127)')
        .text('Provider:', tableX, paymentTableY);
      doc.fontSize(9).font('Helvetica')
        .fillColor(`rgb(${charcoalR}, ${charcoalG}, ${charcoalB})`)
        .text(bookingData.paymentProvider, tableX + 70, paymentTableY);
      paymentTableY += 15;

      // Total row with gold divider
      doc.moveTo(tableX, paymentTableY + 5)
        .lineTo(tableX + tableWidth, paymentTableY + 5)
        .lineWidth(1)
        .strokeColor(`rgb(${goldR}, ${goldG}, ${goldB})`)
        .stroke();

      paymentTableY += 10;

      doc.fontSize(10).font('Helvetica-Bold')
        .fillColor(`rgb(${charcoalR}, ${charcoalG}, ${charcoalB})`)
        .text('Total Paid:', tableX, paymentTableY);
      doc.fontSize(12).font('Helvetica-Bold')
        .fillColor(`rgb(${navyR}, ${navyG}, ${navyB})`)
        .text(`${bookingData.currency} ${bookingData.totalPaid.toFixed(2)}`, tableX + 70, paymentTableY - 2);

      // QR Code + Manage booking section
      const qrSectionY = paymentTableY + 50;
      const qrSize = 80;
      const qrX = pageWidth - margin - qrSize - 25;

      // QR Code
      const bookingUrl = bookingData.siteUrl 
        ? `${bookingData.siteUrl}/book/manage?bookingId=${bookingData.bookingId}`
        : `https://ecovira.air/book/manage?bookingId=${bookingData.bookingId}`;
      
      try {
        const qrCodeDataUrl = await QRCode.toDataURL(bookingUrl, { width: qrSize * 2, margin: 1 });
        const qrImage = Buffer.from(qrCodeDataUrl.split(',')[1], 'base64');
        doc.image(qrImage, qrX, qrSectionY, { width: qrSize, height: qrSize });
      } catch (qrError) {
        console.warn("[Ticket] QR code generation failed:", qrError);
      }

      // Manage booking + Support (left of QR)
      const manageX = margin + 25;
      const supportEmail = process.env.SUPPORT_EMAIL || "support@ecovira.air";
      const manageUrl = bookingData.siteUrl 
        ? `${bookingData.siteUrl}/book/manage?bookingId=${bookingData.bookingId}`
        : bookingUrl;

      doc.fontSize(9).font('Helvetica')
        .fillColor(`rgb(${charcoalR}, ${charcoalG}, ${charcoalB})`)
        .text('Manage Booking:', manageX, qrSectionY + 10);
      
      doc.fontSize(9).font('Helvetica')
        .fillColor(`rgb(${tealR}, ${tealG}, ${tealB})`)
        .text(manageUrl, manageX, qrSectionY + 25, {
          width: qrX - manageX - 20,
          link: manageUrl,
          ellipsis: true,
        });

      doc.fontSize(9).font('Helvetica')
        .fillColor(`rgb(${charcoalR}, ${charcoalG}, ${charcoalB})`)
        .text('Support:', manageX, qrSectionY + 45);
      
      doc.fontSize(9).font('Helvetica')
        .fillColor(`rgb(${tealR}, ${tealG}, ${tealB})`)
        .text(supportEmail, manageX, qrSectionY + 60, {
          link: `mailto:${supportEmail}`,
        });

      // Footer disclaimer
      const footerY = pageHeight - margin - 30;
      doc.moveTo(margin + 10, footerY - 10)
        .lineTo(pageWidth - margin - 10, footerY - 10)
        .lineWidth(0.5)
        .strokeColor('rgb(230, 230, 230)')
        .stroke();

      doc.fontSize(8).font('Helvetica-Bold')
        .fillColor(`rgb(${charcoalR}, ${charcoalG}, ${charcoalB})`)
        .text('This is not a boarding pass. Check-in required.', margin, footerY, {
          align: 'center',
          width: contentWidth,
        });

      doc.fontSize(7).font('Helvetica')
        .fillColor('rgb(127, 127, 127)')
        .text('Subject to airline rules.', margin, footerY + 12, {
          align: 'center',
          width: contentWidth,
        });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Store ticket file and metadata in database
 */
async function storeTicketFile(
  bookingId: string,
  ticketBuffer: Buffer,
  bookingReference: string
): Promise<{ url: string; filePath: string }> {
  const fileName = `EcoviraAir_Eticket_${bookingReference}.pdf`;
  
  try {
    const { data, error } = await supabaseAdmin.storage
      .from('tickets')
      .upload(fileName, ticketBuffer, {
        contentType: 'application/pdf',
        upsert: false,
      });

    if (!error && data) {
      const { data: urlData } = supabaseAdmin.storage
        .from('tickets')
        .getPublicUrl(fileName);

      return {
        url: urlData?.publicUrl || `/api/tickets/${fileName}`,
        filePath: fileName,
      };
    }
  } catch (err) {
    console.warn('[Ticket] Supabase Storage not available, using file path only:', err);
  }

  return {
    url: `/api/tickets/${fileName}`,
    filePath: fileName,
  };
}

/**
 * Send ticket email with PDF attachment
 */
async function sendTicketEmail(
  email: string,
  bookingReference: string,
  ticketBuffer: Buffer,
  bookingSummary: { route: string; date: string }
): Promise<{ sent: boolean; error?: string }> {
  try {
    const nodemailer = await import('nodemailer');
    const transporter = nodemailer.default.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const supportEmail = process.env.SUPPORT_EMAIL || "support@ecovira.air";
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ecovira.air";

    const subject = `Your Ecovira Air e-ticket — Booking ${bookingReference}`;
    const htmlBody = `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #FAF7F0; padding: 40px;">
        <div style="background: #0B1F3B; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: #E6D18A; margin: 0; font-size: 28px; font-weight: bold;">ECOVIRA AIR</h1>
        </div>
        <div style="background: white; padding: 40px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <h2 style="color: #0B1F3B; margin-top: 0;">Your e-ticket is ready</h2>
          <p style="color: #0F1115; line-height: 1.6;">Dear Passenger,</p>
          <p style="color: #0F1115; line-height: 1.6;">Your flight booking has been confirmed. Please find your e-ticket attached.</p>
          <div style="background: #FAF7F0; padding: 20px; border-left: 3px solid #C9A227; margin: 20px 0;">
            <p style="margin: 0; color: #0F1115;"><strong>Booking Summary:</strong></p>
            <p style="margin: 5px 0 0 0; color: #0F1115;">${bookingSummary.route}</p>
            <p style="margin: 5px 0 0 0; color: #0F1115;">${bookingSummary.date}</p>
          </div>
          <div style="margin: 30px 0;">
            <a href="${siteUrl}/book/manage?bookingId=${bookingReference}" style="background: #17C3B2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">Download e-ticket</a>
            <a href="${siteUrl}/book/manage" style="color: #17C3B2; padding: 12px 24px; text-decoration: none; display: inline-block; margin-left: 10px;">Manage booking</a>
          </div>
          <p style="color: #666; font-size: 14px; line-height: 1.6;">If you have any questions, please contact us at <a href="mailto:${supportEmail}" style="color: #17C3B2;">${supportEmail}</a>.</p>
          <p style="color: #0F1115; margin-top: 30px;">Safe travels,<br><strong>The Ecovira Air Team</strong></p>
        </div>
      </div>
    `;
    const textBody = `
Your Ecovira Air e-ticket

Dear Passenger,

Your flight booking has been confirmed. Please find your e-ticket attached.

Booking Summary:
${bookingSummary.route}
${bookingSummary.date}

Download e-ticket: ${siteUrl}/book/manage?bookingId=${bookingReference}
Manage booking: ${siteUrl}/book/manage

If you have any questions, please contact us at ${supportEmail}.

Safe travels,
The Ecovira Air Team
    `.trim();

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: email,
      subject,
      text: textBody,
      html: htmlBody,
      attachments: [
        {
          filename: `EcoviraAir_Eticket_${bookingReference}.pdf`,
          content: ticketBuffer,
          contentType: 'application/pdf',
        },
      ],
    });

    console.log("[Ticket] Email sent successfully to:", email);
    return { sent: true };
  } catch (error) {
    console.error("[Ticket] Failed to send email:", error);
    return { sent: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

/**
 * Get booking by ID with full details
 */
async function getBookingById(bookingId: string): Promise<any | null> {
  const { data, error } = await supabaseAdmin
    .from('bookings')
    .select(`
      *,
      itineraries (
        *,
        itinerary_items (*)
      )
    `)
    .eq('id', bookingId)
    .single();

  if (error) return null;
  return data;
}

/**
 * Parse bookingData from metadata (JSON string)
 */
function parseBookingData(metadata: any): any {
  try {
    if (typeof metadata === 'string') {
      return JSON.parse(metadata);
    }
    if (metadata?.bookingData && typeof metadata.bookingData === 'string') {
      return JSON.parse(metadata.bookingData);
    }
    return metadata?.bookingData || metadata || {};
  } catch (err) {
    console.warn("[Ticket] Failed to parse bookingData:", err);
    return {};
  }
}

/**
 * Determine payment provider from payment_id
 */
function getPaymentProvider(paymentId: string): "Stripe" | "NOWPayments" {
  if (paymentId.startsWith('cs_') || paymentId.startsWith('pi_')) {
    return "Stripe";
  }
  if (paymentId.startsWith('np_') || paymentId.startsWith('payment_')) {
    return "NOWPayments";
  }
  return "Stripe";
}

/**
 * Main function: Issue ticket for a booking
 * 
 * NOTE: This function is currently STUBBED for production readiness.
 * Set ENABLE_LIVE_TICKETING=true to enable actual ticket issuance.
 * When stubbed, it uses issueTicketStub() which returns PENDING status.
 */
export async function issueTicket(bookingId: string): Promise<{
  success: boolean;
  bookingReference?: string;
  ticketUrl?: string;
  error?: string;
}> {
  // STUB MODE: Use stub adapter unless live ticketing is explicitly enabled
  const enableLiveTicketing = process.env.ENABLE_LIVE_TICKETING === 'true';
  
  if (!enableLiveTicketing) {
    console.log("[Ticket] Using STUB adapter - live ticketing disabled");
    const { issueTicketStub } = await import("./stub-adapter");
    const stubResult = await issueTicketStub(bookingId);
    return {
      success: stubResult.success,
      bookingReference: stubResult.bookingReference,
      error: stubResult.error,
    };
  }

  // LIVE MODE: Actual ticket issuance (only when ENABLE_LIVE_TICKETING=true)
  try {
    const booking = await getBookingById(bookingId);
    if (!booking) {
      return { success: false, error: "Booking not found" };
    }

    if (booking.status === 'issued' || (booking.ticket_status === 'ISSUED')) {
      console.log("[Ticket] Booking already issued:", bookingId);
      return {
        success: true,
        bookingReference: booking.booking_reference,
        ticketUrl: booking.ticket_pdf_url || booking.ticket_url,
      };
    }

    let bookingReference = booking.booking_reference;
    if (!bookingReference) {
      bookingReference = generateBookingReference();
      await supabaseAdmin
        .from('bookings')
        .update({ booking_reference: bookingReference })
        .eq('id', bookingId);
    }

    const itinerary = (booking as any).itineraries;
    if (!itinerary) {
      return { success: false, error: "Itinerary not found for booking" };
    }

    const flightItem = itinerary.itinerary_items?.find(
      (item: any) => item.type === 'flight'
    );
    
    const itemData = flightItem?.item_data || flightItem?.item || {};
    const rawData = itemData.raw || itemData;

    const passengers = booking.passengers || [{
      title: "Mr",
      firstName: booking.passenger_email?.split('@')[0] || "Passenger",
      lastName: booking.passenger_last_name || "",
    }];

    const flights = [{
      from: {
        code: itemData.from || rawData?.from || 'N/A',
        city: itemData.fromCity || rawData?.fromCity,
      },
      to: {
        code: itemData.to || rawData?.to || 'N/A',
        city: itemData.toCity || rawData?.toCity,
      },
      date: itemData.departDate || itemData.depart_date || new Date().toISOString().split('T')[0],
      departureTime: itemData.departureTime || rawData?.departure_time,
      arrivalTime: itemData.arrivalTime || rawData?.arrival_time,
      duration: itemData.duration || rawData?.duration,
      airline: itemData.airline || rawData?.airline_iata || itemData.airline_iata,
      flightNumber: itemData.flight_number || itemData.flightNumber || rawData?.flight_number,
      cabinClass: itemData.cabin_class || itemData.cabinClass || rawData?.cabin_class,
    }];

    const bookingMetadata = booking.metadata || {};
    const parsedData = parseBookingData(bookingMetadata);
    const baggage = parsedData.baggage || booking.baggage;
    const seats = parsedData.seats || booking.seats;
    const insurance = parsedData.insurance || booking.insurance;

    const paymentProvider = getPaymentProvider(booking.payment_id);
    const totalPaid = itinerary.total || 0;
    const currency = itinerary.currency || 'AUD';

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ecovira.air";

    const ticketBuffer = await createTicketPDF({
      bookingReference,
      issueDate: new Date().toISOString(),
      passengers: passengers.map((p: any) => ({
        title: p.title || "Mr",
        firstName: p.firstName || p.first_name || "",
        lastName: p.lastName || p.last_name || "",
      })),
      flights,
      baggage: baggage ? {
        carryOn: baggage.carryOn || baggage.carry_on || false,
        checkedBags: baggage.checkedBags || baggage.checked_bags || [],
      } : undefined,
      seats: seats ? seats.map((s: any) => ({
        passengerName: s.passengerName || s.passenger_name || "Passenger",
        seatNumber: s.seatNumber || s.seat_number || s.seat || "",
      })) : undefined,
      insurance: insurance ? {
        plan: insurance.plan || insurance.plan_type || 'none',
        price: insurance.price,
      } : undefined,
      totalPaid,
      currency,
      paymentProvider,
      bookingId,
      siteUrl,
    });

    const { url: ticketUrl, filePath } = await storeTicketFile(
      bookingId,
      ticketBuffer,
      bookingReference
    );

    await supabaseAdmin
      .from('bookings')
      .update({
        ticket_pdf_url: ticketUrl,
        ticket_url: ticketUrl,
        ticket_file_path: filePath,
        ticket_status: 'ISSUED',
        ticket_issued_at: new Date().toISOString(),
      })
      .eq('id', bookingId);

    if (booking.passenger_email) {
      const bookingSummary = {
        route: `${flights[0].from.code} → ${flights[0].to.code}`,
        date: flights[0].date,
      };
      await sendTicketEmail(
        booking.passenger_email,
        bookingReference,
        ticketBuffer,
        bookingSummary
      );
    }

    try {
      // Use new status enum: TICKETED for flights, FULFILLMENT_PENDING for other products
      await updateBookingStatus(bookingId, 'TICKETED');
    } catch (err) {
      console.warn("[Ticket] 'issued' status not supported, using 'confirmed'");
      // Use new status enum: FULFILLMENT_PENDING (provider booking confirmed, awaiting ticket/voucher)
      await updateBookingStatus(bookingId, 'FULFILLMENT_PENDING');
    }

    console.log("[Ticket] Ticket issued successfully:", {
      bookingId,
      bookingReference,
      ticketUrl,
    });

    return {
      success: true,
      bookingReference,
      ticketUrl,
    };
  } catch (error) {
    console.error("[Ticket] Error issuing ticket:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
