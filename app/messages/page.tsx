
"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Logo from "../../components/Logo";
import { createClient } from "@/lib/supabase/client";
import {
  ArrowLeft,
  Bell,
  BriefcaseBusiness,
  Check,
  CheckCheck,
  ChevronDown,
  CircleHelp,
  Filter,
  MessageCircle,
  MoreHorizontal,
  Paperclip,
  Plus,
  Search,
  Send,
  Settings,
  Smile,
  Users,
  X,
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
  created_at: string;
};

type JobRecord = {
  id: string;
  title: string;
  employer_id: string;
};

type ChatMessage = {
  id: string;
  text: string;
  time: string;
  sender: "me" | "them";
};

type Conversation = {
  id: string;
  applicationId: string;
  recipientId: string;
  name: string;
  role: string;
  initials: string;
  color: string;
  unread: number;
  lastMessage: string;
  time: string;
  messages: ChatMessage[];
};

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatLastMessageTime(value: string) {
  const date = new Date(value);
  const today = new Date();

  if (date.toDateString() === today.toDateString()) {
    return formatTime(value);
  }

  return date.toLocaleDateString([], {
    day: "numeric",
    month: "short",
  });
}

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase() || "EM";
}

export default function MessagesPage() {
  const router = useRouter();
  const supabase = createClient();

  const [accessChecked, setAccessChecked] = useState(false);
  const [userId, setUserId] = useState("");
  const [userName, setUserName] = useState("Job Seeker");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState("");
  const [search, setSearch] = useState("");
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [newMessageTarget, setNewMessageTarget] = useState("");
  const [mobileListOpen, setMobileListOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const loadConversations = useCallback(async (currentUserId: string) => {
    setError("");

    const { data: applicationRows, error: applicationError } = await supabase
      .from("job_applications")
      .select("id, job_id, created_at")
      .eq("applicant_id", currentUserId)
      .order("created_at", { ascending: false });

    if (applicationError) {
      console.error("Could not load applications:", applicationError);
      setError("We could not load your applications. Please refresh the page.");
      setConversations([]);
      return;
    }

    const applications = (applicationRows || []) as ApplicationRecord[];

    if (applications.length === 0) {
      setConversations([]);
      setActiveId("");
      return;
    }

    const jobIds = [...new Set(applications.map((item) => item.job_id))];

    const { data: jobRows, error: jobError } = await supabase
      .from("jobs")
      .select("id, title, employer_id")
      .in("id", jobIds);

    if (jobError) {
      console.error("Could not load application jobs:", jobError);
      setError("We could not load the jobs connected to your applications.");
      setConversations([]);
      return;
    }

    const jobs = (jobRows || []) as JobRecord[];
    const jobMap = new Map(jobs.map((job) => [job.id, job]));

    const usableApplications = applications.filter((application) =>
      jobMap.has(application.job_id)
    );

    if (usableApplications.length === 0) {
      setConversations([]);
      setActiveId("");
      return;
    }

    const applicationIds = usableApplications.map((item) => item.id);

    const { data: messageRows, error: messageError } = await supabase
      .from("messages")
      .select(
        "id, application_id, sender_id, recipient_id, body, read_at, created_at"
      )
      .in("application_id", applicationIds)
      .order("created_at", { ascending: true });

    if (messageError) {
      console.error("Could not load messages:", messageError);
      setError("We could not load your messages. Please refresh the page.");
      setConversations([]);
      return;
    }

    const messages = (messageRows || []) as MessageRecord[];

    const nextConversations: Conversation[] = usableApplications.map(
      (application, index) => {
        const job = jobMap.get(application.job_id)!;

        const applicationMessages = messages.filter(
          (message) => message.application_id === application.id
        );

        const lastMessage =
          applicationMessages[applicationMessages.length - 1];

        const unread = applicationMessages.filter(
          (message) =>
            message.recipient_id === currentUserId && message.read_at === null
        ).length;

        return {
          id: application.id,
          applicationId: application.id,
          recipientId: job.employer_id,
          name: "Employer",
          role: job.title || "Job application",
          initials: "EM",
          color: ["green", "blue", "orange", "purple", "teal"][index % 5],
          unread,
          lastMessage: lastMessage
            ? lastMessage.body
            : "Start a conversation about this application.",
          time: lastMessage
            ? formatLastMessageTime(lastMessage.created_at)
            : formatLastMessageTime(application.created_at),
          messages: applicationMessages.map((message) => ({
            id: message.id,
            text: message.body,
            time: formatTime(message.created_at),
            sender:
              message.sender_id === currentUserId ? "me" : "them",
          })),
        };
      }
    );

    setConversations(nextConversations);

    setActiveId((currentId) => {
      if (
        currentId &&
        nextConversations.some((conversation) => conversation.id === currentId)
      ) {
        return currentId;
      }

      return nextConversations[0]?.id || "";
    });
  }, [supabase]);

  useEffect(() => {
    let cancelled = false;

    async function initialise() {
      setLoading(true);

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (cancelled) return;

      if (authError || !user) {
        router.replace("/login");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role, full_name")
        .eq("id", user.id)
        .maybeSingle();

      if (cancelled) return;

      if (profileError) {
        console.error("Could not verify account role:", profileError);
        setError("We could not verify your account. Please try again.");
        setLoading(false);
        setAccessChecked(true);
        return;
      }

      const role = String(profile?.role || "")
        .trim()
        .toLowerCase()
        .replace(/_/g, "-");

      if (
        role === "professional" ||
        role === "skilled-professional" ||
        role === "artisan"
      ) {
        router.replace("/professional/messages");
        return;
      }

      if (role === "employer") {
        router.replace("/employer/messages");
        return;
      }

      if (role !== "job-seeker" && role !== "jobseeker" && role !== "seeker") {
        router.replace("/dashboard");
        return;
      }

      setUserId(user.id);
      setUserName(profile?.full_name || "Job Seeker");
      setAccessChecked(true);

      await loadConversations(user.id);

      if (!cancelled) {
        setLoading(false);
      }
    }

    initialise();

    return () => {
      cancelled = true;
    };
  }, [router, supabase, loadConversations]);

  const activeConversation = conversations.find(
    (conversation) => conversation.id === activeId
  );

  const filteredConversations = useMemo(() => {
    return conversations.filter((conversation) => {
      const query = search.trim().toLowerCase();

      const matchesSearch =
        conversation.name.toLowerCase().includes(query) ||
        conversation.role.toLowerCase().includes(query) ||
        conversation.lastMessage.toLowerCase().includes(query);

      const matchesUnread =
        !showUnreadOnly || conversation.unread > 0;

      return matchesSearch && matchesUnread;
    });
  }, [conversations, search, showUnreadOnly]);

  const totalUnread = conversations.reduce(
    (total, conversation) => total + conversation.unread,
    0
  );

  async function openConversation(id: string) {
    setActiveId(id);
    setMobileListOpen(false);

    const conversation = conversations.find((item) => item.id === id);

    if (!conversation || conversation.unread === 0 || !userId) return;

    const unreadIds = conversation.messages
      .filter((message) => message.sender === "them")
      .map((message) => message.id);

    if (unreadIds.length === 0) return;

    const readAt = new Date().toISOString();

    const { error: updateError } = await supabase
      .from("messages")
      .update({ read_at: readAt })
      .in("id", unreadIds)
      .eq("recipient_id", userId);

    if (updateError) {
      console.error("Could not mark messages as read:", updateError);
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
                  ? { ...message }
                  : message
              ),
            }
          : item
      )
    );
  }

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

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

    const { data, error: sendError } = await supabase
      .from("messages")
      .insert({
        application_id: activeConversation.applicationId,
        sender_id: userId,
        recipient_id: activeConversation.recipientId,
        body: trimmedMessage,
      })
      .select(
        "id, application_id, sender_id, recipient_id, body, read_at, created_at"
      )
      .single();

    if (sendError || !data) {
      console.error("Message could not be sent:", sendError);
      setError(
        sendError?.message ||
          "Your message could not be sent. Please try again."
      );
      setSending(false);
      return;
    }

    const savedMessage = data as MessageRecord;

    const newMessage: ChatMessage = {
      id: savedMessage.id,
      text: savedMessage.body,
      time: formatTime(savedMessage.created_at),
      sender: "me",
    };

    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === activeConversation.id
          ? {
              ...conversation,
              messages: [...conversation.messages, newMessage],
              lastMessage: trimmedMessage,
              time: formatLastMessageTime(savedMessage.created_at),
            }
          : conversation
      )
    );

    setMessageText("");
    setSending(false);
  }

  function startNewMessage() {
    if (!newMessageTarget) return;

    const target = conversations.find(
      (conversation) => conversation.id === newMessageTarget
    );

    if (!target) return;

    openConversation(target.id);
    setShowNewMessage(false);
  }

  if (!accessChecked) {
    return (
      <main className="messages-access-loading">
        <div className="messages-access-loading-card">
          <div className="messages-access-spinner" />
          <strong>Opening your messaging workspace</strong>
          <p>Please wait while we direct you to the correct account area.</p>
        </div>
      </main>
    );
  }

  const avatarInitials = getInitials(userName);

  return (
    <main className="messages-page">
      <aside className="messages-sidebar">
        <div className="messages-sidebar-brand">
          <Logo href="/" />
        </div>

        <div className="messages-sidebar-label">JOB SEEKER WORKSPACE</div>

        <nav className="messages-side-nav">
          <Link href="/dashboard" className="messages-nav-link">
            <BriefcaseBusiness size={19} />
            <span>Dashboard</span>
          </Link>

          <Link href="/jobs" className="messages-nav-link">
            <Search size={19} />
            <span>Find jobs</span>
          </Link>

          <Link href="/applications" className="messages-nav-link">
            <Users size={19} />
            <span>Applications</span>
          </Link>

          <Link href="/messages" className="messages-nav-link active">
            <MessageCircle size={19} />
            <span>Messages</span>
            {totalUnread > 0 && (
              <span className="messages-nav-count">{totalUnread}</span>
            )}
          </Link>

          <Link href="/notifications" className="messages-nav-link">
            <Bell size={19} />
            <span>Notifications</span>
          </Link>
        </nav>

        <div className="messages-sidebar-bottom">
          <div className="messages-help-card">
            <div className="messages-help-icon">
              <CircleHelp size={19} />
            </div>
            <strong>Need a hand?</strong>
            <p>Find answers and get support as you use Abi Job.</p>
            <Link href="/support">
              Visit help centre <span>→</span>
            </Link>
          </div>

          <Link href="/settings" className="messages-nav-link">
            <Settings size={19} />
            <span>Settings</span>
          </Link>

          <div className="messages-user-mini">
            <div className="messages-user-avatar">{avatarInitials}</div>
            <div className="messages-user-info">
              <strong>{userName}</strong>
              <span>Job Seeker</span>
            </div>
            <MoreHorizontal size={20} />
          </div>
        </div>
      </aside>

      <section className="messages-main">
        <header className="messages-topbar">
          <div className="messages-breadcrumb">
            <span>Job Seeker Workspace</span>
            <span className="messages-breadcrumb-separator">/</span>
            <strong>Messages</strong>
          </div>

          <div className="messages-topbar-actions">
            <span className="messages-topbar-date">Your conversations</span>
            <Link
              href="/notifications"
              className="messages-topbar-icon"
              aria-label="Notifications"
            >
              <Bell size={19} />
            </Link>
            <button
              className="messages-topbar-avatar"
              aria-label="Open your profile"
              onClick={() => router.push("/profile")}
            >
              {avatarInitials}
            </button>
          </div>
        </header>

        <div className="messages-content">
          <div className="messages-heading">
            <div>
              <div className="messages-eyebrow">STAY CONNECTED</div>
              <h1>Messages</h1>
              <p>Connect, communicate and keep opportunities moving.</p>
            </div>

            <button
              className="messages-new-button"
              onClick={() => {
                setNewMessageTarget(conversations[0]?.id || "");
                setShowNewMessage(true);
              }}
              disabled={conversations.length === 0}
            >
              <Plus size={18} />
              New message
            </button>
          </div>

          {error && (
            <div className="messages-error" role="alert">
              {error}
            </div>
          )}

          <div className="messages-workspace">
            <section
              className={`messages-inbox ${
                !mobileListOpen ? "messages-mobile-hidden" : ""
              }`}
            >
              <div className="messages-inbox-header">
                <div>
                  <h2>Inbox</h2>
                  <span>
                    {loading
                      ? "Loading conversations..."
                      : `${conversations.length} conversations`}
                  </span>
                </div>
                <button
                  className={`messages-filter-button ${
                    showUnreadOnly ? "selected" : ""
                  }`}
                  onClick={() => setShowUnreadOnly((value) => !value)}
                  aria-label="Toggle unread conversations"
                  title="Show unread only"
                >
                  <Filter size={17} />
                </button>
              </div>

              <div className="messages-search">
                <Search size={17} />
                <input
                  type="search"
                  placeholder="Search conversations..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  aria-label="Search conversations"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    aria-label="Clear search"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>

              <div className="messages-inbox-tabs">
                <button
                  className={!showUnreadOnly ? "active" : ""}
                  onClick={() => setShowUnreadOnly(false)}
                >
                  All messages
                </button>
                <button
                  className={showUnreadOnly ? "active" : ""}
                  onClick={() => setShowUnreadOnly(true)}
                >
                  Unread
                  {totalUnread > 0 && <span>{totalUnread}</span>}
                </button>
              </div>

              <div className="messages-conversation-list">
                {loading ? (
                  <div className="messages-empty-list">
                    <div className="messages-access-spinner" />
                    <strong>Loading your inbox</strong>
                    <span>Please wait...</span>
                  </div>
                ) : filteredConversations.length > 0 ? (
                  filteredConversations.map((conversation) => (
                    <button
                      key={conversation.id}
                      className={`messages-conversation ${
                        activeId === conversation.id ? "active" : ""
                      }`}
                      onClick={() => openConversation(conversation.id)}
                    >
                      <div
                        className={`messages-avatar avatar-${conversation.color}`}
                      >
                        {conversation.initials}
                      </div>

                      <div className="messages-conversation-details">
                        <div className="messages-conversation-top">
                          <strong>{conversation.name}</strong>
                          <span>{conversation.time}</span>
                        </div>
                        <span className="messages-conversation-role">
                          {conversation.role}
                        </span>
                        <div className="messages-conversation-bottom">
                          <p>{conversation.lastMessage}</p>
                          {conversation.unread > 0 && (
                            <span className="messages-unread-count">
                              {conversation.unread}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="messages-empty-list">
                    <MessageCircle size={27} />
                    <strong>
                      {conversations.length === 0
                        ? "No conversations yet"
                        : "No conversations found"}
                    </strong>
                    <span>
                      {conversations.length === 0
                        ? "When you apply for a job, you can message its employer here."
                        : "Try another search or change your filter."}
                    </span>
                  </div>
                )}
              </div>
            </section>

            <section
              className={`messages-chat ${
                mobileListOpen ? "messages-chat-mobile-hidden" : ""
              }`}
            >
              {activeConversation ? (
                <>
                  <div className="messages-chat-header">
                    <div className="messages-chat-person">
                      <button
                        className="messages-back-button"
                        onClick={() => setMobileListOpen(true)}
                        aria-label="Back to conversations"
                      >
                        <ArrowLeft size={19} />
                      </button>

                      <div
                        className={`messages-avatar avatar-${activeConversation.color}`}
                      >
                        {activeConversation.initials}
                      </div>

                      <div>
                        <strong>{activeConversation.name}</strong>
                        <span>{activeConversation.role}</span>
                      </div>
                    </div>

                    <div className="messages-chat-actions">
                      <button
                        aria-label="More conversation options"
                        type="button"
                        title="More options"
                      >
                        <MoreHorizontal size={21} />
                      </button>
                    </div>
                  </div>

                  <div className="messages-chat-context">
                    <div className="messages-context-icon">
                      <BriefcaseBusiness size={17} />
                    </div>
                    <div>
                      <span>APPLICATION CONVERSATION</span>
                      <strong>{activeConversation.role}</strong>
                    </div>
                    <button
                      aria-label="Conversation details"
                      type="button"
                      title="Application conversation"
                    >
                      <ChevronDown size={17} />
                    </button>
                  </div>

                  <div className="messages-chat-body">
                    <div className="messages-date-divider">
                      <span>Conversation history</span>
                    </div>

                    {activeConversation.messages.length > 0 ? (
                      activeConversation.messages.map((message, index) => {
                        const previousMessage =
                          activeConversation.messages[index - 1];

                        const showSender =
                          !previousMessage ||
                          previousMessage.sender !== message.sender;

                        return (
                          <div
                            key={message.id}
                            className={`messages-message-row ${
                              message.sender === "me" ? "sent" : "received"
                            }`}
                          >
                            {message.sender === "them" && showSender && (
                              <div
                                className={`messages-message-avatar avatar-${activeConversation.color}`}
                              >
                                {activeConversation.initials}
                              </div>
                            )}

                            <div className="messages-message-content">
                              {message.sender === "them" && showSender && (
                                <span className="messages-message-sender">
                                  {activeConversation.name}
                                </span>
                              )}

                              <div className="messages-bubble">
                                {message.text}
                              </div>

                              <div className="messages-message-meta">
                                <span>{message.time}</span>
                                {message.sender === "me" && (
                                  <CheckCheck size={14} />
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="messages-select-empty">
                        <div className="messages-select-empty-icon">
                          <MessageCircle size={30} />
                        </div>
                        <h3>Start the conversation</h3>
                        <p>
                          Send a message to the employer about your job
                          application.
                        </p>
                      </div>
                    )}
                  </div>

                  <form className="messages-composer" onSubmit={sendMessage}>
                    <div className="messages-composer-box">
                      <input
                        type="text"
                        placeholder="Write your message..."
                        value={messageText}
                        onChange={(event) => setMessageText(event.target.value)}
                        aria-label="Write a message"
                        disabled={sending}
                      />

                      <div className="messages-composer-tools">
                        <button
                          type="button"
                          aria-label="Attach a file"
                          title="File attachments are not available yet"
                          disabled
                        >
                          <Paperclip size={19} />
                        </button>
                        <button
                          type="button"
                          aria-label="Emoji"
                          title="Emoji support is not available yet"
                          disabled
                        >
                          <Smile size={19} />
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="messages-send-button"
                      disabled={!messageText.trim() || sending}
                      aria-label="Send message"
                    >
                      {sending ? (
                        <span className="messages-access-spinner" />
                      ) : (
                        <Send size={18} />
                      )}
                    </button>
                  </form>

                  <div className="messages-composer-note">
                    <Check size={13} />
                    Messages are sent through Abi Job.
                  </div>
                </>
              ) : (
                <div className="messages-select-empty">
                  <div className="messages-select-empty-icon">
                    <MessageCircle size={30} />
                  </div>
                  <h3>
                    {loading ? "Loading your inbox" : "Select a conversation"}
                  </h3>
                  <p>
                    {loading
                      ? "Please wait while we retrieve your messages."
                      : "Choose an application conversation from your inbox to view your messages."}
                  </p>
                </div>
              )}
            </section>
          </div>
        </div>
      </section>

      {showNewMessage && (
        <div
          className="messages-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowNewMessage(false);
            }
          }}
        >
          <div
            className="messages-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="messages-modal-title"
          >
            <div className="messages-modal-heading">
              <div>
                <span>START A CONVERSATION</span>
                <h2 id="messages-modal-title">New message</h2>
              </div>
              <button
                onClick={() => setShowNewMessage(false)}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <p>
              Choose an employer connected to one of your job applications.
            </p>

            <label htmlFor="messages-contact">Choose application</label>
            <select
              id="messages-contact"
              value={newMessageTarget}
              onChange={(event) => setNewMessageTarget(event.target.value)}
            >
              {conversations.map((conversation) => (
                <option key={conversation.id} value={conversation.id}>
                  {conversation.role} — {conversation.name}
                </option>
              ))}
            </select>

            <div className="messages-modal-actions">
              <button
                className="messages-modal-cancel"
                onClick={() => setShowNewMessage(false)}
              >
                Cancel
              </button>
              <button
                className="messages-modal-continue"
                onClick={startNewMessage}
                disabled={!newMessageTarget}
              >
                Open conversation
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
