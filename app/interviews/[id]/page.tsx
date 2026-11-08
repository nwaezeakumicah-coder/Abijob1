"use client";

import {
  FormEvent,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Interview = {
  id: string;
  application_id: string;
  employer_id: string;
  applicant_id: string;
  scheduled_at: string;
  duration_minutes: number;
  interview_type: string;
  meeting_link: string | null;
  location: string | null;
  notes: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

type InterviewMessage = {
  id: string;
  interview_id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

function InterviewRoomContent() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const interviewId = params.id;

  const supabase = useMemo(() => createClient(), []);

  const [userId, setUserId] = useState("");
  const [interview, setInterview] = useState<Interview | null>(null);
  const [messages, setMessages] = useState<InterviewMessage[]>([]);
  const [messageText, setMessageText] = useState("");

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isParticipant =
    !!userId &&
    !!interview &&
    (interview.employer_id === userId ||
      interview.applicant_id === userId);

  const isLiveRoom = interview?.interview_type === "live_chat";

  const canSendMessages =
    isParticipant &&
    !!interview &&
    (interview.status === "scheduled" ||
      interview.status === "rescheduled");

  const isEmployer =
    !!userId && !!interview && interview.employer_id === userId;

  const backPath = isEmployer
    ? "/employer/interviews"
    : "/applications";

  const formatDate = (value: string) => {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "Date unavailable";
    }

    return date.toLocaleString("en-NG", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const formatTime = (value: string) => {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    return date.toLocaleTimeString("en-NG", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const safeMeetingUrl = (value: string | null) => {
    if (!value) return null;

    try {
      const url = new URL(value);

      if (
        url.protocol !== "https:" ||
        url.username ||
        url.password
      ) {
        return null;
      }

      return url.toString();
    } catch {
      return null;
    }
  };

  const loadMessages = useCallback(async () => {
    if (!interviewId) return;

    const { data, error: messageError } = await supabase
      .from("interview_messages")
      .select("id, interview_id, sender_id, body, created_at")
      .eq("interview_id", interviewId)
      .order("created_at", { ascending: true });

    if (messageError) {
      setError("Unable to load interview messages. Please refresh.");
      return;
    }

    setMessages((data || []) as InterviewMessage[]);
  }, [interviewId, supabase]);

  useEffect(() => {
    let active = true;

    async function initializeRoom() {
      setLoading(true);
      setError("");

      if (!interviewId) {
        setError("Invalid interview address.");
        setLoading(false);
        return;
      }

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (!active) return;

      if (authError || !user) {
        router.replace("/login");
        return;
      }

      setUserId(user.id);

      const { data, error: interviewError } = await supabase
        .from("interviews")
        .select(
          `
            id,
            application_id,
            employer_id,
            applicant_id,
            scheduled_at,
            duration_minutes,
            interview_type,
            meeting_link,
            location,
            notes,
            status,
            created_at,
            updated_at
          `
        )
        .eq("id", interviewId)
        .maybeSingle();

      if (!active) return;

      if (interviewError || !data) {
        setError(
          "This interview could not be found, or you do not have permission to access it."
        );
        setLoading(false);
        return;
      }

      const currentInterview = data as Interview;

      if (
        currentInterview.employer_id !== user.id &&
        currentInterview.applicant_id !== user.id
      ) {
        setError("You are not authorized to access this interview.");
        setLoading(false);
        return;
      }

      setInterview(currentInterview);

      const { data: messageData, error: messageError } =
        await supabase
          .from("interview_messages")
          .select("id, interview_id, sender_id, body, created_at")
          .eq("interview_id", interviewId)
          .order("created_at", { ascending: true });

      if (!active) return;

      if (messageError) {
        setError("The interview opened, but its messages could not load.");
      } else {
        setMessages((messageData || []) as InterviewMessage[]);
      }

      setLoading(false);
    }

    initializeRoom();

    return () => {
      active = false;
    };
  }, [interviewId, router, supabase]);

  useEffect(() => {
    if (!interviewId || !isParticipant || !isLiveRoom) return;

    const channel = supabase
      .channel(`interview-room-${interviewId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "interview_messages",
          filter: `interview_id=eq.${interviewId}`,
        },
        (payload) => {
          const incoming = payload.new as InterviewMessage;

          if (!incoming?.id) return;

          setMessages((previous) => {
            if (previous.some((item) => item.id === incoming.id)) {
              return previous;
            }

            return [...previous, incoming].sort(
              (a, b) =>
                new Date(a.created_at).getTime() -
                new Date(b.created_at).getTime()
            );
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [interviewId, isParticipant, isLiveRoom, supabase]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages]);

  async function handleSendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const body = messageText.trim();

    if (!body) return;

    if (body.length > 10000) {
      setError("Your message cannot exceed 10,000 characters.");
      return;
    }

    if (!userId || !interview || !canSendMessages) {
      setError("This interview is not currently accepting messages.");
      return;
    }

    if (sending) return;

    setSending(true);
    setError("");

    const { data, error: insertError } = await supabase
      .from("interview_messages")
      .insert({
        interview_id: interview.id,
        sender_id: userId,
        body,
      })
      .select("id, interview_id, sender_id, body, created_at")
      .single();

    if (insertError) {
      setError(
        "Your message could not be sent. Check your connection and try again."
      );
      setSending(false);
      return;
    }

    const savedMessage = data as InterviewMessage;

    setMessages((previous) => {
      if (previous.some((item) => item.id === savedMessage.id)) {
        return previous;
      }

      return [...previous, savedMessage];
    });

    setMessageText("");
    setSending(false);
  }

  function getStatusLabel(status: string) {
    switch (status) {
      case "scheduled":
        return "Scheduled";
      case "rescheduled":
        return "Rescheduled";
      case "completed":
        return "Completed";
      case "cancelled":
        return "Cancelled";
      default:
        return status;
    }
  }

  if (loading) {
    return (
      <main className="room-loading">
        <div className="room-spinner" />
        <p>Loading your interview room...</p>

        <style jsx>{`
          .room-loading {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 15px;
            background: #f5f7f3;
            color: #244c36;
            font-family: Arial, sans-serif;
          }

          .room-spinner {
            width: 35px;
            height: 35px;
            border: 3px solid #dce7dd;
            border-top-color: #176b45;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
          }

          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </main>
    );
  }

  if (error && !interview) {
    return (
      <main className="room-error-page">
        <div className="room-error-card">
          <div className="room-error-icon">!</div>
          <h1>Interview unavailable</h1>
          <p>{error}</p>

          <button onClick={() => router.push(backPath)}>
            Return to applications
          </button>
        </div>

        <style jsx>{`
          .room-error-page {
            min-height: 100vh;
            display: grid;
            place-items: center;
            padding: 24px;
            background: #f5f7f3;
            font-family: Arial, sans-serif;
          }

          .room-error-card {
            width: 100%;
            max-width: 440px;
            padding: 35px;
            background: white;
            border: 1px solid #e4eae3;
            border-radius: 16px;
            text-align: center;
          }

          .room-error-icon {
            width: 48px;
            height: 48px;
            display: grid;
            place-items: center;
            margin: 0 auto 18px;
            border-radius: 50%;
            background: #fff0ed;
            color: #b42318;
            font-size: 25px;
            font-weight: 700;
          }

          h1 {
            margin: 0 0 12px;
            color: #183b29;
            font-size: 23px;
          }

          p {
            color: #66736a;
            line-height: 1.7;
          }

          button {
            margin-top: 15px;
            padding: 12px 20px;
            border: 0;
            border-radius: 8px;
            background: #176b45;
            color: white;
            font-weight: 600;
            cursor: pointer;
          }
        `}</style>
      </main>
    );
  }

  if (!interview || !isParticipant) {
    return null;
  }

  const meetingUrl = safeMeetingUrl(interview.meeting_link);

  return (
    <main className="interview-room">
      <header className="room-header">
        <div className="header-inner">
          <button
            className="back-button"
            onClick={() => router.push(backPath)}
          >
            ← Back
          </button>

          <div className="brand">
            <span className="brand-mark">a.</span>
            <span>Abi Job</span>
          </div>

          <span className="private-label">
            <span className="private-dot" />
            Private interview
          </span>
        </div>
      </header>

      <div className="room-container">
        <section className="interview-summary">
          <div>
            <span className="eyebrow">INTERVIEW DETAILS</span>
            <h1>
              {isLiveRoom ? "Abi Job Live Interview" : "Interview Details"}
            </h1>
            <p className="summary-description">
              Your interview information and communication space.
            </p>
          </div>

          <span className={`status-pill status-${interview.status}`}>
            {getStatusLabel(interview.status)}
          </span>
        </section>

        <section className="details-card">
          <div className="detail-item">
            <span className="detail-label">Date and time</span>
            <strong>{formatDate(interview.scheduled_at)}</strong>
          </div>

          <div className="detail-item">
            <span className="detail-label">Duration</span>
            <strong>{interview.duration_minutes} minutes</strong>
          </div>

          <div className="detail-item">
            <span className="detail-label">Interview method</span>
            <strong>
              {interview.interview_type === "live_chat"
                ? "Abi Job Live Room"
                : interview.interview_type === "online"
                  ? "Online meeting"
                  : interview.interview_type === "in_person"
                    ? "In-person"
                    : "Phone"}
            </strong>
          </div>

          {interview.location && (
            <div className="detail-item">
              <span className="detail-label">Location</span>
              <strong>{interview.location}</strong>
            </div>
          )}

          {interview.notes && (
            <div className="interview-instructions">
              <span className="detail-label">Interview instructions</span>
              <p>{interview.notes}</p>
            </div>
          )}

          {interview.interview_type === "online" && (
            <div className="meeting-link-section">
              <span className="detail-label">Meeting link</span>

              {meetingUrl ? (
                <a
                  href={meetingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open meeting link ↗
                </a>
              ) : (
                <p className="muted-text">
                  No valid HTTPS meeting link is available. Contact the
                  employer.
                </p>
              )}
            </div>
          )}
        </section>

        {isLiveRoom ? (
          <section className="chat-card">
            <div className="chat-heading">
              <div>
                <span className="eyebrow">REAL-TIME COMMUNICATION</span>
                <h2>Interview conversation</h2>
                <p>
                  Messages are private to the employer and invited
                  applicant.
                </p>
              </div>

              <span className="live-indicator">
                <span />
                Live room
              </span>
            </div>

            <div className="message-list">
              {messages.length === 0 ? (
                <div className="empty-chat">
                  <div className="empty-chat-icon">✉</div>
                  <h3>No messages yet</h3>
                  <p>
                    Start the interview conversation by sending a
                    message below.
                  </p>
                </div>
              ) : (
                messages.map((message) => {
                  const ownMessage = message.sender_id === userId;

                  return (
                    <div
                      key={message.id}
                      className={`message-row ${
                        ownMessage ? "message-own" : "message-other"
                      }`}
                    >
                      <div className="message-content">
                        <div className="message-sender">
                          {ownMessage
                            ? "You"
                            : isEmployer
                              ? "Applicant"
                              : "Employer"}
                        </div>

                        <div className="message-bubble">
                          {message.body}
                        </div>

                        <time className="message-time">
                          {formatTime(message.created_at)}
                        </time>
                      </div>
                    </div>
                  );
                })
              )}

              <div ref={messagesEndRef} />
            </div>

            {error && interview && (
              <div className="room-alert room-alert-error">
                {error}
              </div>
            )}

            {canSendMessages ? (
              <form
                className="message-form"
                onSubmit={handleSendMessage}
              >
                <textarea
                  value={messageText}
                  onChange={(event) =>
                    setMessageText(event.target.value)
                  }
                  placeholder="Type your interview message..."
                  maxLength={10000}
                  rows={3}
                  disabled={sending}
                  aria-label="Interview message"
                />

                <div className="composer-footer">
                  <span>
                    {messageText.length.toLocaleString()} / 10,000
                  </span>

                  <button
                    type="submit"
                    disabled={sending || !messageText.trim()}
                  >
                    {sending ? "Sending..." : "Send message"}
                    <span>➤</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="closed-room">
                <strong>
                  {interview.status === "completed"
                    ? "This interview has been completed."
                    : interview.status === "cancelled"
                      ? "This interview has been cancelled."
                      : "Messaging is currently unavailable."}
                </strong>
                <p>
                  You can still read the previous interview messages.
                </p>
              </div>
            )}
          </section>
        ) : (
          <section className="method-notice">
            <h2>This is not a Live Room interview</h2>
            <p>
              Use the interview method and meeting details provided
              above. Live messaging is available for interviews
              scheduled with the Abi Job Live Room method.
            </p>
          </section>
        )}
      </div>

      <style jsx>{`
        .interview-room {
          min-height: 100vh;
          background: #f4f7f3;
          color: #1c3023;
          font-family: Arial, Helvetica, sans-serif;
        }

        .room-header {
          background: #103c2b;
          color: white;
        }

        .header-inner {
          max-width: 1180px;
          min-height: 72px;
          margin: 0 auto;
          padding: 0 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
        }

        .back-button {
          border: 0;
          background: transparent;
          color: #e4eee7;
          font-size: 14px;
          cursor: pointer;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 9px;
          font-size: 19px;
          font-weight: 700;
          letter-spacing: -0.5px;
        }

        .brand-mark {
          display: grid;
          place-items: center;
          width: 33px;
          height: 33px;
          border-radius: 9px;
          background: #d7f078;
          color: #103c2b;
          font-size: 21px;
        }

        .private-label {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #d7e6dc;
          font-size: 12px;
        }

        .private-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #d7f078;
        }

        .room-container {
          width: min(100% - 40px, 1000px);
          margin: 0 auto;
          padding: 42px 0 70px;
        }

        .interview-summary {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 25px;
        }

        .eyebrow {
          color: #62806b;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 1.3px;
        }

        h1 {
          margin: 10px 0 8px;
          color: #153b28;
          font-size: clamp(25px, 4vw, 34px);
          letter-spacing: -1px;
        }

        .summary-description {
          margin: 0;
          color: #718076;
          font-size: 14px;
          line-height: 1.6;
        }

        .status-pill {
          padding: 8px 13px;
          border-radius: 30px;
          background: #e5f3e8;
          color: #176b45;
          font-size: 12px;
          font-weight: 700;
          white-space: nowrap;
        }

        .status-completed {
          background: #e9edf0;
          color: #52616b;
        }

        .status-cancelled {
          background: #fff0ed;
          color: #b42318;
        }

        .status-rescheduled {
          background: #fff5df;
          color: #8a5a00;
        }

        .details-card,
        .chat-card,
        .method-notice {
          border: 1px solid #e3eae2;
          border-radius: 15px;
          background: white;
          box-shadow: 0 5px 20px rgba(23, 58, 37, 0.035);
        }

        .details-card {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 25px;
          padding: 27px;
          margin-bottom: 25px;
        }

        .detail-item {
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 9px;
        }

        .detail-label {
          color: #7b897f;
          font-size: 12px;
          font-weight: 600;
        }

        .detail-item strong {
          color: #263d2e;
          font-size: 14px;
          line-height: 1.6;
          overflow-wrap: anywhere;
        }

        .interview-instructions,
        .meeting-link-section {
          grid-column: 1 / -1;
          padding-top: 19px;
          border-top: 1px solid #edf0ec;
        }

        .interview-instructions p {
          margin: 9px 0 0;
          color: #4f6054;
          font-size: 14px;
          line-height: 1.8;
          white-space: pre-wrap;
          overflow-wrap: anywhere;
        }

        .meeting-link-section a {
          display: inline-block;
          margin-top: 9px;
          color: #176b45;
          font-size: 14px;
          font-weight: 700;
          text-decoration: none;
        }

        .meeting-link-section a:hover {
          text-decoration: underline;
        }

        .muted-text {
          color: #78857c;
          font-size: 13px;
        }

        .chat-card {
          overflow: hidden;
        }

        .chat-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          padding: 25px 28px;
          border-bottom: 1px solid #edf0ec;
        }

        h2 {
          margin: 8px 0 6px;
          color: #183b29;
          font-size: 21px;
        }

        .chat-heading p {
          margin: 0;
          color: #77847a;
          font-size: 13px;
          line-height: 1.6;
        }

        .live-indicator {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 8px 11px;
          border-radius: 30px;
          background: #eaf5eb;
          color: #176b45;
          font-size: 11px;
          font-weight: 700;
          white-space: nowrap;
        }

        .live-indicator span {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #219653;
        }

        .message-list {
          min-height: 300px;
          max-height: 520px;
          overflow-y: auto;
          padding: 25px 28px;
          background: #fbfcfa;
        }

        .empty-chat {
          min-height: 250px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
        }

        .empty-chat-icon {
          width: 50px;
          height: 50px;
          display: grid;
          place-items: center;
          margin-bottom: 12px;
          border-radius: 50%;
          background: #eaf3e9;
          color: #176b45;
          font-size: 22px;
        }

        .empty-chat h3 {
          margin: 0 0 7px;
          color: #284331;
          font-size: 16px;
        }

        .empty-chat p {
          max-width: 290px;
          margin: 0;
          color: #829087;
          font-size: 13px;
          line-height: 1.7;
        }

        .message-row {
          display: flex;
          margin-bottom: 18px;
        }

        .message-own {
          justify-content: flex-end;
        }

        .message-other {
          justify-content: flex-start;
        }

        .message-content {
          max-width: min(75%, 570px);
          display: flex;
          flex-direction: column;
        }

        .message-own .message-content {
          align-items: flex-end;
        }

        .message-other .message-content {
          align-items: flex-start;
        }

        .message-sender {
          margin: 0 5px 6px;
          color: #7b897f;
          font-size: 11px;
          font-weight: 700;
        }

        .message-bubble {
          padding: 12px 15px;
          border-radius: 13px;
          background: #eaf0e9;
          color: #294333;
          font-size: 14px;
          line-height: 1.7;
          white-space: pre-wrap;
          overflow-wrap: anywhere;
        }

        .message-own .message-bubble {
          border-bottom-right-radius: 4px;
          background: #176b45;
          color: white;
        }

        .message-other .message-bubble {
          border-bottom-left-radius: 4px;
        }

        .message-time {
          margin: 6px 5px 0;
          color: #9aa49c;
          font-size: 10px;
        }

        .message-form {
          padding: 20px 25px;
          border-top: 1px solid #edf0ec;
          background: white;
        }

        .message-form textarea {
          width: 100%;
          min-height: 80px;
          resize: vertical;
          padding: 13px 14px;
          border: 1px solid #dce5dc;
          border-radius: 10px;
          outline: none;
          background: #fcfdfb;
          color: #263d2e;
          font: inherit;
          font-size: 14px;
          line-height: 1.6;
        }

        .message-form textarea:focus {
          border-color: #176b45;
          box-shadow: 0 0 0 3px rgba(23, 107, 69, 0.09);
        }

        .message-form textarea:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .composer-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          margin-top: 12px;
        }

        .composer-footer > span {
          color: #8b978e;
          font-size: 11px;
        }

        .composer-footer button {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 18px;
          border: 0;
          border-radius: 8px;
          background: #176b45;
          color: white;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
        }

        .composer-footer button:hover:not(:disabled) {
          background: #103c2b;
        }

        .composer-footer button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .room-alert {
          margin: 15px 25px 0;
          padding: 11px 13px;
          border-radius: 8px;
          font-size: 13px;
          line-height: 1.6;
        }

        .room-alert-error {
          background: #fff0ed;
          color: #a52a20;
        }

        .closed-room {
          padding: 20px 25px;
          border-top: 1px solid #edf0ec;
          background: #f8faf7;
        }

        .closed-room strong {
          color: #435b49;
          font-size: 13px;
        }

        .closed-room p {
          margin: 6px 0 0;
          color: #829087;
          font-size: 12px;
        }

        .method-notice {
          padding: 25px;
        }

        .method-notice h2 {
          margin-top: 0;
        }

        .method-notice p {
          color: #718076;
          font-size: 14px;
          line-height: 1.8;
        }

        @media (max-width: 650px) {
          .header-inner {
            min-height: 64px;
            padding: 0 15px;
            gap: 10px;
          }

          .brand {
            font-size: 16px;
          }

          .private-label {
            font-size: 10px;
          }

          .room-container {
            width: calc(100% - 28px);
            padding-top: 28px;
          }

          .interview-summary {
            flex-direction: column;
          }

          .details-card {
            grid-template-columns: 1fr 1fr;
            padding: 20px;
            gap: 22px 15px;
          }

          .chat-heading {
            align-items: flex-start;
            padding: 20px;
          }

          .message-list {
            padding: 20px 15px;
          }

          .message-content {
            max-width: 88%;
          }

          .message-form {
            padding: 16px;
          }

          .composer-footer button {
            padding: 11px 13px;
            font-size: 12px;
          }
        }

        @media (max-width: 390px) {
          .private-label {
            display: none;
          }

          .details-card {
            grid-template-columns: 1fr;
          }

          .live-indicator {
            font-size: 10px;
          }
        }
      `}</style>
    </main>
  );
}

export default function InterviewRoomPage() {
  return (
    <Suspense
      fallback={
        <main
          style={{
            minHeight: "100vh",
            display: "grid",
            placeItems: "center",
            background: "#f4f7f3",
            color: "#176b45",
            fontFamily: "Arial, sans-serif",
          }}
        >
          Loading interview room...
        </main>
      }
    >
      <InterviewRoomContent />
    </Suspense>
  );
}