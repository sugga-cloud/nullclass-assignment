
import User from "../Modals/Auth.js";
import Video from "../Modals/video.js";
import Razorpay from "razorpay";
import fs from "fs";
import path from "path";
import nodemailer from "nodemailer";


const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'test_key_7695d86d68',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'test_secret_jcjiudsus486',
});

const PLAN_LIMITS = {
  free: 5,
  bronze: 7,
  silver: 10,
  gold: Infinity
};

const PLAN_COSTS = {
  bronze: 10,
  silver: 50,
  gold: 100
};

function sendInvoiceEmail(user, plan, amount) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: user.email,
    subject: `Your ${plan} Plan Invoice`,
    text: `Thank you for upgrading to the ${plan} plan.\nAmount: Rs ${amount}\n\nEnjoy your new limits!`,
    html: `<h2>Invoice</h2><p>Plan: <b>${plan}</b></p><p>Amount: <b>Rs ${amount}</b></p>`
  };
  return transporter.sendMail(mailOptions);
}



export const downloadVideo = async (req, res) => {
  const { userid, videoid } = req.body;
  console.log("Download request:", { userid, videoid });
  const user = await User.findById(userid);
  if (!user) {
    console.log("User not found", userid);
    return res.status(404).json({ message: "User not found" });
  }

  const plan = user.plan || "free";
  const today = new Date().toISOString().slice(0, 10);
  const downloadsToday = (user.downloadsToday || []).filter(d => d.date === today);
  console.log(`User plan: ${plan}, downloads today: ${downloadsToday.length}`);
  if (plan === "free" && downloadsToday.length >= 1) {
    console.log("Free plan daily download limit reached");
    return res.status(403).json({ message: "Free plan allows only one download per day. Upgrade to premium for unlimited downloads." });
  }
  const video = await Video.findById(videoid);
  console.log("Video found:", video);
  if (!video) {
    console.log("Video not found", videoid);
    return res.status(404).json({ message: "Video not found" });
  }
  const filePath = path.resolve(process.cwd(), video.filepath);
  console.log("Resolved file path:", filePath);
  if (!fs.existsSync(filePath)) {
    console.log("File not found on disk", filePath);
    return res.status(404).json({ message: "File not found" });
  }

  // Track daily downloads
  if (!user.downloadsToday) user.downloadsToday = [];
  user.downloadsToday = user.downloadsToday.filter(d => d.date === today);
  user.downloadsToday.push({ date: today, videoid });
  user.downloads.push(videoid);
  await user.save();

  // Set Content-Disposition header for correct filename
  res.setHeader('Content-Disposition', `attachment; filename="${video.filename || path.basename(filePath)}"`);
  console.log("Sending file for download:", video.filename || path.basename(filePath));
  res.download(filePath);
};


// Plan upgrade endpoint
export const upgradePlan = async (req, res) => {
  const { userid, plan, payment_id } = req.body;
  if (!userid || !plan || !PLAN_COSTS[plan]) {
    return res.status(400).json({ message: "Invalid plan or user." });
  }
  // Payment verification logic here (mocked for now)
  // You should verify payment_id with Razorpay API
  const user = await User.findById(userid);
  if (!user) return res.status(404).json({ message: "User not found" });

  user.plan = plan;
  user.premium = plan !== "free";
  if (plan !== "gold") {
    // Set expiry to 30 days from now for non-gold plans
    user.planExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  } else {
    user.planExpiry = null;
  }
  await user.save();

  // Send invoice email
  try {
    await sendInvoiceEmail(user, plan, PLAN_COSTS[plan]);
  } catch (e) {
    console.error("Email error:", e);
  }

  res.status(200).json({ success: true, plan });
};
