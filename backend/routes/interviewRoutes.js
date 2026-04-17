import express from 'express';
import { setupInterview, submitAnswer, getInterviews, getInterviewById, completeInterview } from '../controllers/interviewController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/setup', setupInterview);
router.post('/answer', submitAnswer);
router.get('/', getInterviews);
router.get('/:id', getInterviewById);
router.put('/:id/complete', completeInterview);

export default router;
