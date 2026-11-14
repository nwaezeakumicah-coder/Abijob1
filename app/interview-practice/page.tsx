"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Logo from "../../components/Logo";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BarChart3,
  Bell,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  Clock3,
  Lightbulb,
  MessageSquareText,
  Play,
  RotateCcw,
  Sparkles,
  Target,
  UserRound,
  X,
} from "lucide-react";
import { createClient } from "../../lib/supabase/client";
import "./interview-practice.css";

type Question = {
  question: string;
  category: string;
  guidance: string;
  example: string;
};

type Session = {
  title: string;
  description: string;
  duration: string;
  questions: Question[];
};

type AccountRole = "job-seeker" | "professional" | "employer";

type SavedDraft = {
  selectedSession: number;
  jobTitle: string;
  experienceLevel: string;
  currentQuestion: number;
  answers: Record<number, string>;
  started: boolean;
  completed: boolean;
};

const sessions: Session[] = [
  {
    title: "General Job Interview",
    description: "Build confidence with common interview questions.",
    duration: "10–15 minutes",
    questions: [
      {
        category: "Introduction",
        question: "Tell me about yourself.",
        guidance:
          "Introduce your professional background, relevant skills and what you are looking for. Keep your answer focused on the role.",
        example:
          "I am a motivated professional with experience in my field. I enjoy solving problems, learning new skills and working with people. I am interested in this opportunity because it aligns with my strengths and career goals.",
      },
      {
        category: "Motivation",
        question: "Why do you want to work with our organisation?",
        guidance:
          "Show that you understand the organisation and connect its work to your interests and abilities.",
        example:
          "I am interested in your organisation because of the work you do and the opportunity to contribute meaningfully. I believe my skills and willingness to learn would allow me to add value to your team.",
      },
      {
        category: "Strengths",
        question: "What are your greatest strengths?",
        guidance:
          "Choose two or three strengths relevant to the position. Give a short example of how you use them.",
        example:
          "My key strengths are communication, problem-solving and adaptability. I work well with others, take responsibility for my tasks and remain open to feedback.",
      },
      {
        category: "Problem-solving",
        question: "Tell us about a challenge you faced and how you handled it.",
        guidance:
          "Describe the situation, what you needed to do, the action you took and the outcome. Use a real example.",
        example:
          "In a previous project, we had a tight deadline. I organised the tasks, communicated with the people involved and focused on the most important work first. We completed the project on time.",
      },
      {
        category: "Career goals",
        question: "Where do you see yourself in the next five years?",
        guidance:
          "Talk about realistic professional growth and how the opportunity fits into your development.",
        example:
          "I hope to have developed deeper expertise in my field, taken on more responsibility and become someone my team can rely on. I also want to keep learning and contributing to meaningful projects.",
      },
    ],
  },
  {
    title: "Customer Service Interview",
    description: "Practise communication and customer-care scenarios.",
    duration: "10–15 minutes",
    questions: [
      {
        category: "Customer care",
        question: "What does excellent customer service mean to you?",
        guidance:
          "Focus on listening, understanding customer needs, respectful communication and resolving issues.",
        example:
          "Excellent customer service means listening carefully, understanding what a customer needs and providing helpful solutions in a respectful and timely way.",
      },
      {
        category: "Conflict resolution",
        question: "How would you handle an angry customer?",
        guidance:
          "Explain how you would stay calm, listen without interrupting, acknowledge the concern and work towards a solution.",
        example:
          "I would remain calm, allow the customer to explain the issue and acknowledge their frustration. I would then clarify the problem and offer an appropriate solution within company policy.",
      },
      {
        category: "Communication",
        question: "How do you handle several customer requests at once?",
        guidance:
          "Explain how you prioritise urgent issues while maintaining accuracy and a professional attitude.",
        example:
          "I assess which requests are most urgent, communicate expected response times and handle each issue systematically so no customer is ignored.",
      },
      {
        category: "Teamwork",
        question:
          "How would you respond if you did not know the answer to a customer's question?",
        guidance:
          "Show honesty and a willingness to find accurate information rather than guessing.",
        example:
          "I would be honest that I need to confirm the information, then consult the right colleague or resource and get back to the customer promptly.",
      },
      {
        category: "Motivation",
        question: "Why should we hire you for this customer service role?",
        guidance:
          "Connect your communication skills, patience and reliability to the needs of the position.",
        example:
          "I communicate clearly, remain patient under pressure and take customer concerns seriously. I am also willing to learn your processes and represent the business professionally.",
      },
    ],
  },
  {
    title: "Entry-Level Interview",
    description: "Prepare for your first job or a new career opportunity.",
    duration: "10–15 minutes",
    questions: [
      {
        category: "Introduction",
        question: "Tell us about yourself and your educational background.",
        guidance:
          "Talk about your education, practical projects, interests and skills that relate to the opportunity.",
        example:
          "I recently completed my studies and have been developing practical skills through personal projects and learning opportunities. I am eager to apply what I have learned in a professional environment.",
      },
      {
        category: "Learning",
        question: "How do you learn a new skill or task?",
        guidance:
          "Explain your learning process and how you apply feedback and practice.",
        example:
          "I start by understanding the task, breaking it into smaller steps and practising. I ask questions when necessary and use feedback to improve.",
      },
      {
        category: "Adaptability",
        question: "How would you handle a task you have never done before?",
        guidance:
          "Demonstrate curiosity, responsibility and a practical approach to learning.",
        example:
          "I would clarify the expected result, learn the required process, ask for guidance where needed and complete the task carefully.",
      },
      {
        category: "Teamwork",
        question: "Describe how you work with other people.",
        guidance:
          "Use a real example from school, volunteering, training or a personal project.",
        example:
          "I value listening, sharing ideas and respecting different perspectives. In group projects, I communicate my progress and take responsibility for my part.",
      },
      {
        category: "Motivation",
        question:
          "What makes you a good candidate even without much work experience?",
        guidance:
          "Highlight transferable skills, practical learning, reliability and willingness to grow.",
        example:
          "Although I am still building formal work experience, I bring a willingness to learn, a responsible attitude and practical skills that I am ready to develop further.",
      },
    ],
  },
  {
    title: "Sales Interview",
    description: "Practise persuasion, customer relationships and targets.",
    duration: "10–15 minutes",
    questions: [
      {
        category: "Sales approach",
        question: "How would you convince a customer to buy a product?",
        guidance:
          "Explain how you identify the customer's needs and demonstrate relevant product value without pressuring them.",
        example:
          "I would first understand what the customer needs, then explain how the product addresses those needs. I would answer questions honestly and allow the customer to make an informed decision.",
      },
      {
        category: "Resilience",
        question: "How do you handle rejection?",
        guidance:
          "Show that you can learn from rejection, stay professional and maintain motivation.",
        example:
          "I treat rejection as an opportunity to learn. I reflect on the interaction, identify what I could improve and continue approaching the next opportunity positively.",
      },
      {
        category: "Targets",
        question: "How would you work towards a sales target?",
        guidance:
          "Discuss planning, daily activity, tracking results and adjusting your approach.",
        example:
          "I would break the target into smaller weekly and daily goals, maintain consistent customer outreach and review my progress so I can improve where necessary.",
      },
      {
        category: "Customer relationships",
        question: "How would you build trust with a new customer?",
        guidance:
          "Focus on honesty, listening, product knowledge and keeping promises.",
        example:
          "I would listen carefully, provide accurate information, avoid making promises I cannot keep and follow up when I say I will.",
      },
      {
        category: "Motivation",
        question: "Why are you interested in a sales career?",
        guidance:
          "Connect your interest in people, communication, business and measurable results.",
        example:
          "I enjoy communicating with people, understanding their needs and helping them find suitable solutions. I also appreciate the opportunity to improve through clear goals and feedback.",
      },
    ],
  },
];

