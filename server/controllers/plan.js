
import razorpay from '../filehelper/razorpay.js';
import sendInvoiceEmail from '../filehelper/mailer.js';
import users from '../Modals/Auth.js';

const PLAN_DETAILS = {
    free: { name: 'Free', limit: 5, price: 0 },
    bronze: { name: 'Bronze', limit: 7, price: 10 },
    silver: { name: 'Silver', limit: 10, price: 50 },
    gold: { name: 'Gold', limit: Infinity, price: 100 }
};

export async function upgradePlan(req, res) {
    const { plan, userid } = req.body;
    const userId = (req.user && req.user.id) || userid;
    if (!PLAN_DETAILS[plan] || plan === 'free') {
        return res.status(400).json({ error: 'Invalid plan' });
    }
    try {
    // Razorpay receipt must be <= 40 chars
    const shortReceipt = `rcpt_${userId}`.slice(0, 20) + `_${Date.now()}`.slice(-15);
    const order = await razorpay.orders.create({
        amount: PLAN_DETAILS[plan].price * 100, // in paise
        currency: 'INR',
        receipt: shortReceipt.slice(0, 40)
    });
        res.json({ orderId: order.id, amount: order.amount, currency: order.currency });
    } catch (err) {
        console.log(err)
        res.status(500).json({ error: 'Payment initiation failed' ,err});
    }
}

export async function verifyPayment(req, res) {
    const { plan, paymentId, orderId, signature, userid } = req.body;
    const userId = (req.user && req.user.id) || userid;
    // TODO: Add signature verification for security
    try {
        const user = await users.findById(userId);
        user.plan = plan;
        user.planExpiry = plan === 'gold' ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
        await user.save();
        // Send invoice email with details
        const planInfo = PLAN_DETAILS[plan] || {};
        const invoiceText = `Thank you for upgrading your plan!\n\nPlan: ${planInfo.name || plan}\nPrice: ₹${planInfo.price}\nOrder ID: ${orderId}\nPayment ID: ${paymentId}\n\nYour plan is now active.\n`;
        await sendInvoiceEmail(user.email, 'Plan Upgrade Invoice', invoiceText, null);
        res.json({ success: true, message: 'Plan upgraded and invoice email sent.' });
    } catch (err) {
        res.status(500).json({ error: 'Upgrade failed' });
    }
}

export function getPlanDetails(req, res) {
    res.json(PLAN_DETAILS);
}
