
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Logo from "../../../components/Logo";
import ProfileImage from "@/components/ProfileImage";

import {
  Menu,
  X,
  ArrowLeft,
  BriefcaseBusiness,
  Building2,
  Check,
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
  created_at: string;
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
  avatarUrl: string | null;
  color: string;
  unread: number;
  time: string;
  messages: Message[];
  lastMessage: string;
  lastMessageAt: string | null;
  hasLoadedMessages: boolean;
  hasMoreMessages: boolean;
  loadingMessages: boolean;
};

type ConversationSummaryRecord = {
  conversation_kind: "application" | "direct";
  conversation_id: string;
  contact_id: string;
  contact_name: string;
  contact_role: string;
  business_name: string | null;
  avatar_url: string | null;
  job_title: string | null;
  last_message: string | null;
  last_message_at: string | null;
  unread_count: number;
};

type ContactRecord = {
  application_id: string;
  contact_id: string;
  contact_name: string;
  contact_role: string;
  business_name: string | null;
  avatar_url: string | null;
  job_title: string | null;
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
  return (
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "AP"
  );
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileMenuOpen(false);
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [mobileMenuOpen]);

  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [messageText, setMessageText] = useState("");
  const [companyName, setCompanyName] = useState("Your Company");
  const [companyLogoPath, setCompanyLogoPath] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const applicationIdsRef = useRef<string[]>([]);
  const conversationsRef = useRef(conversations);
  const activeIdRef = useRef(activeId);

  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);

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

      if (profileError) throw profileError;

      if (profile?.role !== "employer") {
        router.replace("/dashboard");
        return;
      }

      // Load the employer's own company name.
      // employer_profiles uses user_id, not id.
      const { data: employerProfile, error: employerProfileError } =
        await supabase
          .from("employer_profiles")
          .select("business_name, logo_url")
          .eq("user_id", user.id)
          .maybeSingle();

      if (employerProfileError) throw employerProfileError;

      if (employerProfile?.business_name) {
        setCompanyName(employerProfile.business_name);
      }
      setCompanyLogoPath(employerProfile?.logo_url || null);

      // Load lightweight, role-authorized conversation summaries only.
      const { data: summaries, error: summariesError } = await supabase.rpc(
        "get_message_conversation_summaries"
      );

      if (summariesError) throw summariesError;

      const employerContacts = ((summaries || []) as ConversationSummaryRecord[])
        .filter((item) => item.conversation_kind === "application" && item.contact_role === "applicant");

      applicationIdsRef.current = employerContacts.map((item) => item.conversation_id);

      const nextConversations: Conversation[] = employerContacts.map((item, index) => ({
        id: item.conversation_id,
        applicationId: item.conversation_id,
        applicantId: item.contact_id,
        name: item.contact_name || "Applicant",
        role: "Job applicant",
        job: item.job_title || "Job application",
        initials: getInitials(item.contact_name || "Applicant"),
        avatarUrl: item.avatar_url || null,
        color: COLORS[index % COLORS.length],
        unread: Number(item.unread_count || 0),
        time: item.last_message_at ? formatTime(item.last_message_at) : "",
        messages: [],
        lastMessage: item.last_message || "",
        lastMessageAt: item.last_message_at,
        hasLoadedMessages: false,
        hasMoreMessages: false,
        loadingMessages: false,
      }));

      setConversations((current) => nextConversations.map((next) => {
        const previous = current.find((item) => item.id === next.id);
        return previous ? {
          ...next,
          messages: previous.messages,
          hasLoadedMessages: previous.hasLoadedMessages,
          hasMoreMessages: previous.hasMoreMessages,
          loadingMessages: previous.loadingMessages,
        } : next;
      }));

      setActiveId((currentId) =>
        currentId && nextConversations.some((item) => item.id === currentId)
          ? currentId
          : nextConversations[0]?.id || null
      );
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
  }, [router, supabase]);

  const loadConversationMessages = useCallback(
    async (conversationId: string, mode: "initial" | "older" | "refresh" = "initial") => {
      const conversation = conversationsRef.current.find((item) => item.id === conversationId);
      if (!conversation || !userId) return;
      if (mode === "older" && conversation.messages.length === 0) return;

      setConversations((current) => current.map((item) =>
        item.id === conversationId ? { ...item, loadingMessages: true } : item
      ));

      let query = supabase
        .from("messages")
        .select("id, application_id, sender_id, recipient_id, body, read_at, created_at")
        .eq("application_id", conversation.applicationId);

      const oldest = conversation.messages[0];
      if (mode === "older" && oldest) {
        query = query.lt("created_at", oldest.created_at);
      }

      const { data, error: messagesError } = await query
        .order("created_at", { ascending: false })
        .limit(51);

      if (messagesError) {
        console.error("Unable to load employer message history:", messagesError);
        setError("Unable to load this conversation. Please try again.");
        setConversations((current) => current.map((item) =>
          item.id === conversationId ? { ...item, loadingMessages: false } : item
        ));
        return;
      }

      const records = (data || []) as MessageRecord[];
      const page = records.slice(0, 50).reverse().map((record) => ({
        id: record.id,
        sender_id: record.sender_id,
        recipient_id: record.recipient_id,
        text: record.body,
        time: formatMessageTime(record.created_at),
        created_at: record.created_at,
        read_at: record.read_at,
      }));

      setConversations((current) => current.map((item) => {
        if (item.id !== conversationId) return item;
        let messages: Message[];
        if (mode === "older") {
          messages = [...page, ...item.messages];
        } else if (mode === "refresh") {
          const merged = new Map([...item.messages, ...page].map((message) => [message.id, message]));
          messages = [...merged.values()].sort((a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
        } else {
          messages = page;
        }
        const newest = messages[messages.length - 1];
        return {
          ...item,
          messages,
          hasLoadedMessages: true,
          hasMoreMessages: records.length > 50,
          loadingMessages: false,
          lastMessage: newest?.text || item.lastMessage,
          lastMessageAt: newest ? records.find((record) => record.id === newest.id)?.created_at || item.lastMessageAt : item.lastMessageAt,
          time: newest ? newest.time : item.time,
        };
      }));
    },
    [supabase, userId]
  );

  useEffect(() => {
    const conversation = conversations.find((item) => item.id === activeId);
    if (activeId && userId && conversation && !conversation.hasLoadedMessages && !conversation.loadingMessages) {
      void loadConversationMessages(activeId, "initial");
    }
  }, [activeId, userId, conversations, loadConversationMessages]);

  // Load conversations when the page opens.
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Listen only to messages sent to or by this employer.
  useEffect(() => {
    if (!userId) return;

    const handleMessageChange = (payload: {
      new: Record<string, unknown>;
      old: Record<string, unknown>;
    }) => {
      const changedMessage = (payload.new || payload.old) as Partial<MessageRecord>;
      if (
        !changedMessage.application_id ||
        !applicationIdsRef.current.includes(changedMessage.application_id)
      ) return;

      void loadConversations();
      const active = conversationsRef.current.find((item) => item.id === activeIdRef.current);
      if (active?.applicationId === changedMessage.application_id) {
        void loadConversationMessages(active.id, "refresh");
      }
    };

    const channel = supabase
      .channel(`employer-messages-realtime-${userId}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "messages",
        filter: `recipient_id=eq.${userId}`,
      }, handleMessageChange)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "messages",
        filter: `sender_id=eq.${userId}`,
      }, handleMessageChange)
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [loadConversations, loadConversationMessages, supabase, userId]);

  async function openConversation(id: string) {
    setActiveId(id);
    if (!userId) return;
    const conversation = conversationsRef.current.find((item) => item.id === id);
    if (!conversation || conversation.unread === 0) return;

    const readAt = new Date().toISOString();
    const { error: updateError } = await supabase
      .from("messages")
      .update({ read_at: readAt })
      .eq("application_id", conversation.applicationId)
      .eq("recipient_id", userId)
      .is("read_at", null)
      .select("id");

    if (updateError) {
      console.error("Unable to mark messages as read:", updateError);
      setError("Unable to update message read status.");
      return;
    }

    setConversations((previous) => previous.map((item) =>
      item.id === id ? {
        ...item,
        unread: 0,
        messages: item.messages.map((message) =>
          message.recipient_id === userId && !message.read_at
            ? { ...message, read_at: readAt }
            : message
        ),
      } : item
    ));
  }

  async function loadOlderMessages() {
    if (!activeConversation || activeConversation.loadingMessages) return;
    await loadConversationMessages(activeConversation.id, "older");
  }

  async function sendMessage() {
    const trimmedMessage = messageText.trim();

    if (
      !trimmedMessage ||
      !activeConversation ||
      !userId ||
      !activeConversation.applicantId ||
      sending
    ) {
      return;
    }

    setSending(true);
    setError("");

    try {
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
        created_at: savedMessage.created_at,
        read_at: savedMessage.read_at,
      };

      setConversations((previous) =>
        previous.map((conversation) =>
          conversation.id === activeConversation.id
            ? {
                ...conversation,
                messages: [...conversation.messages, newMessage],
                lastMessage: newMessage.text,
                lastMessageAt: savedMessage.created_at,
                time: formatTime(savedMessage.created_at),
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
      {mobileMenuOpen && (
        <button
                type="button"
                className="employer-mobile-menu-overlay"
                aria-label="Close employer navigation"
                tabIndex={mobileMenuOpen ? 0 : -1}
                onClick={() => setMobileMenuOpen(false)}
              />
      )}
      <aside
        className={`employer-messages-sidebar ${mobileMenuOpen ? "mobile-open" : ""}`}
        onClick={(event) => {
          if ((event.target as HTMLElement).closest("a")) setMobileMenuOpen(false);
        }}
      >
        <button
          type="button"
          className="employer-mobile-menu-close"
          aria-label="Close navigation menu"
          onClick={() => setMobileMenuOpen(false)}
        >
          <X size={21} />
        </button>
        <div className="employer-messages-brand">
          <Logo href="/" size="medium" light />
        </div>

        <div className="employer-messages-company">
          <div className="employer-messages-company-icon">
            <ProfileImage name={companyName} path={companyLogoPath} fit="contain" />
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
          <button
            type="button"
            className="employer-mobile-menu-toggle"
            aria-label="Open navigation menu"
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu size={22} />
          </button>
          <div>
            <span>EMPLOYER WORKSPACE</span>
            <p>Connect with candidates and manage conversations</p>
          </div>

          <div className="employer-messages-account">
            <div className="employer-messages-account-icon">
              <ProfileImage name={companyName} path={companyLogoPath} fit="contain" />
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
            <div className="employer-messages-notice" role="alert">
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
                          <ProfileImage name={conversation.name} path={conversation.avatarUrl} fit={conversation.role.toLowerCase().includes("employer") ? "contain" : "cover"} />
                        </span>

                        <span className="employer-messages-conversation-info">
                          <span className="employer-messages-conversation-top">
                            <strong>{conversation.name}</strong>
                            <small>
                              {conversation.time}
                            </small>
                          </span>

                          <span className="employer-messages-job">
                            {conversation.job}
                          </span>

                          <span className="employer-messages-preview">
                            {conversation.lastMessage || "No messages yet. Start a conversation."}
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
                        <ProfileImage name={activeConversation.name} path={activeConversation.avatarUrl} fit={activeConversation.role.toLowerCase().includes("employer") ? "contain" : "cover"} />
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

                    {activeConversation.loadingMessages && (
                      <div className="employer-messages-history-status" role="status">
                        Loading messages...
                      </div>
                    )}

                    {activeConversation.hasMoreMessages && (
                      <button
                        type="button"
                        className="employer-messages-load-older"
                        onClick={() => void loadOlderMessages()}
                        disabled={activeConversation.loadingMessages}
                      >
                        {activeConversation.loadingMessages ? "Loading older messages..." : "Load older messages"}
                      </button>
                    )}

                    {activeConversation.messages.length === 0 && activeConversation.loadingMessages ? null : activeConversation.messages.length === 0 ? (
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
                              <ProfileImage name={activeConversation.name} path={activeConversation.avatarUrl} />
                            </span>
                          )}

                          <div className="employer-message-content">
                            <div className="employer-message-bubble">
                              {message.text}
                            </div>

                            <span className="employer-message-time">
                              {message.time}

                              {message.sender_id === userId &&
                                (message.read_at ? (
                                  <CheckCheck size={14} />
                                ) : (
                                  <Check size={14} />
                                ))}
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
