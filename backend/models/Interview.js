import mongoose from 'mongoose';

const interviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  jobRole: { type: String, required: true },
  domain: { type: String, required: true },
  difficulty: { type: String, required: true },
  interviewType: { type: String, required: true },
  questions: [{
    questionText: String,
    userAnswer: String,
    evaluation: {
      score: Number,
      feedback: String,
      improvements: [String]
    }
  }],
  status: { type: String, enum: ['setup', 'in-progress', 'completed'], default: 'setup' },
  overallScore: { type: Number, default: 0 }
}, { timestamps: true });

const Interview = mongoose.model('Interview', interviewSchema);
export default Interview;
