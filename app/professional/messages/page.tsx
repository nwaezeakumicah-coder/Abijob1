"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Logo from "../../../components/Logo";
import { createClient } from "@/lib/supabase/client";
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  Bookmark,
  BriefcaseBusiness,
  Check,
  CheckCheck,
  FileText,
  LayoutDashboard,
  MessageCircle,
  MoreVertical,
  Paperclip,
  Search,
  Send,
  Smile,
  UserRound,
} from "lucide-react";
import "./messages.css";

type MessageRecord = {
  id: string;
  application_id: string;
  sender_id: string;
  recipient_id: string;
  body: string;
  read_at: string | null;
  created_at: string;
};

type ApplicationRecord = {
  id: string;
  job_id: string;
  applicant_id: string;
  status: string;
  created_at: string;
};

type JobRecord = {
  id: string;
  title: string;
  employer_id: string;
};

type ProfileRecord = {
  id: string;
  full_name: string | null;
  headline: string | null;
};

type Message = {
  id: string;
  text: string;
  time: string;
  sender: "me" | "them";
  read: boolean;
  sender_id: string;
  recipient_id: string;
  read_at: string | null;
};

type Conversation = {
  id: string;
  applicationId: string;
  employerId: string;
  name: string;
  role: string;
  initials: string;
  color: string;
  online: boolean;
  unread: number;
  time: string;
  messages: Message[];
};

const COLORS = ["green", "orange", "purple", "blue", "pink"];

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "EM";
}

function formatMessageTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatConversationTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();

  if (isToday) {
    return formatMessageTime(value);
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  }

  return date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });
}

