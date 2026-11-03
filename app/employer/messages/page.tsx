
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Logo from "../../../components/Logo";

import {
  ArrowLeft,
  BriefcaseBusiness,
  Building2,
  CheckCheck,
  ChevronDown,
  CircleHelp,
  MessageCircle,
  MoreHorizontal,
  Paperclip,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import "./messages.css";

type Message = {
  id: string;
  sender_id: string;
  recipient_id: string;
  text: string;
  time: string;
  read_at: string | null;
};

type Conversation = {
  id: string;
  applicationId: string;
  applicantId: string;
  name: string;
  role: string;
  job: string;
  initials: string;
  color: string;
  unread: number;
  time: string;
  messages: Message[];
};

type JobRecord = {
  id: string;
  title: string;
};

type ApplicationRecord = {
  id: string;
  job_id: string;
  applicant_id: string;
  status: string;
  created_at: string;
};

type ProfileRecord = {
  id: string;
  full_name: string | null;
  headline: string | null;
};

type MessageRecord = {
  id: string;
  application_id: string;
  sender_id: string;
  recipient_id: string;
  body: string;
  read_at: string | null;
  created_at: string;
};

const COLORS = ["green", "orange", "purple", "blue"];

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "AP";
}

function formatTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  const today = new Date();

  if (date.toDateString() === today.toDateString()) {
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  }

  return date.toLocaleDateString([], {
    day: "numeric",
    month: "short",
  });
}

function formatMessageTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function EmployerMessagesPage() {
  const router = useRouter();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [messageText, setMessageText] = useState("");
  const [companyName, setCompanyName] = useState("Your Company");
  const [userId, setUserId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const activeConversation = conversations.find(
    (conversation) => conversation.id === activeId
  );

  const filteredConversations = useMemo(() => {
    const query = search.toLowerCase().trim();

    if (!query) return conversations;

    return conversations.filter(
      (conversation) =>
        conversation.name.toLowerCase().includes(query) ||
        conversation.job.toLowerCase().includes(query) ||
        conversation.role.toLowerCase().includes(query)
    );
  }, [conversations, search]);

  const loadConversations = useCallback(async () => {
    const supabase = createClient();

    setError("");

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        router.replace("/login");
        return;
      }

      setUserId(user.id);

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profileError || profile?.role !== "employer") {
        router.replace("/dashboard");
        return;
      }

      // Load the employer's company name.
      const { data: employerProfile } = await supabase
        .from("employer_profiles")
        .select("business_name")
        .eq("id", user.id)
        .maybeSingle();

      if (employerProfile?.business_name) {
        setCompanyName(employerProfile.business_name);
      }

      // Load the employer's job posts.
      const { data: jobs, error: jobsError } = await supabase
        .from("jobs")
        .select("id, title")
        .eq("employer_id", user.id);

      if (jobsError) throw jobsError;

      const jobRecords = (jobs || []) as JobRecord[];

      if (jobRecords.length === 0) {
        setConversations([]);
        setActiveId(null);
        return;
      }

      const jobIds = jobRecords.map((job) => job.id);

      // Load applications submitted to those jobs.
      const { data: applications, error: applicationsError } =
        await supabase
          .from("job_applications")
          .select("id, job_id, applicant_id, status, created_at")
          .in("job_id", jobIds)
          .order("created_at", { ascending: false });

      if (applicationsError) throw applicationsError;

      const applicationRecords = (applications || []) as ApplicationRecord[];

      if (applicationRecords.length === 0) {
        setConversations([]);
        setActiveId(null);
        return;
      }

      const applicationIds = applicationRecords.map(
        (application) => application.id
      );

      const applicantIds = [
        ...new Set(
          applicationRecords.map((application) => application.applicant_id)
        ),
      ];

      // Load applicant names and professional headlines.
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, headline")
        .in("id", applicantIds);

      if (profilesError) throw profilesError;

      const profileRecords = (profiles || []) as ProfileRecord[];

      // Load all messages belonging to the employer's applications.
      const { data: messages, error: messagesError } = await supabase
        .from("messages")
        .select(
          "id, application_id, sender_id, recipient_id, body, read_at, created_at"
        )
        .in("application_id", applicationIds)
        .order("created_at", { ascending: true });

      if (messagesError) throw messagesError;

      const messageRecords = (messages || []) as MessageRecord[];

      const nextConversations: Conversation[] = applicationRecords.map(
        (application, index) => {
          const applicant = profileRecords.find(
            (profile) => profile.id === application.applicant_id
          );

          const job = jobRecords.find(
            (record) => record.id === application.job_id
          );

          const applicantMessages = messageRecords
            .filter(
              (message) => message.application_id === application.id
            )
            .map((message) => ({
              id: message.id,
              sender_id: message.sender_id,
              recipient_id: message.recipient_id,
              text: message.body,
              time: formatMessageTime(message.created_at),
              read_at: message.read_at,
            }));

          const unread = applicantMessages.filter(
            (message) =>
              message.recipient_id === user.id &&
              message.read_at === null
          ).length;

          const lastMessage =
            applicantMessages[applicantMessages.length - 1];

          const applicantName = applicant?.full_name || "Applicant";

          return {
            id: application.id,
            applicationId: application.id,
            applicantId: application.applicant_id,
            name: applicantName,
            role: applicant?.headline || "Job applicant",
            job: job?.title || "Job application",
            initials: getInitials(applicantName),
            color: COLORS[index % COLORS.length],
            unread,
            time: lastMessage
              ? formatTime(
                  messageRecords.find(
                    (message) => message.id === lastMessage.id
                  )?.created_at || application.created_at
                )
              : formatTime(application.created_at),
            messages: applicantMessages,
          };
        }
      );

      nextConversations.sort((a, b) => {
        const aDate =
          messageRecords
            .filter((message) => message.application_id === a.id)
            .at(-1)?.created_at || "";

        const bDate =
          messageRecords
            .filter((message) => message.application_id === b.id)
            .at(-1)?.created_at || "";

        return bDate.localeCompare(aDate);
      });

      setConversations(nextConversations);

      setActiveId((currentId) => {
        if (
          currentId &&
          nextConversations.some((conversation) => conversation.id === currentId)
        ) {
          return currentId;
        }

        return nextConversations[0]?.id || null;
      });
    } catch (err) {
      console.error("Employer messages error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load your conversations."
      );
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  async function openConversation(id: string) {
    setActiveId(id);

    if (!userId) return;

    const conversation = conversations.find((item) => item.id === id);

    if (!conversation) return;

    const unreadIds = conversation.messages
      .filter(
        (message) =>
          message.recipient_id === userId && message.read_at === null
      )
      .map((message) => message.id);

    if (unreadIds.length === 0) return;

    const supabase = createClient();

    const readAt = new Date().toISOString();

    const { error: updateError } = await supabase
      .from("messages")
      .update({ read_at: readAt })
      .in("id", unreadIds)
      .eq("recipient_id", userId);

    if (updateError) {
      console.error("Unable to mark messages as read:", updateError);
      return;
    }

    setConversations((previous) =>
      previous.map((item) =>
        item.id === id
          ? {
              ...item,
              unread: 0,
              messages: item.messages.map((message) =>
                unreadIds.includes(message.id)
                  ? { ...message, read_at: readAt }
                  : message
              ),
            }
          : item
      )
    );
  }

  async function sendMessage() {
    const trimmedMessage = messageText.trim();

    if (
      !trimmedMessage ||
      !activeConversation ||
      !userId ||
      sending
    ) {
      return;
    }

    setSending(true);
    setError("");

    try {
      const supabase = createClient();

      const { data, error: sendError } = await supabase
        .from("messages")
        .insert({
          application_id: activeConversation.applicationId,
          sender_id: userId,
          recipient_id: activeConversation.applicantId,
          body: trimmedMessage,
        })
        .select(
          "id, application_id, sender_id, recipient_id, body, read_at, created_at"
        )
        .single();

      if (sendError) throw sendError;

      const savedMessage = data as MessageRecord;

      const newMessage: Message = {
        id: savedMessage.id,
        sender_id: savedMessage.sender_id,
        recipient_id: savedMessage.recipient_id,
        text: savedMessage.body,
        time: formatMessageTime(savedMessage.created_at),
        read_at: savedMessage.read_at,
      };

      setConversations((previous) =>
        previous.map((conversation) =>
          conversation.id === activeConversation.id
            ? {
                ...conversation,
                messages: [...conversation.messages, newMessage],
                time: "Just now",
              }
            : conversation
        )
      );

      setMessageText("");
    } catch (err) {
      console.error("Message sending error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Your message could not be sent. Please try again."
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="employer-messages-page">
      {/* SIDEBAR */}
      <aside className="employer-messages-sidebar">
        <div className="employer-messages-brand">
          <Logo href="/" size="medium" light />
        </div>

        <div className="employer-messages-company">
          <div className="employer-messages-company-icon">
            <Building2 size={21} />
          </div>

          <div>
            <strong>{companyName}</strong>
            <span>Employer account</span>
          </div>
        </div>

        <p className="employer-messages-nav-label">WORKSPACE</p>

        <nav className="employer-messages-nav">
          <Link href="/employer/dashboard">
            <BriefcaseBusiness size={18} />
            Overview
          </Link>

          <Link href="/employer/jobs">
            <BriefcaseBusiness size={18} />
            My job posts
          </Link>

          <Link href="/employer/applicants">
            <Users size={18} />
            Applicants
          </Link>

          <Link href="/employer/messages" className="active">
            <MessageCircle size={18} />
            Messages
          </Link>

          <Link href="/employer/profile">
            <Building2 size={18} />
            Company profile
          </Link>
        </nav>

        <p className="employer-messages-nav-label employer-messages-preferences">
          PREFERENCES
        </p>

        <nav className="employer-messages-nav">
          <Link href="/employer/settings">
            <Settings size={18} />
            Settings
          </Link>
        </nav>

        <div className="employer-messages-sidebar-bottom">
          <div className="employer-messages-help">
            <div className="employer-messages-help-icon">
              <ShieldCheck size={19} />
            </div>

            <strong>Communicate with confidence</strong>

            <p>
              Keep your recruitment conversations professional and
              respectful.
            </p>

            <Link href="/guidelines">Community guidelines →</Link>
          </div>

          <Link
            href="/employer/dashboard"
            className="employer-messages-back"
          >
            <ArrowLeft size={16} />
            Back to overview
          </Link>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <section className="employer-messages-main">
        <header className="employer-messages-topbar">
          <div>
            <span>EMPLOYER WORKSPACE</span>
            <p>Connect with candidates and manage conversations</p>
          </div>

          <div className="employer-messages-account">
            <div className="employer-messages-account-icon">
              <Building2 size={18} />
            </div>

            <div>
              <strong>{companyName}</strong>
              <small>Employer</small>
            </div>

            <ChevronDown size={16} />
          </div>
        </header>

        <div className="employer-messages-content">
          <div className="employer-messages-heading">
            <div>
              <span className="employer-messages-kicker">
                CANDIDATE COMMUNICATION
              </span>

              <h1>Messages</h1>

              <p>
                Stay connected with applicants throughout your recruitment
                process.
              </p>
            </div>
          </div>

          {error && (
            <div className="employer-messages-notice">
              <CircleHelp size={17} />
              <p>{error}</p>
            </div>
          )}

          {/* MESSAGING WORKSPACE */}
          <section className="employer-messages-workspace">
            <div className="employer-messages-list-panel">
              <div className="employer-messages-list-heading">
                <div>
                  <h2>Conversations</h2>
                  <span>
                    {conversations.length} conversations
                  </span>
                </div>

                <button
                  type="button"
                  aria-label="Refresh conversations"
                  className="employer-messages-more"
                  onClick={() => {
                    setLoading(true);
                    loadConversations();
                  }}
                >
                  <MoreHorizontal size={20} />
                </button>
              </div>

              <label className="employer-messages-search">
                <Search size={17} />

                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search candidates..."
                />
              </label>

              <div className="employer-messages-conversation-list">
                {loading ? (
                  <div className="employer-messages-empty-search">
                    <MessageCircle size={22} />
                    <strong>Loading conversations...</strong>
                    <span>Please wait.</span>
                  </div>
                ) : (
                  <>
                    {filteredConversations.map((conversation) => (
                      <button
                        type="button"
                        key={conversation.id}
                        onClick={() => openConversation(conversation.id)}
                        className={`employer-messages-conversation ${
                          activeId === conversation.id ? "selected" : ""
                        }`}
                      >
                        <span
                          className={`employer-messages-avatar ${conversation.color}`}
                        >
                          {conversation.initials}
                        </span>

                        <span className="employer-messages-conversation-info">
                          <span className="employer-messages-conversation-top">
                            <strong>{conversation.name}</strong>
                            <small>{conversation.time}</small>
                          </span>

                          <span className="employer-messages-job">
                            {conversation.job}
                          </span>

                          <span className="employer-messages-preview">
                            {conversation.messages[
                              conversation.messages.length - 1
                            ]?.text || "No messages yet. Start a conversation."}
                          </span>
                        </span>

                        {conversation.unread > 0 && (
                          <span className="employer-messages-unread">
                            {conversation.unread}
                          </span>
                        )}
                      </button>
                    ))}

                    {filteredConversations.length === 0 && (
                      <div className="employer-messages-empty-search">
                        <Search size={22} />

                        <strong>
                          {search
                            ? "No conversations found"
                            : "No conversations yet"}
                        </strong>

                        <span>
                          {search
                            ? "Try another candidate name or job title."
                            : "Conversations will appear here when you have applicants."}
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* CHAT PANEL */}
            <div className="employer-messages-chat-panel">
              {loading ? (
                <div className="employer-messages-no-selection">
                  <MessageCircle size={38} />
                  <h2>Loading messages</h2>
                  <p>Your conversations are being retrieved.</p>
                </div>
              ) : activeConversation ? (
                <>
                  <div className="employer-messages-chat-header">
                    <div className="employer-messages-chat-person">
                      <span
                        className={`employer-messages-avatar large ${activeConversation.color}`}
                      >
                        {activeConversation.initials}
                      </span>

                      <div>
                        <strong>{activeConversation.name}</strong>
                        <span>
                          Applicant · {activeConversation.role}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="employer-messages-chat-more"
                      aria-label="Conversation options"
                    >
                      <MoreHorizontal size={21} />
                    </button>
                  </div>

                  <div className="employer-messages-job-context">
                    <BriefcaseBusiness size={17} />

                    <span>
                      Conversation about{" "}
                      <strong>{activeConversation.job}</strong>
                    </span>
                  </div>

                  <div className="employer-messages-chat-body">
                    <div className="employer-messages-date-divider">
                      <span>Conversation history</span>
                    </div>

                    {activeConversation.messages.length === 0 ? (
                      <div className="employer-messages-no-selection">
                        <MessageCircle size={30} />
                        <h2>Start a conversation</h2>
                        <p>
                          Send your first message to{" "}
                          {activeConversation.name}.
                        </p>
                      </div>
                    ) : (
                      activeConversation.messages.map((message) => (
                        <div
                          key={message.id}
                          className={`employer-message-row ${
                            message.sender_id === userId
                              ? "sent"
                              : "received"
                          }`}
                        >
                          {message.sender_id !== userId && (
                            <span
                              className={`employer-messages-avatar small ${activeConversation.color}`}
                            >
                              {activeConversation.initials}
                            </span>
                          )}

                          <div className="employer-message-content">
                            <div className="employer-message-bubble">
                              {message.text}
                            </div>

                            <span className="employer-message-time">
                              {message.time}

                              {message.sender_id === userId && (
                                <CheckCheck size={14} />
                              )}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <form
                    className="employer-messages-compose"
                    onSubmit={(event) => {
                      event.preventDefault();
                      sendMessage();
                    }}
                  >
                    <textarea
                      value={messageText}
                      onChange={(event) =>
                        setMessageText(event.target.value)
                      }
                      placeholder="Write a message to this candidate..."
                      rows={2}
                      maxLength={5000}
                      disabled={sending}
                      onKeyDown={(event) => {
                        if (
                          event.key === "Enter" &&
                          !event.shiftKey &&
                          !event.nativeEvent.isComposing
                        ) {
                          event.preventDefault();
                          sendMessage();
                        }
                      }}
                    />

                    <div className="employer-messages-compose-footer">
                      <div>
                        <button
                          type="button"
                          className="employer-messages-attach"
                          title="Attachments are not available yet"
                          aria-label="Attachments unavailable"
                          disabled
                        >
                          <Paperclip size={18} />
                        </button>

                        <span>
                          Press Enter to send · Shift + Enter for a new line
                        </span>
                      </div>

                      <button
                        type="submit"
                        className="employer-messages-send"
                        disabled={!messageText.trim() || sending}
                      >
                        {sending ? "Sending..." : "Send message"}
                        <Send size={16} />
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="employer-messages-no-selection">
                  <MessageCircle size={38} />

                  <h2>
                    {conversations.length === 0
                      ? "No applicants to message"
                      : "Select a conversation"}
                  </h2>

                  <p>
                    {conversations.length === 0
                      ? "When candidates apply for your jobs, their conversations will appear here."
                      : "Choose a candidate to view your conversation."}
                  </p>
                </div>
              )}
            </div>
          </section>

          <div className="employer-messages-notice">
            <CircleHelp size={17} />

            <p>
              Messages are saved securely in Abi Job. Only the employer
              and applicant associated with an application can access
              its conversation. File attachments are not available yet.
            </p>
          </div>

          <footer className="employer-messages-footer">
            Abi Job · Opportunity Starts Here
          </footer>
        </div>
      </section>
    </main>
  );
}
