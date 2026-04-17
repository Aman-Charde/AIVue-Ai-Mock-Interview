import Interview from '../models/Interview.js';
import { generateQuestions, evaluateAnswer } from '../services/aiService.js';

/**
 * Setup a new Interview session
 */
export const setupInterview = async (req, res) => {
  try {
    const { jobRole, domain, difficulty, interviewType } = req.body;
    
    // AI generated questions list
    const questionsText = await generateQuestions(jobRole, domain, difficulty, interviewType);
    const initialQuestions = questionsText.map(q => ({ questionText: q }));

    const interview = await Interview.create({
      user: req.user._id,
      jobRole,
      domain,
      difficulty,
      interviewType,
      questions: initialQuestions,
      status: 'in-progress'
    });

    res.status(201).json(interview);
  } catch (error) {
    res.status(500).json({ message: 'Setup Failed: ' + error.message });
  }
};

/**
 * Submit user answer for a specific question
 */
export const submitAnswer = async (req, res) => {
  try {
    const { interviewId, questionId, userAnswer } = req.body;
    
    const interview = await Interview.findById(interviewId);
    if (!interview) {
      return res.status(404).json({ message: 'Session not found' });
    }

    const questionIndex = interview.questions.findIndex(q => q._id.toString() === questionId);
    if (questionIndex === -1) {
      return res.status(404).json({ message: 'Question not found' });
    }

    // Call AI to evaluate answer
    const evaluation = await evaluateAnswer(
        interview.questions[questionIndex].questionText, 
        userAnswer, 
        interview.jobRole, 
        interview.domain
    );

    interview.questions[questionIndex].userAnswer = userAnswer;
    interview.questions[questionIndex].evaluation = evaluation;

    // Update session average score (0-10 based)
    const answeredQs = interview.questions.filter(q => q.evaluation && q.evaluation.score !== undefined);
    const sum = answeredQs.reduce((acc, q) => acc + q.evaluation.score, 0);
    interview.overallScore = (sum / (answeredQs.length || 1)) * 10; // Convert to parentage-like 0-100 logic for dashboard consistency

    await interview.save();
    
    res.json(interview);
  } catch (error) {
    res.status(500).json({ message: 'Submission Failed: ' + error.message });
  }
};

export const getInterviews = async (req, res) => {
  try {
    const interviews = await Interview.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(interviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getInterviewById = async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id);
    if (!interview) return res.status(404).json({ message: 'Interview not found' });
    res.json(interview);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const completeInterview = async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id);
    if (interview) {
      interview.status = 'completed';
      await interview.save();
      res.json(interview);
    } else {
      res.status(404).json({ message: 'Interview not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