export default function ProfessionalMessagesPage() {
  const router = useRouter();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [messageInput, setMessageInput] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [mobileChatOpen, setMobileChatOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

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

      // Confirm that this is a Professional account.
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profileError || profile?.role !== "professional") {
        router.replace("/dashboard");
        return;
      }

      // Load applications submitted by this professional.
      const { data: applications, error: applicationsError } =
        await supabase
          .from("job_applications")
          .select("id, job_id, applicant_id, status, created_at")
          .eq("applicant_id", user.id)
          .order("created_at", { ascending: false });

      if (applicationsError) throw applicationsError;

      const applicationRecords =
        (applications || []) as ApplicationRecord[];

      if (applicationRecords.length === 0) {
        setConversations([]);
        setSelectedId(null);
        return;
      }

      const applicationIds = applicationRecords.map(
        (application) => application.id
      );

      const jobIds = [
        ...new Set(applicationRecords.map((application) => application.job_id)),
      ];

      // Load the jobs connected to those applications.
      const { data: jobs, error: jobsError } = await supabase
        .from("jobs")
        .select("id, title, employer_id")
        .in("id", jobIds);

      if (jobsError) throw jobsError;

      const jobRecords = (jobs || []) as JobRecord[];

      const employerIds = [
        ...new Set(jobRecords.map((job) => job.employer_id)),
      ];

      // Employer profile details may be restricted by privacy policies.
      // If they are unavailable, the inbox will use a safe fallback name.
      let profileRecords: ProfileRecord[] = [];

      if (employerIds.length > 0) {
        const { data: employerProfiles } = await supabase
          .from("profiles")
          .select("id, full_name, headline")
          .in("id", employerIds);

        profileRecords = (employerProfiles || []) as ProfileRecord[];
      }

      // Load messages belonging to the professional's applications.
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
          const job = jobRecords.find(
            (record) => record.id === application.job_id
          );

          const employer = profileRecords.find(
            (record) => record.id === job?.employer_id
          );

          const employerName = employer?.full_name || "Employer";

          const applicationMessages = messageRecords
            .filter(
              (message) => message.application_id === application.id
            )
            .map((message) => ({
              id: message.id,
              text: message.body,
              time: formatMessageTime(message.created_at),
              sender: message.sender_id === user.id ? "me" : "them",
              read: message.read_at !== null,
              sender_id: message.sender_id,
              recipient_id: message.recipient_id,
              read_at: message.read_at,
            })) as Message[];

          const unread = applicationMessages.filter(
            (message) =>
              message.recipient_id === user.id &&
              message.read_at === null
          ).length;

          const lastMessage =
            applicationMessages[applicationMessages.length - 1];

          return {
            id: application.id,
            applicationId: application.id,
            employerId: job?.employer_id || "",
            name: employerName,
            role: job?.title || "Job application",
            initials: getInitials(employerName),
            color: COLORS[index % COLORS.length],
            online: false,
            unread,
            time: lastMessage
              ? lastMessage.time
              : formatConversationTime(application.created_at),
            messages: applicationMessages,
          };
        }
      );

      // Put conversations with the most recent messages first.
      nextConversations.sort((a, b) => {
        const aLast =
          messageRecords
            .filter((message) => message.application_id === a.applicationId)
            .map((message) => message.created_at)
            .pop() || "";

        const bLast =
          messageRecords
            .filter((message) => message.application_id === b.applicationId)
            .map((message) => message.created_at)
            .pop() || "";

        return bLast.localeCompare(aLast);
      });

      setConversations(nextConversations);

      setSelectedId((currentId) => {
        if (
          currentId &&
          nextConversations.some(
            (conversation) => conversation.id === currentId
          )
        ) {
          return currentId;
        }

        return nextConversations[0]?.id || null;
      });
    } catch (err) {
      console.error("Professional messages error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load your conversations."
      );
    } finally {
      setLoaded(true);
    }
  }, [router]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const selectedConversation = conversations.find(
    (conversation) => conversation.id === selectedId
  );

  const filteredConversations = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    return conversations.filter((conversation) => {
      return (
        conversation.name.toLowerCase().includes(query) ||
        conversation.role.toLowerCase().includes(query) ||
        conversation.messages.some((message) =>
          message.text.toLowerCase().includes(query)
        )
      );
    });
  }, [conversations, searchQuery]);

  const unreadCount = conversations.reduce(
    (total, conversation) => total + conversation.unread,
    0
  );

  async function openConversation(id: string) {
    setSelectedId(id);
    setMobileChatOpen(true);

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
      setError("Unable to update message read status.");
      return;
    }

    setConversations((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              unread: 0,
              messages: item.messages.map((message) =>
                unreadIds.includes(message.id)
                  ? { ...message, read_at: readAt, read: true }
                  : message
              ),
            }
          : item
      )
    );
  }

  async function sendMessage() {
    const text = messageInput.trim();

    if (
      !text ||
      !selectedConversation ||
      !userId ||
      !selectedConversation.employerId ||
      sending
    ) {
      return;
    }

    setSending(true);
    setError("");

    try {
      const supabase = createClient();

      const { error: sendError } = await supabase
        .from("messages")
        .insert({
          application_id: selectedConversation.applicationId,
          sender_id: userId,
          recipient_id: selectedConversation.employerId,
          body: text,
        });

      if (sendError) throw sendError;

      setMessageInput("");

      // Reload the saved conversation from Supabase.
      await loadConversations();
    } catch (err) {
      console.error("Unable to send professional message:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Your message could not be sent. Please try again."
      );
    } finally {
      setSending(false);
    }
  }

  function handleComposerKeyDown(
    event: React.KeyboardEvent<HTMLTextAreaElement>
  ) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  }

  return (
    <main className="professional-messages-page">
      <aside className="professional-messages-sidebar">
        <div className="professional-messages-brand">
          <Logo href="/" light />
        </div>

        <p className="professional-messages-nav-label">
          PROFESSIONAL WORKSPACE
        </p>

        <nav className="professional-messages-nav">
          <Link href="/professional/dashboard">
            <LayoutDashboard size={19} />
            <span>Dashboard</span>
          </Link>

          <Link href="/professional/opportunities">
            <BriefcaseBusiness size={19} />
            <span>Opportunities</span>
          </Link>

          <Link href="/professional/applications">
            <FileText size={19} />
            <span>My applications</span>
          </Link>

          <Link href="/professional/saved">
            <Bookmark size={19} />
            <span>Saved opportunities</span>
          </Link>

          <Link href="/professional/experience">
            <BriefcaseBusiness size={19} />
            <span>Experience</span>
          </Link>

          <Link href="/professional/messages" className="active">
            <MessageCircle size={19} />
            <span>Messages</span>
            {unreadCount > 0 && (
              <span className="professional-messages-nav-count">
                {unreadCount}
              </span>
            )}
          </Link>

          <Link href="/professional/notifications">
            <Bell size={19} />
            <span>Notifications</span>
          </Link>
        </nav>

        <div className="professional-messages-sidebar-bottom">
          <Link
            href="/professional/profile"
            className="professional-messages-profile-link"
          >
            <div className="professional-messages-profile-avatar">MN</div>
            <div>
              <strong>My profile</strong>
              <span>Professional account</span>
            </div>
            <ArrowRight size={15} />
          </Link>

          <Link
            href="/professional/settings"
            className="professional-messages-settings-link"
          >
            <UserRound size={17} />
            Account settings
          </Link>
        </div>
      </aside>

      <section className="professional-messages-main">
        <header className="professional-messages-topbar">
          <div>
            <span>PROFESSIONAL WORKSPACE</span>
            <h1>Messages</h1>
          </div>

          <div className="professional-messages-top-actions">
            <Link
              href="/professional/notifications"
              aria-label="Notifications"
            >
              <Bell size={20} />
            </Link>
            <Link
              href="/professional/profile"
              className="professional-messages-top-avatar"
            >
              MN
            </Link>
          </div>
        </header>

        <div className="professional-messages-content">
          <div className="professional-messages-intro">
            <div>
              <span>YOUR CONNECTIONS</span>
              <h2>Stay connected. Move opportunities forward.</h2>
              <p>
                Communicate with employers about the opportunities you have
                applied for.
              </p>
            </div>

            <div className="professional-messages-intro-stat">
              <div>
                <MessageCircle size={21} />
              </div>
              <strong>{conversations.length}</strong>
              <span>Conversations</span>
            </div>
          </div>

          {error && (
            <div
              role="alert"
              style={{
                padding: "12px 16px",
                marginBottom: "16px",
                borderRadius: "8px",
                background: "#fff1f0",
                color: "#a12622",
              }}
            >
              {error}
            </div>
          )}

          <section className="professional-messages-workspace">
            <aside
              className={`professional-messages-list ${
                mobileChatOpen ? "mobile-hidden" : ""
              }`}
            >
              <div className="professional-messages-list-heading">
                <div>
                  <h2>Inbox</h2>
                  <span>
                    {unreadCount} unread{" "}
                    {unreadCount === 1 ? "message" : "messages"}
                  </span>
                </div>
                <button
                  type="button"
                  aria-label="Refresh conversations"
                  title="Refresh conversations"
                  onClick={loadConversations}
                >
                  <MoreVertical size={19} />
                </button>
              </div>

              <div className="professional-messages-search">
                <Search size={17} />
                <input
                  type="search"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                />
              </div>

              <div className="professional-messages-list-label">
                ALL CONVERSATIONS
              </div>

              <div className="professional-messages-conversations">
                {!loaded ? (
                  <div className="professional-messages-list-empty">
                    Loading conversations...
                  </div>
                ) : filteredConversations.length > 0 ? (
                  filteredConversations.map((conversation) => {
                    const lastMessage =
                      conversation.messages[
                        conversation.messages.length - 1
                      ];

                    return (
                      <button
                        type="button"
                        key={conversation.id}
                        className={`professional-messages-conversation ${
                          selectedId === conversation.id ? "selected" : ""
                        }`}
                        onClick={() => openConversation(conversation.id)}
                      >
                        <div
                          className={`professional-messages-contact-avatar ${conversation.color}`}
                        >
                          {conversation.initials}
                          {conversation.online && (
                            <span className="professional-messages-online-dot" />
                          )}
                        </div>

                        <div className="professional-messages-contact-details">
                          <div className="professional-messages-contact-top">
                            <strong>{conversation.name}</strong>
                            <span>
                              {lastMessage?.time || conversation.time}
                            </span>
                          </div>

                          <p>{conversation.role}</p>

                          <div className="professional-messages-contact-bottom">
                            <span>
                              {lastMessage?.sender === "me" && "You: "}
                              {lastMessage?.text || "No messages yet"}
                            </span>

                            {conversation.unread > 0 && (
                              <b>{conversation.unread}</b>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="professional-messages-list-empty">
                    {conversations.length === 0 ? (
                      <>
                        <MessageCircle size={23} />
                        <strong>No conversations yet</strong>
                        <span>
                          Conversations will appear here when you apply for
                          opportunities and exchange messages with employers.
                        </span>
                      </>
                    ) : (
                      <>
                        <Search size={23} />
                        <strong>No conversations found</strong>
                        <span>
                          Try searching with another name or keyword.
                        </span>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="professional-messages-list-footer">
                <ShieldCheckIcon />
                <span>Your conversations are private to your account.</span>
              </div>
            </aside>

            <section
              className={`professional-messages-chat ${
                mobileChatOpen ? "mobile-visible" : ""
              }`}
            >
              {selectedConversation ? (
                <>
                  <header className="professional-messages-chat-header">
                    <button
                      type="button"
                      className="professional-messages-back"
                      onClick={() => setMobileChatOpen(false)}
                      aria-label="Back to conversations"
                    >
                      <ArrowLeft size={20} />
                    </button>

                    <div
                      className={`professional-messages-contact-avatar large ${selectedConversation.color}`}
                    >
                      {selectedConversation.initials}
                    </div>

                    <div className="professional-messages-chat-person">
                      <strong>{selectedConversation.name}</strong>
                      <span>
                        <i />
                        Employer
                      </span>
                      <small>{selectedConversation.role}</small>
                    </div>

                    <button
                      type="button"
                      className="professional-messages-chat-menu"
                      aria-label="Conversation options"
                      title="Conversation options"
                    >
                      <MoreVertical size={20} />
                    </button>
                  </header>

                  <div className="professional-messages-chat-date">
                    <span>CONVERSATION</span>
                  </div>

                  <div className="professional-messages-chat-body">
                    {selectedConversation.messages.length > 0 ? (
                      selectedConversation.messages.map((message) => (
                        <div
                          key={message.id}
                          className={`professional-message-row ${
                            message.sender === "me" ? "sent" : "received"
                          }`}
                        >
                          {message.sender === "them" && (
                            <div
                              className={`professional-message-mini-avatar ${selectedConversation.color}`}
                            >
                              {selectedConversation.initials}
                            </div>
                          )}

                          <div className="professional-message-content">
                            <div className="professional-message-bubble">
                              {message.text}
                            </div>
                            <div className="professional-message-meta">
                              <span>{message.time}</span>
                              {message.sender === "me" && (
                                <span className="professional-message-read">
                                  {message.read ? (
                                    <CheckCheck size={14} />
                                  ) : (
                                    <Check size={14} />
                                  )}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="professional-messages-list-empty">
                        <MessageCircle size={23} />
                        <strong>Start the conversation</strong>
                        <span>
                          Send a message to this employer about your
                          application.
                        </span>
                      </div>
                    )}
                  </div>

                  <form
                    className="professional-messages-composer"
                    onSubmit={(event) => {
                      event.preventDefault();
                      sendMessage();
                    }}
                  >
                    <div className="professional-messages-composer-tools">
                      <button
                        type="button"
                        aria-label="Attach file"
                        title="File attachments are not available yet"
                        onClick={() =>
                          alert("File attachments are not available yet.")
                        }
                      >
                        <Paperclip size={19} />
                      </button>
                      <button
                        type="button"
                        aria-label="Emoji"
                        title="Add a smile"
                        onClick={() =>
                          setMessageInput((current) => `${current} 😊`)
                        }
                      >
                        <Smile size={19} />
                      </button>
                    </div>

                    <textarea
                      placeholder="Write your message..."
                      value={messageInput}
                      onChange={(event) =>
                        setMessageInput(event.target.value)
                      }
                      onKeyDown={handleComposerKeyDown}
                      rows={1}
                    />

                    <button
                      type="submit"
                      className="professional-messages-send"
                      disabled={!messageInput.trim() || sending}
                      aria-label="Send message"
                    >
                      <Send size={18} />
                    </button>
                  </form>

                  <p className="professional-messages-composer-note">
                    {sending
                      ? "Sending message..."
                      : "Press Enter to send · Shift + Enter for a new line"}
                  </p>
                </>
              ) : (
                <div className="professional-messages-no-chat">
                  <div>
                    <MessageCircle size={34} />
                  </div>
                  <h2>Select a conversation</h2>
                  <p>
                    Choose someone from your inbox to view your conversation.
                  </p>
                </div>
              )}
            </section>
          </section>
        </div>
      </section>
    </main>
  );
}

function ShieldCheckIcon() {
  return (
    <span className="professional-messages-shield">
      <Check size={13} />
    </span>
  );
}