
"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import Logo from "../../components/Logo";
import { createClient } from "@/lib/supabase/client";
import {
  ArrowLeft,
  Bell,
  BriefcaseBusiness,
  Check,
  CheckCheck,
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

type ConversationKind = "application" | "direct";

type ApplicationMessageRecord = {
  id: string;
  application_id: string;
  sender_id: string;
  recipient_id: string;
  body: string;
  read_at: string | null;
  created_at: string;
};

type DirectMessageRecord = {
  id: string;
  conversation_id: string;
  sender_id: string;
  recipient_id: string;
  body: string;
  read_at: string | null;
  created_at: string;
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

type ChatMessage = {
  id: string;
  text: string;
  time: string;
  createdAt: string;
  sender: "me" | "them";
  readAt: string | null;
};

type Conversation = {
  id: string;
  kind: ConversationKind;
  databaseId: string;
  recipientId: string;
  name: string;
  role: string;
  initials: string;
  color: string;
  unread: number;
  lastMessage: string;
  time: string;
  lastMessageAt: string | null;
  messages: ChatMessage[];
  hasLoadedMessages: boolean;
  hasMoreMessages: boolean;
  loadingMessages: boolean;
};

const AVATAR_COLORS = ["green", "blue", "orange", "purple", "teal"];

function formatTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatLastMessageTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

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
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0))
      .join("")
      .toUpperCase() || "AB"
  );
}

function toChatMessage(
  message: ApplicationMessageRecord | DirectMessageRecord,
  currentUserId: string
): ChatMessage {
  return {
    id: message.id,
    text: message.body,
    time: formatTime(message.created_at),
    createdAt: message.created_at,
    sender: message.sender_id === currentUserId ? "me" : "them",
    readAt: message.read_at,
  };
}

function normaliseRole(value: unknown) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/_/g, "-");
}

