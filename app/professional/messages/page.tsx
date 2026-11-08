
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
  unreadCount: number;
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
  const [loaded, setLoaded] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [mobileChatOpen, setMobileChatOpen] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const loadingRef = useRef(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const initialSelectionHandled = useRef(false);

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
        .select("role, full_name")
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

      const [
        { data: applicationContacts, error: applicationContactsError },
        { data: directContacts, error: directContactsError },
      ] = await Promise.all([
        supabase.rpc("get_message_contacts"),
        supabase.rpc("get_direct_message_contacts"),
      ]);

      if (applicationContactsError) throw applicationContactsError;
      if (directContactsError) throw directContactsError;

      const appContacts = (applicationContacts || []) as ApplicationContactRecord[];
      const directContactRows = (directContacts || []) as DirectContactRecord[];

      const applicationIds = [
        ...new Set(
          appContacts
            .map((contact) => contact.application_id)
            .filter(Boolean)
        ),
      ];

      const directConversationIds = [
        ...new Set(
          directContactRows
            .map((contact) => contact.conversation_id)
            .filter(Boolean)
        ),
      ];

      let applicationMessages: MessageRecord[] = [];
      let directMessages: MessageRecord[] = [];

      if (applicationIds.length > 0) {
        const { data, error: messagesError } = await supabase
          .from("messages")
          .select(
            "id, application_id, sender_id, recipient_id, body, read_at, created_at"
          )
          .in("application_id", applicationIds)
          .order("created_at", { ascending: true });

        if (messagesError) throw messagesError;

        applicationMessages = (data || []) as MessageRecord[];
      }

      if (directConversationIds.length > 0) {
        const { data, error: directMessagesError } = await supabase
          .from("direct_messages")
          .select(
            "id, conversation_id, sender_id, recipient_id, body, read_at, created_at"
          )
          .in("conversation_id", directConversationIds)
          .order("created_at", { ascending: true });

        if (directMessagesError) throw directMessagesError;

        directMessages = (data || []) as MessageRecord[];
      }

      const nextConversations: Conversation[] = [];

      for (const contact of appContacts) {
        const records = applicationMessages
          .filter((message) => message.application_id === contact.application_id)
          .map((message) => ({
            id: message.id,
            senderId: message.sender_id,
            recipientId: message.recipient_id,
            body: message.body,
            readAt: message.read_at,
            createdAt: message.created_at,
          }));

        const sorted = sortMessages(records);
        const lastMessage = sorted[sorted.length - 1];

        nextConversations.push({
          id: `application-${contact.application_id}`,
          kind: "application",
          contactId: contact.contact_id,
          contactName:
            contact.business_name ||
            contact.contact_name ||
            "Employer",
          contactRole: contact.contact_role || "employer",
          avatarUrl: contact.avatar_url || null,
          jobTitle: contact.job_title || null,
          applicationId: contact.application_id,
          directConversationId: null,
          messages: sorted,
          lastActivity: lastMessage?.createdAt || "",
          unreadCount: sorted.filter(
            (message) =>
              message.recipientId === user.id &&
              !message.readAt
          ).length,
        });
      }

      for (const contact of directContactRows) {
        const records = directMessages
          .filter(
            (message) => message.conversation_id === contact.conversation_id
          )
          .map((message) => ({
            id: message.id,
            senderId: message.sender_id,
            recipientId: message.recipient_id,
            body: message.body,
            readAt: message.read_at,
            createdAt: message.created_at,
          }));

        const sorted = sortMessages(records);
        const lastMessage = sorted[sorted.length - 1];

        nextConversations.push({
          id: `direct-${contact.conversation_id}`,
          kind: "direct",
          contactId: contact.contact_id,
          contactName: contact.contact_name || "Job Seeker",
          contactRole: contact.contact_role || "job_seeker",
          avatarUrl: null,
          jobTitle: null,
          applicationId: null,
          directConversationId: contact.conversation_id,
          messages: sorted,
          lastActivity:
            lastMessage?.createdAt || contact.updated_at || contact.created_at,
          unreadCount: sorted.filter(
            (message) =>
              message.recipientId === user.id &&
              !message.readAt
          ).length,
        });
      }

      nextConversations.sort(
        (a, b) =>
          new Date(b.lastActivity || 0).getTime() -
          new Date(a.lastActivity || 0).getTime()
      );

      setConversations(nextConversations);

      if (!initialSelectionHandled.current) {
        const requestedId = new URLSearchParams(
          window.location.search
        ).get("conversation");

        if (requestedId) {
          const requestedConversation = nextConversations.find(
            (conversation) =>
              conversation.id === requestedId ||
              conversation.applicationId === requestedId ||
              conversation.directConversationId === requestedId
          );

          if (requestedConversation) {
            setSelectedId(requestedConversation.id);
          }
        }

        initialSelectionHandled.current = true;
      } else {
        setSelectedId((current) => {
          if (current && nextConversations.some((item) => item.id === current)) {
            return current;
          }

          return nextConversations[0]?.id || "";
        });
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

  useEffect(() => {
    void loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (!userId) return;

    const applicationChannel = supabase
      .channel(`professional-application-messages-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
        },
        () => {
          void loadConversations();
        }
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
        },
        () => {
          void loadConversations();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(applicationChannel);
      void supabase.removeChannel(directChannel);
    };
  }, [supabase, userId, loadConversations]);

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

    const unreadMessages = conversation.messages.filter(
      (message) =>
        message.recipientId === userId && !message.readAt
    );

    if (unreadMessages.length === 0) return;

    setLoadingMessages(true);

    try {
      const unreadIds = unreadMessages.map((message) => message.id);

      if (conversation.kind === "direct") {
        const { error: updateError } = await supabase
          .from("direct_messages")
          .update({ read_at: new Date().toISOString() })
          .in("id", unreadIds)
          .eq("recipient_id", userId)
          .is("read_at", null);

        if (updateError) throw updateError;
      } else {
        const { error: updateError } = await supabase
          .from("messages")
          .update({ read_at: new Date().toISOString() })
          .in("id", unreadIds)
          .eq("recipient_id", userId)
          .is("read_at", null);

        if (updateError) throw updateError;
      }

      setConversations((current) =>
        current.map((item) =>
          item.id === conversation.id
            ? {
                ...item,
                unreadCount: 0,
                messages: item.messages.map((message) =>
                  unreadIds.includes(message.id)
                    ? { ...message, readAt: new Date().toISOString() }
                    : message
                ),
              }
            : item
        )
      );
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
            {getInitials(userName)}
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
          <span>Abi Job</span>
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
                        {conversation.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={conversation.avatarUrl}
                            alt=""
                          />
                        ) : (
                          getInitials(conversation.contactName)
                        )}
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
                            {lastMessage
                              ? lastMessage.body
                              : conversation.kind === "direct"
                                ? "Direct enquiry"
                                : "Application conversation"}
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
                    {selectedConversation.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={selectedConversation.avatarUrl}
                        alt=""
                      />
                    ) : (
                      getInitials(selectedConversation.contactName)
                    )}
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
                  {selectedMessages.length === 0 ? (
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
