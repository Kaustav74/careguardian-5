import nodemailer from "nodemailer";

// Set up the email transporter
const transporter = nodemailer.createTransport({
  service: "gmail",  // Using Gmail as the email service
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Send appointment confirmation email with payment link
 * 
 * @param {Object} appointmentData - The data for the appointment
 * @returns {Promise<string>} - Message indicating email status
 */
export async function sendAppointmentConfirmation(appointmentData: any): Promise<string> {
  try {
    // Generate a unique payment link (in a real app, this would come from a payment gateway)
    const paymentLink = `https://careguardian.online/pay/${appointmentData.id}`;
    
    // Create the email content with payment link
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: appointmentData.patientEmail,
      subject: "CareGuardian - Appointment Confirmation",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #3b82f6;">CareGuardian</h1>
            <p style="color: #6B7280;">Your Healthcare Partner</p>
          </div>
          
          <div style="margin-bottom: 30px;">
            <h2 style="color: #1F2937;">Appointment Confirmed</h2>
            <p>Dear ${appointmentData.patientName},</p>
            <p>Your appointment has been successfully booked with the following details:</p>
            
            <div style="background-color: #f9fafb; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Doctor:</strong> Dr. ${appointmentData.doctorName || "Assigned Doctor"}</p>
              <p><strong>Hospital:</strong> ${appointmentData.hospitalName || "Main Facility"}</p>
              <p><strong>Date:</strong> ${new Date(appointmentData.date).toLocaleDateString()}</p>
              <p><strong>Time:</strong> ${appointmentData.time}</p>
              <p><strong>Appointment Type:</strong> ${appointmentData.isVirtual ? "Virtual Consultation" : "In-person Visit"}</p>
            </div>
            
            <p><strong>Problem Description:</strong> ${appointmentData.problemDescription}</p>
            ${appointmentData.notes ? `<p><strong>Additional Notes:</strong> ${appointmentData.notes}</p>` : ""}
          </div>
          
          <div style="background-color: #eef2ff; padding: 20px; border-radius: 5px; margin-bottom: 20px; text-align: center;">
            <h3 style="color: #4f46e5; margin-top: 0;">Payment Required</h3>
            <p>Please complete your payment to confirm this appointment.</p>
            <a href="${paymentLink}" style="display: inline-block; background-color: #4f46e5; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 10px;">Complete Payment</a>
            <p style="margin-top: 15px; font-size: 12px; color: #6B7280;">Payment must be completed at least 24 hours before your appointment.</p>
          </div>
          
          <div style="font-size: 14px; color: #6B7280; border-top: 1px solid #e0e0e0; padding-top: 20px;">
            <p>If you have any questions, please contact us at support@careguardian.online or call our helpline at +91-80-12345678.</p>
            <p>Thank you for choosing CareGuardian for your healthcare needs.</p>
          </div>
        </div>
      `
    };
    
    // Send the email
    await transporter.sendMail(mailOptions);
    
    // Return the payment link so it can be stored in the database
    return paymentLink;
  } catch (error) {
    console.error("Failed to send appointment confirmation email:", error);
    throw new Error("Failed to send appointment confirmation email");
  }
}