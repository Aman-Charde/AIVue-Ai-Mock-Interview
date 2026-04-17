import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Webcam from 'react-webcam';
import { Mic, MicOff, Send, Loader2, VideoOff, CheckCircle2, Maximize, Camera, AlertTriangle } from 'lucide-react';
import * as tf from '@tensorflow/tfjs';
import * as blazeface from '@tensorflow-models/blazeface';

export default function InterviewRoom() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [interview, setInterview] = useState(null);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [camEnabled, setCamEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [warnings, setWarnings] = useState(0);
  const [faceModel, setFaceModel] = useState(null);
  const recognitionRef = useRef(null);
  const webcamRef = useRef(null);
  const lastWarningTime = useRef(0);
  const isWarningActive = useRef(false);
  const lastFaceStatus = useRef('normal');
  const [activeWarning, setActiveWarning] = useState(null);

  const [isCompletedState, setIsCompletedState] = useState(false);
  const isCompletedRef = useRef(false);

  const handleViolation = React.useCallback((customMsg) => {
    if (isWarningActive.current || isCompletedRef.current) return;

    const now = Date.now();
    if (now - lastWarningTime.current < 5000) return; // Prevent spamming within 5 seconds

    isWarningActive.current = true; // Lock warning system

    setWarnings(prev => {
      const newWarnings = prev + 1;
      const isTerminal = newWarnings >= 3;
      let msg = customMsg || `Warning ${newWarnings}/3: Tab switching, minimizing, or exiting fullscreen is not allowed during the interview.`;

      if (isTerminal) {
        msg = 'You have exceeded the maximum number of warnings. The interview will now terminate.';
      }

      setActiveWarning({ message: msg, isTerminal });
      return newWarnings;
    });
  }, []);

  const dismissWarning = () => {
    if (activeWarning?.isTerminal) {
      isCompletedRef.current = true;
      if (document.fullscreenElement) document.exitFullscreen().catch(e => console.log(e));
      navigate(`/result/${id}`);
      return;
    }
    setActiveWarning(null);

    // Reset lock safely after dismiss
    setTimeout(() => {
      isWarningActive.current = false;
      lastWarningTime.current = Date.now();
    }, 1000);
  };

  // Anti-Cheating Mechanism
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && !isCompletedRef.current) handleViolation();
    };

    const handleWindowBlur = () => {
      if (!isCompletedRef.current) handleViolation();
    };

    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!document.fullscreenElement;
      setIsFullscreen(isCurrentlyFullscreen);

      if (!isCurrentlyFullscreen && !isCompletedRef.current && interview && interview.status !== 'completed') {
        handleViolation();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    // Initial check
    setIsFullscreen(!!document.fullscreenElement);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("blur", handleWindowBlur);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [handleViolation, interview]);

  useEffect(() => {
    const fetchInterview = async () => {
      try {
        const { data } = await axios.get(`https://aivue-backend.onrender.com/api/interviews/${id}`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setInterview(data);

        // Skip already answered questions
        const firstUnanswered = data.questions.findIndex(q => !q.userAnswer);
        if (firstUnanswered !== -1) {
          setCurrentQIndex(firstUnanswered);
        } else {
          // All answered, mark as completed if not already
          isCompletedRef.current = true;
          if (data.status !== 'completed') {
            await axios.put(`https://aivue-backend.onrender.com/api/interviews/${id}/complete`, {}, {
              headers: { Authorization: `Bearer ${user.token}` }
            }).catch(() => { });
          }
          if (document.fullscreenElement) document.exitFullscreen().catch(e => console.log(e));
          setIsCompletedState(true);
        }
      } catch (error) {
        console.error(error);
      }
    };
    fetchInterview();

    // Initialize Speech Recognition
    if (window.SpeechRecognition || window.webkitSpeechRecognition) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            setUserAnswer((prev) => prev + transcript + ' ');
          } else {
            currentTranscript += transcript;
          }
        }
      };
    }

    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, [id, user.token, navigate]);

  // Load and start BlazeFace monitoring
  useEffect(() => {
    const loadFaceDetection = async () => {
      try {
        await tf.ready();
        const model = await blazeface.load();
        setFaceModel(model);
      } catch (err) {
        console.warn("Face model failed to load", err);
      }
    };
    loadFaceDetection();
  }, []);

  useEffect(() => {
    let interval;
    if (faceModel && camEnabled && isFullscreen && interview && interview.status !== 'completed') {
      interval = setInterval(async () => {
        if (webcamRef.current && webcamRef.current.video && webcamRef.current.video.readyState === 4) {
          const video = webcamRef.current.video;
          const predictions = await faceModel.estimateFaces(video, false);

          if (predictions.length === 0) {
            if (lastFaceStatus.current !== 'absent') {
              lastFaceStatus.current = 'absent';
              handleViolation(`Warning: Face Not Detected! Please stay within the camera frame.`);
            }
            return;
          }
          if (predictions.length > 1) {
            if (lastFaceStatus.current !== 'multiple') {
              lastFaceStatus.current = 'multiple';
              handleViolation(`Warning: Multiple people detected! Ensure you are taking the interview alone.`);
            }
            return;
          }

          const landmarks = predictions[0].landmarks;
          let isTurned = false;
          if (landmarks) {
            const rightEye = landmarks[0];
            const leftEye = landmarks[1];
            const nose = landmarks[2];

            const eyeDist = Math.abs(rightEye[0] - leftEye[0]);
            const noseRightDist = Math.abs(nose[0] - rightEye[0]);
            const noseLeftDist = Math.abs(nose[0] - leftEye[0]);

            // Heuristic for looking strongly left or strongly right
            if (noseRightDist < eyeDist * 0.2 || noseLeftDist < eyeDist * 0.2) {
              isTurned = true;
            }
          }

          if (isTurned) {
            if (lastFaceStatus.current !== 'turned') {
              lastFaceStatus.current = 'turned';
              handleViolation(`Warning: Please look forward at the screen. Frequent looking away is not allowed.`);
            }
          } else {
            lastFaceStatus.current = 'normal'; // Reset face status when behaving normally
          }
        }
      }, 2000); // Check every 2 seconds
    }
    return () => { if (interval) clearInterval(interval); }
  }, [faceModel, camEnabled, isFullscreen, interview, handleViolation]);

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
    } else {
      setUserAnswer(''); // optional: clear previous or append
      recognitionRef.current?.start();
    }
    setIsRecording(!isRecording);
  };

  const submitAnswer = async () => {
    if (!userAnswer.trim()) return alert("Please provide an answer before submitting.");
    if (isRecording) toggleRecording();

    setIsSubmitting(true);
    try {
      const questionId = interview.questions[currentQIndex]._id;
      await axios.post('https://aivue-backend.onrender.com/api/interviews/answer', {
        interviewId: id,
        questionId,
        userAnswer
      }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });

      setUserAnswer('');
      if (currentQIndex < interview.questions.length - 1) {
        setCurrentQIndex(currentQIndex + 1);
      } else {
        // Finished
        isCompletedRef.current = true;
        await axios.put(`https://aivue-backend.onrender.com/api/interviews/${id}/complete`, {}, {
          headers: { Authorization: `Bearer ${user.token}` }
        }).catch(() => { });

        if (document.fullscreenElement) {
          document.exitFullscreen().catch(e => console.log(e));
        }
        setIsCompletedState(true);
      }
    } catch (error) {
      console.error(error);
      alert('Failed to submit answer');
    }
    setIsSubmitting(false);
  };

  const requestFullscreen = () => {
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {
        alert("Failed to enter fullscreen. Please enable it in your browser settings.");
      });
    }
  };

  if (!interview) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <Loader2 className="animate-spin text-indigo-600 mb-4" size={48} />
      <p className="text-gray-500 font-medium">Setting up your interview room...</p>
    </div>
  );

  if (isCompletedState) {
    return (
      <div className="min-h-screen bg-[#0B0F19] text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white/5 border border-white/10 p-10 rounded-3xl max-w-lg backdrop-blur-md animate-in fade-in zoom-in duration-500">
          <div className="w-20 h-20 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} />
          </div>
          <h2 className="text-3xl font-bold mb-4">Interview Completed</h2>
          <p className="text-gray-400 mb-8 leading-relaxed">
            Your test has been submitted successfully. Thank you for completing the interview. All your responses have been formally recorded and evaluated by the AI.
          </p>
          <button
            onClick={() => navigate(`/result/${id}`)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white w-full py-4 rounded-xl font-bold text-lg transition-all shadow-[0_0_20px_rgba(79,70,229,0.4)]"
          >
            View Your Results
          </button>
        </div>
      </div>
    );
  }

  if (!isFullscreen) {
    return (
      <div className="min-h-screen bg-[#0B0F19] text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white/5 border border-white/10 p-10 rounded-3xl max-w-lg backdrop-blur-md">
          <div className="w-16 h-16 bg-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Maximize size={32} />
          </div>
          <h2 className="text-2xl font-bold mb-4">Environment Setup Required</h2>
          <p className="text-gray-400 mb-8 leading-relaxed">
            To ensure a focused and distraction-free environment, this session must be completed in fullscreen mode.
            Additionally, your webcam will proactively monitor your head orientation and presence as an anti-cheating mechanism.
            All processing is done securely on your device. Exiting fullscreen, looking away frequently, or leaving the frame will result in a warning.
          </p>
          <button
            onClick={requestFullscreen}
            className="bg-indigo-600 hover:bg-indigo-700 text-white w-full py-4 rounded-xl font-bold text-lg transition-all shadow-[0_0_20px_rgba(79,70,229,0.4)]"
          >
            Enter Fullscreen & Continue
          </button>
        </div>
      </div>
    );
  }

  const currentQ = interview.questions[currentQIndex];

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white flex flex-col">
      {activeWarning && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#1a1f2e] border border-red-500/30 p-8 rounded-2xl max-w-md w-full shadow-[0_0_40px_rgba(239,68,68,0.2)] text-center animate-in fade-in zoom-in duration-200">
            <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle size={32} />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">Action Required</h2>
            <p className="text-gray-300 mb-8 leading-relaxed">
              {activeWarning.message}
            </p>
            <button
              onClick={dismissWarning}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-xl transition-colors"
            >
              {activeWarning.isTerminal ? "Finish Interview" : "I Understand"}
            </button>
          </div>
        </div>
      )}
      <header className="px-6 py-4 border-b border-white/10 flex justify-between items-center bg-black/20 backdrop-blur-md">
        <div className="font-bold text-xl text-indigo-400">AIVue Interview</div>
        <div className="text-sm border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 rounded-full text-indigo-300 font-medium">
          Question {currentQIndex + 1} of {interview.questions.length}
        </div>
      </header>

      <main className="flex-1 container mx-auto p-6 flex flex-col lg:flex-row gap-8">
        {/* Left Side - Video Loop & Status */}
        <div className="w-full lg:w-5/12 flex flex-col gap-6">
          <div className="bg-black border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative aspect-video flex-shrink-0">
            {camEnabled ? (
              <Webcam
                ref={webcamRef}
                audio={false}
                className="w-full h-full object-cover"
                mirrored={true}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900 border-white/5 border">
                <VideoOff size={48} className="text-gray-600 mb-4" />
                <p className="text-gray-500">Camera is disabled</p>
              </div>
            )}

            {isRecording && (
              <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/50 px-3 py-1.5 rounded-full backdrop-blur-md">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
                <span className="text-xs font-semibold text-red-100 uppercase tracking-wider">Recording</span>
              </div>
            )}

            <button
              onClick={() => setCamEnabled(!camEnabled)}
              className="absolute bottom-4 left-4 bg-black/50 hover:bg-black/70 p-2.5 rounded-full backdrop-blur-md transition-colors"
            >
              {camEnabled ? <VideoOff size={20} className="text-white" /> : <Camera size={20} className="text-white" />}
            </button>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
            <h3 className="font-semibold text-gray-300 mb-4 flex items-center gap-2 border-b border-white/10 pb-3">
              <CheckCircle2 size={18} className="text-indigo-400" /> Progress
            </h3>
            <div className="space-y-4">
              {interview.questions.map((q, idx) => (
                <div key={q._id || idx} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${idx < currentQIndex ? 'bg-green-500/20 text-green-400 border border-green-500/50' :
                      idx === currentQIndex ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/40' :
                        'bg-white/5 text-gray-500 border border-white/10'
                    }`}>
                    {idx + 1}
                  </div>
                  <div className={`text-sm ${idx === currentQIndex ? 'text-white font-medium' : 'text-gray-500'}`}>
                    {idx < currentQIndex ? 'Completed' : idx === currentQIndex ? 'In Progress' : 'Pending'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side - Question & Answer Input */}
        <div className="w-full lg:w-7/12 flex flex-col">
          <div className="bg-white/10 border border-white/20 rounded-3xl p-8 backdrop-blur-xl flex-1 flex flex-col shadow-[0_8px_32px_0_rgba(31,38,135,0.37)]">
            <h2 className="text-2xl font-semibold mb-6 leading-relaxed">
              {currentQ?.questionText}
            </h2>


            <div className="flex flex-col pt-4 mt-4">
              <label className="text-sm font-medium text-gray-400 mb-2">Your Answer Transcript</label>
              <textarea
                className="w-full h-64 bg-black/40 border border-white/10 rounded-2xl p-5 text-gray-100 text-lg leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all resize-none placeholder-gray-600"
                placeholder="Click the microphone to start speaking, or type your answer here..."
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
              />
            </div>

            <div className="mt-8 flex justify-between items-center gap-4 border-t border-white/10 pt-6">
              <button
                onClick={toggleRecording}
                className={`flex items-center gap-3 px-6 py-4 rounded-xl font-medium transition-all ${isRecording
                    ? 'bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30'
                    : 'bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10'
                  }`}
              >
                {isRecording ? <><MicOff size={22} /> Stop Recording</> : <><Mic size={22} /> Start Speaking</>}
              </button>

              <button
                onClick={submitAnswer}
                disabled={isSubmitting || !userAnswer.trim()}
                className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-600/30"
              >
                {isSubmitting ? <><Loader2 className="animate-spin" size={24} /> Analyzing...</> : <><Send size={20} /> Submit Answer</>}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