const getAccountRole = (): AccountRole => {
  if (typeof window === "undefined") return "job-seeker";

  const possibleKeys = [
    "abijob-user",
    "abijob-current-user",
    "abijob-auth-user",
    "abijob-profile",
    "abijob-account",
  ];

  for (const key of possibleKeys) {
    const storedValue =
      localStorage.getItem(key) || sessionStorage.getItem(key);

    if (!storedValue) continue;

    let value: any = storedValue;

    try {
      value = JSON.parse(storedValue);
    } catch {
      // The stored value may simply be a role string.
    }

    const candidates = [
      value,
      value?.role,
      value?.accountType,
      value?.userType,
      value?.type,
      value?.user?.role,
      value?.user?.accountType,
      value?.profile?.role,
      value?.profile?.accountType,
    ];

    for (const candidate of candidates) {
      if (typeof candidate !== "string") continue;

      const role = candidate.toLowerCase().replace(/[_\s]/g, "-");

      if (role.includes("employer")) return "employer";

      if (
        role.includes("professional") ||
        role.includes("artisan") ||
        role.includes("skilled")
      ) {
        return "professional";
      }

      if (
        role.includes("job-seeker") ||
        role.includes("jobseeker") ||
        role.includes("seeker")
      ) {
        return "job-seeker";
      }
    }
  }

  return "job-seeker";
};

