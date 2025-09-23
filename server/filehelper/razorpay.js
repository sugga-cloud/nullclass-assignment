import Razorpay from 'razorpay';

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_SECRET_ID || 'rzp_test_RAq8aVJexGG31U',
    key_secret: process.env.RAZORPAY_SECRET_KEY || '12XetPQpPAsMXjf1uDM0efRC',
});

export default razorpay;