export default function MessagesPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

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

  const loadConversations = useCallback(
    async (_currentUserId: string) => {
      setError("");
      const { data, error: summaryError } = await supabase.rpc(
        "get_message_conversation_summaries"
      );
      if (summaryError) {
        console.error("Could not load messaging summaries:", summaryError);
        setError("We could not load your messaging contacts. Please refresh the page.");
        setConversations([]);
        return;
      }

      const rows = (data || []) as ConversationSummaryRecord[];
      const nextConversations: Conversation[] = rows.map((row, index) => {
        const isDirect = row.conversation_kind === "direct";
        const name =
          row.business_name?.trim() ||
          row.contact_name?.trim() ||
          (isDirect ? "Professional" : "Employer");
        return {
          id: `${row.conversation_kind}:${row.conversation_id}`,
          kind: row.conversation_kind,
          databaseId: row.conversation_id,
          recipientId: row.contact_id,
          name,
          role: isDirect ? "Skilled Professional" : row.job_title?.trim() || "Job application",
          initials: getInitials(name),
          color: AVATAR_COLORS[index % AVATAR_COLORS.length],
          unread: Number(row.unread_count || 0),
          lastMessage: row.last_message || (isDirect
            ? "Start a conversation with this professional."
            : "Start a conversation about this application."),
          time: row.last_message_at ? formatLastMessageTime(row.last_message_at) : "",
          lastMessageAt: row.last_message_at,
          messages: [],
          hasLoadedMessages: false,
          hasMoreMessages: false,
          loadingMessages: false,
        };
      });

      setConversations((current) =>
        nextConversations.map((next) => {
          const previous = current.find((item) => item.id === next.id);
          return previous ? {
            ...next,
            messages: previous.messages,
            hasLoadedMessages: previous.hasLoadedMessages,
            hasMoreMessages: previous.hasMoreMessages,
            loadingMessages: previous.loadingMessages,
          } : next;
        })
      );

      setActiveId((currentId) => {
        if (currentId && nextConversations.some((item) => item.id === currentId)) return currentId;
        if (typeof window !== "undefined") {
          const requestedId = new URLSearchParams(window.location.search).get("conversation");
          const requested = nextConversations.find((item) =>
            item.kind === "direct" && item.databaseId === requestedId
          );
          if (requested) return requested.id;
        }
        return nextConversations[0]?.id || "";
      });
    },
    [supabase]
  );

  const loadConversationMessages = useCallback(
    async (conversationId: string, mode: "initial" | "older" | "refresh" = "initial") => {
      const conversation = conversations.find((item) => item.id === conversationId);
      if (!conversation || !userId) return;
      if (mode === "older" && conversation.messages.length === 0) return;

      setConversations((current) => current.map((item) =>
        item.id === conversationId ? { ...item, loadingMessages: true } : item
      ));

      const oldestMessage = conversation.messages[0];
      const columns = "id, sender_id, recipient_id, body, read_at, created_at";
      let rows: Array<ApplicationMessageRecord | DirectMessageRecord> = [];
      let queryError: { message: string } | null = null;

      if (conversation.kind === "application") {
        let query = supabase.from("messages")
          .select(`${columns}, application_id`)
          .eq("application_id", conversation.databaseId);
        if (mode === "older" && oldestMessage) query = query.lt("created_at", oldestMessage.createdAt);
        const result = await query.order("created_at", { ascending: false }).limit(51);
        rows = (result.data || []) as ApplicationMessageRecord[];
        queryError = result.error;
      } else {
        let query = supabase.from("direct_messages")
          .select(`${columns}, conversation_id`)
          .eq("conversation_id", conversation.databaseId);
        if (mode === "older" && oldestMessage) query = query.lt("created_at", oldestMessage.createdAt);
        const result = await query.order("created_at", { ascending: false }).limit(51);
        rows = (result.data || []) as DirectMessageRecord[];
        queryError = result.error;
      }

      if (queryError) {
        console.error("Could not load conversation history:", queryError);
        setError("We could not load this conversation. Please try again.");
        setConversations((current) => current.map((item) =>
          item.id === conversationId ? { ...item, loadingMessages: false } : item
        ));
        return;
      }

      const page = rows.slice(0, 50).reverse().map((message) => toChatMessage(message, userId));
      setConversations((current) => current.map((item) => {
        if (item.id !== conversationId) return item;
        let messages: ChatMessage[];
        if (mode === "older") {
          messages = [...page, ...item.messages];
        } else if (mode === "refresh") {
          const merged = new Map([...item.messages, ...page].map((message) => [message.id, message]));
          messages = [...merged.values()].sort((a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        } else {
          messages = page;
        }
        const newest = messages[messages.length - 1];
        return {
          ...item,
          messages,
          hasLoadedMessages: true,
          hasMoreMessages: mode === "older" ? rows.length > 50
            : mode === "refresh" ? item.hasMoreMessages || rows.length > 50
            : rows.length > 50,
          loadingMessages: false,
          ...(newest ? {
            lastMessage: newest.text,
            time: formatLastMessageTime(newest.createdAt),
            lastMessageAt: newest.createdAt,
          } : {}),
        };
      }));
    },
    [conversations, supabase, userId]
  );

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
        router.replace("/login?next=%2Fmessages");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role, full_name")
        .eq("id", user.id)
        .maybeSingle();

      if (cancelled) return;

      if (profileError || !profile) {
        console.error("Could not verify account role:", profileError);
        setError("We could not verify your account. Please try again.");
        setLoading(false);
        setAccessChecked(true);
        return;
      }

      const role = normaliseRole(profile.role);

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

      if (
        role !== "job-seeker" &&
        role !== "jobseeker" &&
        role !== "seeker"
      ) {
        router.replace("/dashboard");
        return;
      }

      setUserId(user.id);
      setUserName(profile.full_name?.trim() || "Job Seeker");
      setAccessChecked(true);

      await loadConversations(user.id);

      if (!cancelled) {
        setLoading(false);
      }
    }

    void initialise();

    return () => {
      cancelled = true;
    };
  }, [router, supabase, loadConversations]);

  // Subscribe once per signed-in user. Both message systems are monitored.
  // The reload reads only conversations returned by the user's contact RPCs.
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`job-seeker-messages-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `recipient_id=eq.${userId}`,
        },
        () => {
          void loadConversations(userId);
          if (activeId) void loadConversationMessages(activeId, "refresh");
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `sender_id=eq.${userId}`,
        },
        () => {
          void loadConversations(userId);
          if (activeId) void loadConversationMessages(activeId, "refresh");
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "direct_messages",
          filter: `recipient_id=eq.${userId}`,
        },
        () => {
          void loadConversations(userId);
          if (activeId) void loadConversationMessages(activeId, "refresh");
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "direct_messages",
          filter: `sender_id=eq.${userId}`,
        },
        () => {
          void loadConversations(userId);
          if (activeId) void loadConversationMessages(activeId, "refresh");
        }
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR") {
          console.error("Job Seeker messaging Realtime connection failed.");
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId, supabase, loadConversations, activeId, loadConversationMessages]);

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
    setError("");

    let conversation = conversations.find((item) => item.id === id);
    if (!conversation || !userId) return;
    if (!conversation.hasLoadedMessages) {
      await loadConversationMessages(id, "initial");
      conversation = conversations.find((item) => item.id === id);
    }

    const readAt = new Date().toISOString();
    const updateResult = conversation.kind === "application"
      ? await supabase.from("messages").update({ read_at: readAt })
          .eq("application_id", conversation.databaseId)
          .eq("recipient_id", userId).is("read_at", null).select("id")
      : await supabase.from("direct_messages").update({ read_at: readAt })
          .eq("conversation_id", conversation.databaseId)
          .eq("recipient_id", userId).is("read_at", null).select("id");

    if (updateResult.error) {
      console.error("Could not mark messages as read:", updateResult.error);
      setError("We could not update the message read status.");
      return;
    }

    const unreadIds = new Set((updateResult.data || []).map((message: { id: string }) => message.id));
    setConversations((current) => current.map((item) =>
      item.id === id ? {
        ...item,
        unread: 0,
        messages: item.messages.map((message) =>
          unreadIds.has(message.id) ? { ...message, readAt } : message
        ),
      } : item
    ));
  }

  async function loadOlderMessages() {
    if (!activeConversation || activeConversation.loadingMessages) return;
    await loadConversationMessages(activeConversation.id, "older");
  }

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedMessage = messageText.trim();

    if (
      !trimmedMessage ||
      trimmedMessage.length > 5000 ||
      !activeConversation ||
      !userId ||
      sending
    ) {
      return;
    }

    setSending(true);
    setError("");

    const result =
      activeConversation.kind === "application"
        ? await supabase
            .from("messages")
            .insert({
              application_id: activeConversation.databaseId,
              sender_id: userId,
              recipient_id: activeConversation.recipientId,
              body: trimmedMessage,
            })
            .select(
              "id, application_id, sender_id, recipient_id, body, read_at, created_at"
            )
            .single()
        : await supabase
            .from("direct_messages")
            .insert({
              conversation_id: activeConversation.databaseId,
              sender_id: userId,
              recipient_id: activeConversation.recipientId,
              body: trimmedMessage,
            })
            .select(
              "id, conversation_id, sender_id, recipient_id, body, read_at, created_at"
            )
            .single();

    if (result.error || !result.data) {
      console.error("Message could not be sent:", result.error);

      setError(
        result.error?.message ||
          "Your message could not be sent. Please try again."
      );
      setSending(false);
      return;
    }

    const savedMessage = result.data as
      | ApplicationMessageRecord
      | DirectMessageRecord;

    const newMessage = toChatMessage(savedMessage, userId);

    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === activeConversation.id
          ? {
              ...conversation,
              messages: [...conversation.messages, newMessage],
              lastMessage: trimmedMessage,
              time: formatLastMessageTime(savedMessage.created_at),
              lastMessageAt: savedMessage.created_at,
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

    void openConversation(target.id);
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
            <p>Find answers and get support as you use Abijob.</p>
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
              <p>
                Connect with employers and skilled professionals on Abijob.
              </p>
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
                      onClick={() => void openConversation(conversation.id)}
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
                          {conversation.kind === "direct"
                            ? "Skilled Professional"
                            : conversation.role}
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
                        ? "Your conversations with employers and professionals will appear here."
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
                        <span>
                          {activeConversation.kind === "direct"
                            ? "Skilled Professional"
                            : activeConversation.role}
                        </span>
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
                      {activeConversation.kind === "direct" ? (
                        <Users size={17} />
                      ) : (
                        <BriefcaseBusiness size={17} />
                      )}
                    </div>
                    <div>
                      <span>
                        {activeConversation.kind === "direct"
                          ? "DIRECT PROFESSIONAL CONVERSATION"
                          : "APPLICATION CONVERSATION"}
                      </span>
                      <strong>
                        {activeConversation.kind === "direct"
                          ? "Professional enquiry"
                          : activeConversation.role}
                      </strong>
                    </div>
                  </div>

                  <div className="messages-chat-body">
                    <div className="messages-date-divider">
                      <span>Conversation history</span>
                    </div>

                    {activeConversation.loadingMessages && (
                      <div className="messages-history-status" role="status">
                        <span className="messages-access-spinner" />
                        Loading messages...
                      </div>
                    )}

                    {activeConversation.hasMoreMessages && (
                      <button
                        type="button"
                        className="messages-load-older"
                        onClick={() => void loadOlderMessages()}
                        disabled={activeConversation.loadingMessages}
                      >
                        {activeConversation.loadingMessages ? "Loading older messages..." : "Load older messages"}
                      </button>
                    )}

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
                                {message.sender === "me" &&
                                  (message.readAt ? (
                                    <CheckCheck size={14} />
                                  ) : (
                                    <Check size={14} />
                                  ))}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : activeConversation.loadingMessages ? null : (
                      <div className="messages-select-empty">
                        <div className="messages-select-empty-icon">
                          <MessageCircle size={30} />
                        </div>
                        <h3>Start the conversation</h3>
                        <p>
                          {activeConversation.kind === "direct"
                            ? "Send a message to this skilled professional."
                            : "Send a message to the employer about your job application."}
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
                        onChange={(event) =>
                          setMessageText(event.target.value)
                        }
                        aria-label="Write a message"
                        maxLength={5000}
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
                      disabled={
                        !messageText.trim() ||
                        messageText.trim().length > 5000 ||
                        sending
                      }
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
                    Messages are sent through Abijob.
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
                      : "Choose an employer or professional conversation from your inbox."}
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
                <span>OPEN A CONVERSATION</span>
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
              Choose an existing employer or professional conversation.
              To contact a new professional, visit their public profile.
            </p>

            <label htmlFor="messages-contact">Choose conversation</label>
            <select
              id="messages-contact"
              value={newMessageTarget}
              onChange={(event) => setNewMessageTarget(event.target.value)}
            >
              {conversations.map((conversation) => (
                <option key={conversation.id} value={conversation.id}>
                  {conversation.kind === "direct"
                    ? "Professional"
                    : conversation.role}{" "}
                  — {conversation.name}
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
