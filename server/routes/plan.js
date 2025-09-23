

import express from 'express';
const router = express.Router();
import { upgradePlan, verifyPayment, getPlanDetails } from '../controllers/plan.js';


router.post('/upgrade', upgradePlan);
router.post('/verify', verifyPayment);
router.get('/details', getPlanDetails);

export default router;
