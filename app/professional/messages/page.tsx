
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  BriefcaseBusiness,
  Check,
  CheckCheck,
  LoaderCircle,
  Menu,
  MessageCircle,
  Search,
  Send,
  UserRound,
  X,
} from "lucide-react";
import Logo from "@/components/Logo";
import { createClient } from "@/lib/supabase/client";
import ProfileImage from "@/components/ProfileImage";
import "./messages.css";

type ConversationKind = "direct" | "application";

type MessageRecord = {
  id: string;
  sender_id: string;
  recipient_id: string;
  body: string;
  read_at: string | null;
  created_at: string;
  application_id?: string | null;
  conversation_id?: string | null;
};

type ApplicationContactRecord = {
  application_id: string;
  contact_id: string;
  contact_name: string;
  contact_role: string;
  business_name: string | null;
  avatar_url: string | null;
  job_title: string | null;
};

type DirectContactRecord = {
  conversation_id: string;
  contact_id: string;
  contact_name: string;
  contact_role: string;
  created_at: string;
  updated_at: string;
};

type ChatMessage = {
  id: string;
  senderId: string;
  recipientId: string;
  body: string;
  readAt: string | null;
  createdAt: string;
};

type Conversation = {
  id: string;
  kind: ConversationKind;
  contactId: string;
  contactName: string;
  contactRole: string;
  avatarUrl: string | null;
  jobTitle: string | null;
  applicationId: string | null;
  directConversationId: string | null;
  messages: ChatMessage[];
  lastActivity: string;
  lastMessagePreview: string;
  unreadCount: number;
  hasLoadedMessages: boolean;
  hasMoreMessages: boolean;
  loadingMessages: boolean;
};

type ConversationSummaryRecord = {
  conversation_kind: ConversationKind;
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

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "?";
}

function formatTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();

  if (sameDay) {
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return date.toLocaleDateString([], {
    day: "numeric",
    month: "short",
  });
}

function formatMessageDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  if (date.toDateString() === now.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";

  return date.toLocaleDateString([], {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function sortMessages(messages: ChatMessage[]) {
  return [...messages].sort(
    (a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
}

export default function ProfessionalMessagesPage() {
  const supabase = useMemo(() => createClient(), []);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [messageInput, setMessageInput] = useState("");
  const [userId, setUserId] = useState("");
  const [userName, setUserName] = useState("Professional");
  const [userAvatarPath, setUserAvatarPath] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [mobileChatOpen, setMobileChatOpen] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const loadingRef = useRef(false);
  const conversationsRef = useRef(conversations);
  const selectedIdRef = useRef(selectedId);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const initialSelectionHandled = useRef(false);

  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);

  const loadConversations = useCallback(async () => {
    if (loadingRef.current) return;

    loadingRef.current = true;

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;

      if (!user) {
        window.location.href = "/login?next=%2Fprofessional%2Fmessages";
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role, full_name, avatar_url")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) throw profileError;

      if (profile?.role !== "professional") {
        window.location.href =
          profile?.role === "job_seeker"
            ? "/dashboard"
            : profile?.role === "employer"
              ? "/employer/dashboard"
              : "/login";

        return;
      }

      setUserId(user.id);
      setUserName(profile.full_name || "Professional");
      setUserAvatarPath(profile.avatar_url || null);

      const { data: summaryRows, error: summaryError } = await supabase.rpc(
        "get_message_conversation_summaries"
      );
      if (summaryError) throw summaryError;

      const rows = (summaryRows || []) as ConversationSummaryRecord[];
      const nextConversations: Conversation[] = rows.map((row) => {
        const kind = row.conversation_kind;
        const isDirect = kind === "direct";
        return {
          id: `${kind}-${row.conversation_id}`,
          kind,
          contactId: row.contact_id,
          contactName: row.contact_name || (isDirect ? "Job Seeker" : "Employer"),
          contactRole: row.contact_role || (isDirect ? "job_seeker" : "employer"),
          avatarUrl: row.avatar_url || null,
          jobTitle: row.job_title || null,
          applicationId: isDirect ? null : row.conversation_id,
          directConversationId: isDirect ? row.conversation_id : null,
          messages: [],
          lastActivity: row.last_message_at || "",
          lastMessagePreview: row.last_message || "",
          unreadCount: Number(row.unread_count || 0),
          hasLoadedMessages: false,
          hasMoreMessages: false,
          loadingMessages: false,
        };
      });

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

      if (!initialSelectionHandled.current) {
        const requestedId = new URLSearchParams(window.location.search).get("conversation");
        const requestedConversation = requestedId
          ? nextConversations.find((item) =>
              item.id === requestedId ||
              item.applicationId === requestedId ||
              item.directConversationId === requestedId
            )
          : undefined;
        setSelectedId(requestedConversation?.id || nextConversations[0]?.id || "");
        initialSelectionHandled.current = true;
      } else {
        setSelectedId((current) =>
          current && nextConversations.some((item) => item.id === current)
            ? current
            : nextConversations[0]?.id || ""
        );
      }

      setError("");
    } catch (err) {
      console.error("Unable to load professional conversations:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Your conversations could not be loaded. Please try again."
      );
    } finally {
      setLoaded(true);
      loadingRef.current = false;
    }
  }, [supabase]);

  const loadConversationMessages = useCallback(
    async (conversationId: string, mode: "initial" | "older" | "refresh" = "initial") => {
      const conversation = conversationsRef.current.find((item) => item.id === conversationId);
      if (!conversation || !userId) return;
      if (mode === "older" && conversation.messages.length === 0) return;

      setConversations((current) => current.map((item) =>
        item.id === conversationId ? { ...item, loadingMessages: true } : item
      ));

      const columns = "id, sender_id, recipient_id, body, read_at, created_at";
      const oldest = conversation.messages[0];
      let data: MessageRecord[] = [];
      let historyError: { message: string } | null = null;

      if (conversation.kind === "direct") {
        let query = supabase.from("direct_messages")
          .select(`${columns}, conversation_id`)
          .eq("conversation_id", conversation.directConversationId!);
        if (mode === "older" && oldest) query = query.lt("created_at", oldest.createdAt);
        const result = await query.order("created_at", { ascending: false }).limit(51);
        data = (result.data || []) as MessageRecord[];
        historyError = result.error;
      } else {
        let query = supabase.from("messages")
          .select(`${columns}, application_id`)
          .eq("application_id", conversation.applicationId!);
        if (mode === "older" && oldest) query = query.lt("created_at", oldest.createdAt);
        const result = await query.order("created_at", { ascending: false }).limit(51);
        data = (result.data || []) as MessageRecord[];
        historyError = result.error;
      }

      if (historyError) {
        console.error("Unable to load professional message history:", historyError);
        setError("Unable to load this conversation. Please try again.");
        setConversations((current) => current.map((item) =>
          item.id === conversationId ? { ...item, loadingMessages: false } : item
        ));
        return;
      }

      const records = data;
      const page = records.slice(0, 50).reverse().map((record) => ({
        id: record.id,
        senderId: record.sender_id,
        recipientId: record.recipient_id,
        body: record.body,
        readAt: record.read_at,
        createdAt: record.created_at,
      }));

      setConversations((current) => current.map((item) => {
        if (item.id !== conversationId) return item;
        let messages: ChatMessage[];
        if (mode === "older") messages = [...page, ...item.messages];
        else if (mode === "refresh") {
          const merged = new Map([...item.messages, ...page].map((message) => [message.id, message]));
          messages = [...merged.values()].sort((a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        } else messages = page;

        const newest = messages[messages.length - 1];
        return {
          ...item,
          messages,
          hasLoadedMessages: true,
          hasMoreMessages: records.length > 50,
          loadingMessages: false,
          lastMessagePreview: newest?.body || item.lastMessagePreview,
          lastActivity: newest?.createdAt || item.lastActivity,
        };
      }));
    },
    [supabase, userId]
  );

  useEffect(() => {
    const conversation = conversations.find((item) => item.id === selectedId);
    if (selectedId && userId && conversation && !conversation.hasLoadedMessages && !conversation.loadingMessages) {
      void loadConversationMessages(selectedId, "initial");
    }
  }, [selectedId, userId, conversations, loadConversationMessages]);

  const loadOlderMessages = async () => {
    if (!selectedConversation || selectedConversation.loadingMessages) return;
    await loadConversationMessages(selectedConversation.id, "older");
  };

  useEffect(() => {
    void loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (!userId) return;

    const refreshActiveConversation = (kind: ConversationKind) => {
      void loadConversations();
      const active = conversationsRef.current.find((item) => item.id === selectedIdRef.current);
      if (active?.kind === kind) {
        void loadConversationMessages(active.id, "refresh");
      }
    };

    const applicationChannel = supabase
      .channel(`professional-application-messages-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `recipient_id=eq.${userId}`,
        },
        () => refreshActiveConversation("application")
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `sender_id=eq.${userId}`,
        },
        () => refreshActiveConversation("application")
      )
      .subscribe();

    const directChannel = supabase
      .channel(`professional-direct-messages-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "direct_messages",
          filter: `recipient_id=eq.${userId}`,
        },
        () => refreshActiveConversation("direct")
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "direct_messages",
          filter: `sender_id=eq.${userId}`,
        },
        () => refreshActiveConversation("direct")
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(applicationChannel);
      void supabase.removeChannel(directChannel);
    };
  }, [supabase, userId, loadConversations, loadConversationMessages]);

  const selectedConversation = conversations.find(
    (conversation) => conversation.id === selectedId
  );

  const filteredConversations = conversations.filter((conversation) => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) return true;

    return (
      conversation.contactName.toLowerCase().includes(query) ||
      (conversation.jobTitle || "").toLowerCase().includes(query) ||
      conversation.contactRole.toLowerCase().includes(query)
    );
  });

  const totalUnread = conversations.reduce(
    (total, conversation) => total + conversation.unreadCount,
    0
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedConversation?.messages.length, selectedId]);

  const openConversation = async (conversation: Conversation) => {
    setSelectedId(conversation.id);
    setMobileChatOpen(true);
    setError("");
    if (!userId || conversation.unreadCount === 0) return;

    setLoadingMessages(true);
    try {
      const readAt = new Date().toISOString();
      const result = conversation.kind === "direct"
        ? await supabase.from("direct_messages").update({ read_at: readAt })
            .eq("conversation_id", conversation.directConversationId!)
            .eq("recipient_id", userId).is("read_at", null).select("id")
        : await supabase.from("messages").update({ read_at: readAt })
            .eq("application_id", conversation.applicationId!)
            .eq("recipient_id", userId).is("read_at", null).select("id");

      if (result.error) throw result.error;
      const changedIds = new Set((result.data || []).map((item: { id: string }) => item.id));
      setConversations((current) => current.map((item) =>
        item.id === conversation.id ? {
          ...item,
          unreadCount: 0,
          messages: item.messages.map((message) =>
            changedIds.has(message.id) ? { ...message, readAt } : message
          ),
        } : item
      ));
    } catch (err) {
      console.error("Unable to mark messages as read:", err);
      setError("Messages opened, but read receipts could not be updated.");
    } finally {
      setLoadingMessages(false);
    }
  };

  const sendMessage = async () => {
    const text = messageInput.trim();
    const conversation = selectedConversation;

    if (
      !text ||
      text.length > 5000 ||
      !conversation ||
      !userId ||
      !conversation.contactId ||
      sending
    ) {
      return;
    }

    setSending(true);
    setError("");

    try {
      if (conversation.kind === "direct") {
        if (!conversation.directConversationId) {
          throw new Error("Invalid direct conversation.");
        }

        const { error: sendError } = await supabase
          .from("direct_messages")
          .insert({
            conversation_id: conversation.directConversationId,
            sender_id: userId,
            recipient_id: conversation.contactId,
            body: text,
          });

        if (sendError) throw sendError;
      } else {
        if (!conversation.applicationId) {
          throw new Error("Invalid application conversation.");
        }

        const { error: sendError } = await supabase
          .from("messages")
          .insert({
            application_id: conversation.applicationId,
            sender_id: userId,
            recipient_id: conversation.contactId,
            body: text,
          });

        if (sendError) throw sendError;
      }

      setMessageInput("");
      await loadConversationMessages(conversation.id, "refresh");
      await loadConversations();
      inputRef.current?.focus();
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
  };

  const handleComposerKeyDown = (
    event: React.KeyboardEvent<HTMLTextAreaElement>
  ) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage();
    }
  };

  const selectedMessages = selectedConversation?.messages || [];

  let previousDate = "";

  return (
    <div className="professional-messages-page">
      <aside className="professional-messages-sidebar">
        <div className="professional-messages-brand">
          <Logo />
        </div>

        <div className="professional-sidebar-profile">
          <div className="professional-sidebar-avatar">
            <ProfileImage name={userName} path={userAvatarPath} />
          </div>
          <div>
            <strong>{userName}</strong>
            <span>Professional account</span>
          </div>
        </div>

        <nav className="professional-messages-nav">
          <Link href="/professional/dashboard">
            <BriefcaseBusiness size={19} />
            <span>Dashboard</span>
          </Link>
          <Link href="/professional/opportunities">
            <Search size={19} />
            <span>Opportunities</span>
          </Link>
          <Link href="/professional/applications">
            <BriefcaseBusiness size={19} />
            <span>Applications</span>
          </Link>
          <Link href="/professional/messages" className="active">
            <MessageCircle size={19} />
            <span>Messages</span>
            {totalUnread > 0 && (
              <span className="professional-nav-count">
                {totalUnread > 99 ? "99+" : totalUnread}
              </span>
            )}
          </Link>
          <Link href="/professional/notifications">
            <AlertCircle size={19} />
            <span>Notifications</span>
          </Link>
          <Link href="/professional/profile">
            <UserRound size={19} />
            <span>My Profile</span>
          </Link>
          <Link href="/professional/settings">
            <UserRound size={19} />
            <span>Settings</span>
          </Link>
        </nav>

        <div className="professional-sidebar-footer">
          <span>Abijob</span>
          <small>Opportunity starts here</small>
        </div>
      </aside>

      <main className="professional-messages-main">
        <header className="professional-messages-topbar">
          <div>
            <span className="professional-topbar-eyebrow">
              PROFESSIONAL WORKSPACE
            </span>
            <h1>Messages</h1>
            <p>Communicate with Job Seekers and Employers.</p>
          </div>

          <div className="professional-topbar-status">
            <span className="professional-online-dot" />
            Messaging inbox
          </div>
        </header>

        {error && (
          <div className="professional-message-error" role="alert">
            <AlertCircle size={18} />
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setError("")}
              aria-label="Dismiss error"
            >
              <X size={17} />
            </button>
          </div>
        )}

        <section className="professional-chat-layout">
          <aside
            className={`professional-conversation-panel ${
              mobileChatOpen ? "mobile-hidden" : ""
            }`}
          >
            <div className="professional-conversation-heading">
              <div>
                <h2>Your conversations</h2>
                <p>
                  {conversations.length}{" "}
                  {conversations.length === 1 ? "conversation" : "conversations"}
                </p>
              </div>
              <span className="professional-conversation-total">
                {totalUnread}
              </span>
            </div>

            <label className="professional-conversation-search">
              <Search size={18} />
              <input
                type="search"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </label>

            <div className="professional-conversation-list">
              {!loaded ? (
                <div className="professional-chat-loading">
                  <LoaderCircle className="spin" size={25} />
                  <span>Loading conversations...</span>
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="professional-chat-empty-list">
                  <div className="professional-empty-icon">
                    <MessageCircle size={25} />
                  </div>
                  <strong>
                    {searchQuery
                      ? "No matching conversations"
                      : "No conversations yet"}
                  </strong>
                  <p>
                    {searchQuery
                      ? "Try another name or search term."
                      : "Messages from Job Seekers and Employers will appear here."}
                  </p>
                </div>
              ) : (
                filteredConversations.map((conversation) => {
                  const lastMessage =
                    conversation.messages[conversation.messages.length - 1];

                  return (
                    <button
                      type="button"
                      key={conversation.id}
                      className={`professional-conversation-item ${
                        selectedId === conversation.id ? "selected" : ""
                      }`}
                      onClick={() => void openConversation(conversation)}
                    >
                      <div className="professional-contact-avatar">
                        <ProfileImage name={conversation.contactName} path={conversation.avatarUrl} />
                      </div>

                      <div className="professional-contact-details">
                        <div className="professional-contact-topline">
                          <strong>{conversation.contactName}</strong>
                          <time>
                            {lastMessage
                              ? formatTime(lastMessage.createdAt)
                              : formatTime(conversation.lastActivity)}
                          </time>
                        </div>

                        <div className="professional-contact-preview">
                          <span>
                            {conversation.lastMessagePreview ||
                              (conversation.kind === "direct"
                                ? "Direct enquiry"
                                : "Application conversation")}
                          </span>

                          {conversation.unreadCount > 0 && (
                            <b>{conversation.unreadCount}</b>
                          )}
                        </div>

                        <div className="professional-contact-meta">
                          <span
                            className={
                              conversation.kind === "direct"
                                ? "direct-label"
                                : "application-label"
                            }
                          >
                            {conversation.kind === "direct"
                              ? "Job Seeker"
                              : "Employer"}
                          </span>

                          {conversation.jobTitle && (
                            <span className="professional-contact-job">
                              {conversation.jobTitle}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </aside>

          <section
            className={`professional-chat-panel ${
              mobileChatOpen ? "mobile-visible" : ""
            }`}
          >
            {!selectedConversation ? (
              <div className="professional-chat-placeholder">
                <div className="professional-empty-icon large">
                  <MessageCircle size={34} />
                </div>
                <h2>Select a conversation</h2>
                <p>
                  Choose a conversation to read messages and reply.
                </p>
              </div>
            ) : (
              <>
                <div className="professional-chat-header">
                  <button
                    type="button"
                    className="professional-mobile-back"
                    onClick={() => setMobileChatOpen(false)}
                    aria-label="Back to conversations"
                  >
                    <ArrowLeft size={20} />
                  </button>

                  <div className="professional-contact-avatar header-avatar">
                    <ProfileImage name={selectedConversation.contactName} path={selectedConversation.avatarUrl} />
                  </div>

                  <div className="professional-chat-contact-info">
                    <strong>{selectedConversation.contactName}</strong>
                    <span>
                      {selectedConversation.kind === "direct"
                        ? "Job Seeker · Direct enquiry"
                        : `Employer · ${
                            selectedConversation.jobTitle ||
                            "Application conversation"
                          }`}
                    </span>
                  </div>

                  <div className="professional-chat-header-type">
                    {selectedConversation.kind === "direct"
                      ? "DIRECT MESSAGE"
                      : "JOB APPLICATION"}
                  </div>
                </div>

                <div className="professional-chat-messages">
                  {selectedConversation.loadingMessages && (
                    <div className="professional-history-status" role="status">
                      Loading messages...
                    </div>
                  )}

                  {selectedConversation.hasMoreMessages && (
                    <button
                      type="button"
                      className="professional-load-older"
                      onClick={() => void loadOlderMessages()}
                      disabled={selectedConversation.loadingMessages}
                    >
                      {selectedConversation.loadingMessages ? "Loading older messages..." : "Load older messages"}
                    </button>
                  )}

                  {selectedMessages.length === 0 && selectedConversation.loadingMessages ? null : selectedMessages.length === 0 ? (
                    <div className="professional-no-messages">
                      <div className="professional-empty-icon">
                        <MessageCircle size={25} />
                      </div>
                      <strong>Start the conversation</strong>
                      <p>
                        Send a message to{" "}
                        {selectedConversation.contactName}.
                      </p>
                    </div>
                  ) : (
                    selectedMessages.map((message) => {
                      const ownMessage = message.senderId === userId;
                      const messageDate = formatMessageDate(message.createdAt);
                      const showDate = messageDate !== previousDate;
                      previousDate = messageDate;

                      return (
                        <div key={message.id}>
                          {showDate && (
                            <div className="professional-message-date">
                              <span>{messageDate}</span>
                            </div>
                          )}

                          <div
                            className={`professional-message-row ${
                              ownMessage ? "own-message" : "received-message"
                            }`}
                          >
                            <div className="professional-message-bubble">
                              <p>{message.body}</p>
                              <div className="professional-message-time">
                                <time>{formatTime(message.createdAt)}</time>
                                {ownMessage &&
                                  (message.readAt ? (
                                    <CheckCheck
                                      size={15}
                                      aria-label="Read"
                                      className="message-read"
                                    />
                                  ) : (
                                    <Check
                                      size={15}
                                      aria-label="Sent"
                                    />
                                  ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}

                  <div ref={bottomRef} />
                </div>

                <div className="professional-chat-composer">
                  {loadingMessages && (
                    <span className="professional-read-status">
                      Updating read receipts...
                    </span>
                  )}

                  <div className="professional-composer-box">
                    <textarea
                      ref={inputRef}
                      value={messageInput}
                      onChange={(event) =>
                        setMessageInput(event.target.value.slice(0, 5000))
                      }
                      onKeyDown={handleComposerKeyDown}
                      placeholder={`Message ${selectedConversation.contactName}...`}
                      rows={2}
                      maxLength={5000}
                      aria-label="Write a message"
                    />

                    <div className="professional-composer-footer">
                      <span>{messageInput.length}/5000 · Enter to send</span>
                      <button
                        type="button"
                        onClick={() => void sendMessage()}
                        disabled={
                          !messageInput.trim() ||
                          messageInput.trim().length > 5000 ||
                          sending
                        }
                        aria-label="Send message"
                      >
                        {sending ? (
                          <LoaderCircle className="spin" size={18} />
                        ) : (
                          <>
                            <Send size={17} />
                            <span>Send</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                  <p className="professional-composer-note">
                    Keep your communication respectful and professional.
                  </p>
                </div>
              </>
            )}
          </section>
        </section>
      </main>
    </div>
  );
}