export default function InterviewPracticePage() {
  const [accountRole, setAccountRole] =
    useState<AccountRole>("job-seeker");

  const [isHydrated, setIsHydrated] = useState(false);
  const [userId, setUserId] = useState("");
  const [cloudReady, setCloudReady] = useState(false);

  const [selectedSession, setSelectedSession] = useState(0);
  const [jobTitle, setJobTitle] = useState("");
  const [experienceLevel, setExperienceLevel] =
    useState("Entry level");
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [started, setStarted] = useState(false);
  const [showGuidance, setShowGuidance] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [completed, setCompleted] = useState(false);

  const dashboardPath =
    accountRole === "professional"
      ? "/professional/dashboard"
      : accountRole === "employer"
        ? "/employer/dashboard"
        : "/dashboard";

  const profilePath =
    accountRole === "professional"
      ? "/professional/profile"
      : accountRole === "employer"
        ? "/employer/profile"
        : "/profile";

  const notificationsPath =
    accountRole === "professional"
      ? "/professional/notifications"
      : accountRole === "employer"
        ? "/employer/notifications"
        : "/notifications";

  const storageKey = `abijob-interview-practice-${accountRole}`;

  // Restore role and the most recent practice draft from Supabase, with local fallback.
  useEffect(() => {
    let active = true;

    async function restorePractice() {
      let detectedRole = getAccountRole();
      let authenticatedUserId = "";

      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          authenticatedUserId = user.id;
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .maybeSingle();

          if (profile?.role === "professional") detectedRole = "professional";
          else if (profile?.role === "job_seeker") detectedRole = "job-seeker";
          else if (profile?.role === "employer") detectedRole = "employer";
        }
      } catch (error) {
        console.warn("Interview cloud account lookup unavailable; using local backup:", error);
      }

      if (!active) return;
      setAccountRole(detectedRole);
      setUserId(authenticatedUserId);

      const localKey = `abijob-interview-practice-${detectedRole}`;
      const saved = localStorage.getItem(localKey);

      if (saved) {
        try {
          const draft: SavedDraft = JSON.parse(saved);
          if (
            Number.isInteger(draft.selectedSession) &&
            draft.selectedSession >= 0 &&
            draft.selectedSession < sessions.length
          ) {
            setSelectedSession(draft.selectedSession);
            setCurrentQuestion(Math.min(
              Math.max(draft.currentQuestion || 0, 0),
              sessions[draft.selectedSession].questions.length - 1
            ));
            setAnswers(draft.answers && typeof draft.answers === "object" ? draft.answers : {});
            setJobTitle(draft.jobTitle || "");
            setExperienceLevel(draft.experienceLevel || "Entry level");
            setStarted(Boolean(draft.started));
            setCompleted(Boolean(draft.completed));
          }
        } catch {
          localStorage.removeItem(localKey);
        }
      }

      if (authenticatedUserId && detectedRole !== "employer") {
        try {
          const supabase = createClient();
          const { data: cloudDraft, error } = await supabase
            .from("interview_practice_sessions")
            .select("selected_session, job_title, experience_level, current_question, answers, started, completed, updated_at")
            .eq("user_id", authenticatedUserId)
            .order("updated_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (error) throw error;

          if (cloudDraft && Number.isInteger(cloudDraft.selected_session)) {
            const sessionIndex = Math.min(Math.max(cloudDraft.selected_session, 0), sessions.length - 1);
            setSelectedSession(sessionIndex);
            setCurrentQuestion(Math.min(
              Math.max(cloudDraft.current_question || 0, 0),
              sessions[sessionIndex].questions.length - 1
            ));
            setAnswers(cloudDraft.answers && typeof cloudDraft.answers === "object" ? cloudDraft.answers : {});
            setJobTitle(cloudDraft.job_title || "");
            setExperienceLevel(cloudDraft.experience_level || "Entry level");
            setStarted(Boolean(cloudDraft.started));
            setCompleted(Boolean(cloudDraft.completed));
          }
        } catch (error) {
          console.warn("Interview cloud progress could not be loaded; using browser backup:", error);
        }
      }

      if (active) {
        setCloudReady(true);
        setIsHydrated(true);
      }
    }

    void restorePractice();
    return () => { active = false; };
  }, []);

  // Save a local recovery copy and sync each practice type to the user's private cloud history.
  useEffect(() => {
    if (!isHydrated || !cloudReady || accountRole === "employer") return;

    const draft: SavedDraft = {
      selectedSession,
      jobTitle,
      experienceLevel,
      currentQuestion,
      answers,
      started,
      completed,
    };

    try {
      localStorage.setItem(storageKey, JSON.stringify(draft));
    } catch (error) {
      console.warn("Interview local backup could not be saved:", error);
    }

    if (!userId) return;

    const timeout = window.setTimeout(() => {
      void (async () => {
        try {
          const supabase = createClient();
          const { error } = await supabase
            .from("interview_practice_sessions")
            .upsert({
              user_id: userId,
              account_role: accountRole === "professional" ? "professional" : "job_seeker",
              selected_session: selectedSession,
              job_title: jobTitle,
              experience_level: experienceLevel,
              current_question: currentQuestion,
              answers,
              started,
              completed,
              updated_at: new Date().toISOString(),
            }, { onConflict: "user_id,selected_session" });

          if (error) throw error;
        } catch (error) {
          console.warn("Interview cloud autosave failed; local progress is preserved:", error);
        }
      })();
    }, 650);

    return () => window.clearTimeout(timeout);
  }, [
    isHydrated, cloudReady, accountRole, storageKey, userId,
    selectedSession, jobTitle, experienceLevel, currentQuestion,
    answers, started, completed,
  ]);

  const session = sessions[selectedSession];
  const question = session.questions[currentQuestion];
  const answer = answers[currentQuestion] || "";

  const answeredCount = useMemo(
    () =>
      Object.values(answers).filter(
        (item) => item.trim().length > 0
      ).length,
    [answers]
  );

  const progress = Math.round(
    (answeredCount / session.questions.length) * 100
  );

  const questionProgress = Math.round(
    ((currentQuestion + 1) / session.questions.length) * 100
  );

  const wordCount = answer.trim()
    ? answer.trim().split(/\s+/).length
    : 0;

  const startSession = () => {
    setAnswers({});
    setCurrentQuestion(0);
    setShowGuidance(false);
    setShowFeedback(false);
    setCompleted(false);
    setStarted(true);
  };

  const chooseSession = (index: number) => {
    setSelectedSession(index);
    setStarted(false);
    setAnswers({});
    setCurrentQuestion(0);
    setCompleted(false);
    setShowFeedback(false);
    setShowGuidance(false);
  };

  const goNext = () => {
    setShowFeedback(false);
    setShowGuidance(false);

    if (currentQuestion < session.questions.length - 1) {
      setCurrentQuestion((current) => current + 1);
    } else {
      setCompleted(true);
    }
  };

  const goPrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((current) => current - 1);
      setShowFeedback(false);
      setShowGuidance(false);
    }
  };

  const getFeedback = () => {
    if (!answer.trim()) return;
    setShowFeedback(true);
    setShowGuidance(false);
  };

  const restartSession = () => {
    setAnswers({});
    setCurrentQuestion(0);
    setStarted(false);
    setCompleted(false);
    setShowFeedback(false);
    setShowGuidance(false);
  };

  // Do not expose the Job Seeker / Professional career workspace to Employers.
  if (isHydrated && accountRole === "employer") {
    return (
      <main className="interview-page">
        <header className="interview-topbar">
          <div className="interview-topbar-inner">
            <Link
              href="/employer/dashboard"
              className="interview-back-link"
            >
              <ArrowLeft size={17} />
              <span>Employer dashboard</span>
            </Link>

            <Logo href="/" />

            <div className="interview-top-actions">
              <Link
                href="/employer/notifications"
                className="interview-notification"
                aria-label="Notifications"
              >
                <Bell size={19} />
              </Link>

              <Link
                href="/employer/profile"
                className="interview-profile-link"
              >
                <span className="interview-profile-avatar">U</span>
                <span>My profile</span>
              </Link>
            </div>
          </div>
        </header>

        <section className="interview-restricted">
          <div className="interview-restricted-icon">
            <BriefcaseBusiness size={32} />
          </div>

          <span className="interview-section-kicker">
            EMPLOYER WORKSPACE
          </span>

          <h1>This career tool is not part of your workspace.</h1>

          <p>
            Interview Practice is designed for Job Seekers and Skilled
            Professionals & Artisans preparing for employment opportunities.
            You can continue managing your recruitment activities from your
            Employer dashboard.
          </p>

          <Link
            href="/employer/dashboard"
            className="interview-primary-link"
          >
            Return to Employer dashboard
            <ArrowRight size={16} />
          </Link>
        </section>

        <footer className="interview-footer">
          <span>© 2026 Abi Job. Opportunity starts here.</span>
          <span>Connecting talent with opportunity.</span>
        </footer>
      </main>
    );
  }

  return (
    <main className="interview-page">
      <header className="interview-topbar">
        <div className="interview-topbar-inner">
          <Link href={dashboardPath} className="interview-back-link">
            <ArrowLeft size={17} />
            <span>Dashboard</span>
          </Link>

          <Logo href="/" />

          <div className="interview-top-actions">
            <Link
              href={notificationsPath}
              className="interview-notification"
              aria-label="Notifications"
            >
              <Bell size={19} />
            </Link>

            <Link href={profilePath} className="interview-profile-link">
              <span className="interview-profile-avatar">U</span>
              <span>My profile</span>
            </Link>
          </div>
        </div>
      </header>

      <section className="interview-hero">
        <div className="interview-hero-copy">
          <span className="interview-eyebrow">
            <Sparkles size={15} />
            ABI JOB CAREER TOOLS
          </span>

          <h1>Walk into your next interview with confidence.</h1>

          <p>
            Practise common interview questions, organise your thoughts and
            learn how to present your skills to employers.
          </p>

          <div className="interview-hero-points">
            <span>
              <CheckCircle2 size={15} /> Role-based questions
            </span>
            <span>
              <CheckCircle2 size={15} /> Guided answer tips
            </span>
            <span>
              <CheckCircle2 size={15} /> Practice at your pace
            </span>
          </div>
        </div>

        <div className="interview-hero-art" aria-hidden="true">
          <div className="interview-art-ring interview-art-ring-one" />
          <div className="interview-art-ring interview-art-ring-two" />

          <div className="interview-art-card">
            <div className="interview-art-card-top">
              <span>
                <MessageSquareText size={18} />
              </span>
              <span>INTERVIEW PRACTICE</span>
            </div>

            <div className="interview-art-person">
              <UserRound size={44} />
            </div>

            <div className="interview-art-lines">
              <i />
              <i />
              <i />
            </div>

            <div className="interview-art-check">
              <CheckCircle2 size={17} />
              You're getting ready!
            </div>
          </div>

          <div className="interview-art-sparkle">
            <Sparkles size={25} />
          </div>
        </div>
      </section>

      <div className="interview-content">
        <section className="interview-main-column">
          {!started ? (
            <>
              <div className="interview-section-heading">
                <div>
                  <span className="interview-section-kicker">
                    GET PREPARED
                  </span>
                  <h2>Choose your practice session</h2>
                  <p>
                    Select the type of interview you want to practise today.
                  </p>
                </div>
              </div>

              <div className="interview-session-grid">
                {sessions.map((item, index) => (
                  <button
                    type="button"
                    key={item.title}
                    className={`interview-session-card ${
                      selectedSession === index ? "selected" : ""
                    }`}
                    onClick={() => chooseSession(index)}
                  >
                    <span
                      className={`interview-session-icon session-icon-${index}`}
                    >
                      {index === 0 ? (
                        <BriefcaseBusiness size={21} />
                      ) : index === 1 ? (
                        <MessageSquareText size={21} />
                      ) : index === 2 ? (
                        <UserRound size={21} />
                      ) : (
                        <Target size={21} />
                      )}
                    </span>

                    <span className="interview-session-check">
                      {selectedSession === index && <Check size={13} />}
                    </span>

                    <strong>{item.title}</strong>
                    <small>{item.description}</small>

                    <span className="interview-session-meta">
                      <Clock3 size={13} />
                      {item.duration}
                      <span>·</span>
                      {item.questions.length} questions
                    </span>

                    <span className="interview-session-select">
                      {selectedSession === index
                        ? "Selected"
                        : "Choose session"}
                      <ArrowRight size={14} />
                    </span>
                  </button>
                ))}
              </div>

              <div className="interview-setup-card">
                <div className="interview-setup-heading">
                  <span className="interview-setup-icon">
                    <Target size={19} />
                  </span>

                  <div>
                    <h3>Personalise your practice</h3>
                    <p>
                      Add a little information to make your session more
                      relevant.
                    </p>
                  </div>
                </div>

                <div className="interview-setup-fields">
                  <label>
                    <span>Job title you're preparing for</span>
                    <input
                      value={jobTitle}
                      onChange={(event) => setJobTitle(event.target.value)}
                      placeholder="e.g. Frontend Developer, Sales Assistant"
                    />
                  </label>

                  <label>
                    <span>Your experience level</span>

                    <span className="interview-select-wrap">
                      <select
                        value={experienceLevel}
                        onChange={(event) =>
                          setExperienceLevel(event.target.value)
                        }
                      >
                        <option>Entry level</option>
                        <option>Less than 2 years</option>
                        <option>2–5 years</option>
                        <option>5+ years</option>
                      </select>

                      <ChevronDown size={16} />
                    </span>
                  </label>
                </div>

                <div className="interview-setup-footer">
                  <span>
                    <Lightbulb size={15} />
                    You can practise without a job title too.
                  </span>

                  <button type="button" onClick={startSession}>
                    <Play size={16} fill="currentColor" />
                    Start practising
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            </>
          ) : completed ? (
            <div className="interview-complete-card">
              <div className="interview-complete-icon">
                <Award size={35} />
              </div>

              <span className="interview-section-kicker">
                SESSION COMPLETED
              </span>

              <h2>Well done. You've completed your practice!</h2>

              <p>
                You worked through the {session.title.toLowerCase()} session.
                Keep practising and refining your answers before your next
                real interview.
              </p>

              <div className="interview-complete-stats">
                <div>
                  <strong>{session.questions.length}</strong>
                  <span>Questions covered</span>
                </div>

                <div>
                  <strong>{answeredCount}</strong>
                  <span>Answers written</span>
                </div>

                <div>
                  <strong>{progress}%</strong>
                  <span>Answer completion</span>
                </div>
              </div>

              <div className="interview-complete-actions">
                <button
                  type="button"
                  onClick={restartSession}
                  className="interview-secondary-button"
                >
                  <RotateCcw size={16} />
                  Practise again
                </button>

                <Link href="/cv-builder" className="interview-primary-link">
                  Improve your CV <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          ) : (
            <div className="interview-practice-card">
              <div className="interview-practice-top">
                <button
                  type="button"
                  className="interview-exit-button"
                  onClick={restartSession}
                >
                  <X size={17} />
                  Exit session
                </button>

                <span>{session.title}</span>
              </div>

              <div className="interview-question-progress">
                <div>
                  <span>
                    QUESTION {currentQuestion + 1} OF{" "}
                    {session.questions.length}
                  </span>

                  <strong>{questionProgress}% through session</strong>
                </div>

                <div className="interview-progress-track">
                  <span style={{ width: `${questionProgress}%` }} />
                </div>
              </div>

              <div className="interview-question-content">
                <span className="interview-question-category">
                  {question.category}
                </span>

                <h2>{question.question}</h2>

                <p>
                  {jobTitle
                    ? `Think about how your ${experienceLevel.toLowerCase()} experience relates to a ${jobTitle} position.`
                    : `Think about how your ${experienceLevel.toLowerCase()} experience relates to this question.`}
                </p>
              </div>

              <label className="interview-answer-label">
                <span>Your answer</span>

                <textarea
                  rows={8}
                  value={answer}
                  onChange={(event) => {
                    setAnswers((current) => ({
                      ...current,
                      [currentQuestion]: event.target.value,
                    }));
                  }}
                  placeholder="Write your answer here. Try to use a real example from your experience..."
                />

                <small>{wordCount} words</small>
              </label>

              <div className="interview-practice-tools">
                <button
                  type="button"
                  className="interview-guidance-button"
                  onClick={() => {
                    setShowGuidance(!showGuidance);
                    setShowFeedback(false);
                  }}
                >
                  <Lightbulb size={16} />
                  {showGuidance ? "Hide guidance" : "Show answer tips"}
                </button>

                <button
                  type="button"
                  className="interview-feedback-button"
                  onClick={getFeedback}
                  disabled={!answer.trim()}
                >
                  <CheckCircle2 size={16} />
                  Review my answer
                </button>
              </div>

              {showGuidance && (
                <div className="interview-guidance-panel">
                  <div>
                    <Lightbulb size={18} />
                    <strong>Tips for answering</strong>
                  </div>

                  <p>{question.guidance}</p>
                </div>
              )}

              {showFeedback && (
                <div className="interview-feedback-panel">
                  <div>
                    <CheckCircle2 size={18} />
                    <strong>Your answer review</strong>
                  </div>

                  <strong>Your self-review checklist</strong>

                  <p>
                    Read your answer again and check each of these points
                    before moving on:
                  </p>

                  <ul className="interview-review-checklist">
                    <li>
                      <CheckCircle2 size={15} />
                      Does your answer directly address the question?
                    </li>
                    <li>
                      <CheckCircle2 size={15} />
                      Have you included a real example where appropriate?
                    </li>
                    <li>
                      <CheckCircle2 size={15} />
                      Is your explanation clear and easy to follow?
                    </li>
                    <li>
                      <CheckCircle2 size={15} />
                      Have you explained the result or value you contributed?
                    </li>
                  </ul>

                  <div className="interview-example-answer">
                    <span>Example answer structure</span>
                    <p>{question.example}</p>
                  </div>

                  <small>
                    Use this checklist to assess your own answer. Keep examples truthful and avoid sharing sensitive personal information.
                  </small>
                </div>
              )}

              <div className="interview-question-navigation">
                <button
                  type="button"
                  onClick={goPrevious}
                  disabled={currentQuestion === 0}
                  className="interview-previous-button"
                >
                  <ChevronLeft size={17} />
                  Previous
                </button>

                <button
                  type="button"
                  onClick={goNext}
                  className="interview-next-button"
                >
                  {currentQuestion === session.questions.length - 1
                    ? "Finish session"
                    : "Next question"}
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}
        </section>

        <aside className="interview-side-column">
          <div className="interview-progress-card">
            <div className="interview-side-card-heading">
              <span className="interview-side-icon">
                <BarChart3 size={19} />
              </span>

              <div>
                <h3>Your practice</h3>
                <p>Progress in this session</p>
              </div>
            </div>

            <div className="interview-progress-number">
              <strong>{progress}%</strong>
              <span>answers completed</span>
            </div>

            <div className="interview-progress-track">
              <span style={{ width: `${progress}%` }} />
            </div>

            <div className="interview-progress-details">
              <span>Answers written</span>
              <strong>
                {answeredCount} of {session.questions.length}
              </strong>
            </div>

            <div className="interview-progress-details">
              <span>Questions remaining</span>
              <strong>{session.questions.length - answeredCount}</strong>
            </div>
          </div>

          <div className="interview-tips-card">
            <span className="interview-tips-label">
              <Sparkles size={14} />
              INTERVIEW TIPS
            </span>

            <h3>Give answers that employers remember.</h3>

            <ul>
              <li>
                <CheckCircle2 size={15} />
                Listen carefully to each question.
              </li>

              <li>
                <CheckCircle2 size={15} />
                Use real examples from your experience.
              </li>

              <li>
                <CheckCircle2 size={15} />
                Be clear, honest and confident.
              </li>

              <li>
                <CheckCircle2 size={15} />
                Practise speaking your answers aloud.
              </li>
            </ul>
          </div>

          <div className="interview-cv-promo">
            <span className="interview-cv-promo-icon">
              <BriefcaseBusiness size={20} />
            </span>

            <h3>Is your CV ready too?</h3>

            <p>
              Make sure your CV communicates the skills and experience you
              plan to discuss.
            </p>

            <Link href="/cv-builder">
              Open CV Builder <ArrowRight size={15} />
            </Link>
          </div>

          <div className="interview-side-links">
            <Link href="/jobs">
              Explore job opportunities <ArrowRight size={14} />
            </Link>

            <Link href={dashboardPath}>
              Return to dashboard <ArrowRight size={14} />
            </Link>
          </div>
        </aside>
      </div>

      <footer className="interview-footer">
        <span>© 2026 Abi Job. Opportunity starts here.</span>
        <span>Prepare today. Show up confidently tomorrow.</span>
      </footer>
    </main>
  );
}