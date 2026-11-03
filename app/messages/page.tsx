
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Logo from "../../components/Logo";
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

type Message = {
  id: number;
  text: string;
  time: string;
  sender: "me" | "them";
};

type Conversation = {
  id: number;
  name: string;
  role: string;
  initials: string;
  color: string;
  online: boolean;
  unread: number;
  lastMessage: string;
  time: string;
  messages: Message[];
};

type AccountRole = "job-seeker" | "professional" | "employer";

const initialConversations: Conversation[] = [
  {
    id: 1,
    name: "Chisom Eze",
    role: "Recruitment Manager · BrightTech",
    initials: "CE",
    color: "green",
    online: true,
    unread: 2,
    lastMessage: "Please send your updated CV when you can.",
    time: "10:42 AM",
    messages: [
      {
        id: 1,
        text: "Hello Micah, thank you for applying for the Frontend Developer position.",
        time: "10:12 AM",
        sender: "them",
      },
      {
        id: 2,
        text: "We have reviewed your profile and would like to discuss the next stage of the process.",
        time: "10:18 AM",
        sender: "them",
      },
      {
        id: 3,
        text: "Thank you for reaching out. I would be happy to discuss the opportunity.",
        time: "10:25 AM",
        sender: "me",
      },
      {
        id: 4,
        text: "Please send your updated CV when you can.",
        time: "10:42 AM",
        sender: "them",
      },
    ],
  },
  {
    id: 2,
    name: "Amara Okafor",
    role: "Fashion Designer · Made in Aba Studio",
    initials: "AO",
    color: "orange",
    online: true,
    unread: 0,
    lastMessage: "That works perfectly. See you then!",
    time: "Yesterday",
    messages: [
      {
        id: 1,
        text: "Hi, I saw your profile and wanted to connect about a design project.",
        time: "Yesterday",
        sender: "them",
      },
      {
        id: 2,
        text: "Thank you for reaching out. I would love to hear more about it.",
        time: "Yesterday",
        sender: "me",
      },
      {
        id: 3,
        text: "That works perfectly. See you then!",
        time: "Yesterday",
        sender: "them",
      },
    ],
  },
  {
    id: 3,
    name: "David Nwosu",
    role: "Business Owner · Daves Digital",
    initials: "DN",
    color: "blue",
    online: false,
    unread: 0,
    lastMessage: "Can we schedule a quick conversation?",
    time: "Yesterday",
    messages: [
      {
        id: 1,
        text: "I am looking for someone to help with our business website.",
        time: "Yesterday",
        sender: "them",
      },
      {
        id: 2,
        text: "I can help with that. Could you share more details about the project?",
        time: "Yesterday",
        sender: "me",
      },
      {
        id: 3,
        text: "Can we schedule a quick conversation?",
        time: "Yesterday",
        sender: "them",
      },
    ],
  },
  {
    id: 4,
    name: "Grace Iheanacho",
    role: "HR Officer · Abia Business Hub",
    initials: "GI",
    color: "purple",
    online: false,
    unread: 0,
    lastMessage: "Your application is under review.",
    time: "Oct 29",
    messages: [
      {
        id: 1,
        text: "Good afternoon. I am following up on my application.",
        time: "Oct 29",
        sender: "me",
      },
      {
        id: 2,
        text: "Your application is under review.",
        time: "Oct 29",
        sender: "them",
      },
    ],
  },
  {
    id: 5,
    name: "Emeka Ude",
    role: "Graphic Designer · Creative Works",
    initials: "EU",
    color: "pink",
    online: false,
    unread: 0,
    lastMessage: "I have shared the project details.",
    time: "Oct 27",
    messages: [
      {
        id: 1,
        text: "Are you available for a branding project?",
        time: "Oct 27",
        sender: "them",
      },
      {
        id: 2,
        text: "Yes, I am available. Please share the brief.",
        time: "Oct 27",
        sender: "me",
      },
      {
        id: 3,
        text: "I have shared the project details.",
        time: "Oct 27",
        sender: "them",
      },
    ],
  },
];

function normaliseRole(value: unknown): AccountRole | null {
  if (typeof value !== "string") return null;

  const role = value.trim().toLowerCase().replace(/_/g, "-");

  if (
    role === "employer" ||
    role === "business" ||
    role === "business-owner"
  ) {
    return "employer";
  }

  if (
    role === "professional" ||
    role === "skilled-professional" ||
    role === "skilled-professionals" ||
    role === "artisan" ||
    role === "artisans" ||
    role === "skilled-professionals-&-artisans"
  ) {
    return "professional";
  }

  if (
    role === "job-seeker" ||
    role === "jobseeker" ||
    role === "job-seekers" ||
    role === "seeker"
  ) {
    return "job-seeker";
  }

  return null;
}

function getAccountRole(): AccountRole {
  const storageKeys = [
    "abijob-user",
    "abijob-current-user",
    "abijob-auth-user",
    "abijob-profile",
    "abijob-account",
  ];

  for (const key of storageKeys) {
    try {
      const storedValue = window.localStorage.getItem(key);
      if (!storedValue) continue;

      const parsed = JSON.parse(storedValue);

      if (typeof parsed === "string") {
        const directRole = normaliseRole(parsed);
        if (directRole) return directRole;
        continue;
      }

      if (!parsed || typeof parsed !== "object") continue;

      const accountObjects = [
        parsed,
        parsed.user,
        parsed.profile,
        parsed.account,
        parsed.user_metadata,
      ];

      for (const account of accountObjects) {
        if (!account || typeof account !== "object") continue;

        const data = account as Record<string, unknown>;

        const roleValues = [
          data.role,
          data.accountType,
          data.account_type,
          data.userType,
          data.user_type,
          data.type,
        ];

        for (const value of roleValues) {
          const detectedRole = normaliseRole(value);
          if (detectedRole) return detectedRole;
        }
      }
    } catch {
      // Ignore invalid or unavailable local storage values.
    }
  }

  // This route is the Job Seeker messaging workspace by default.
  return "job-seeker";
}

export default function MessagesPage() {
  const router = useRouter();

  const [accessChecked, setAccessChecked] = useState(false);
  const [conversations, setConversations] = useState(initialConversations);
  const [activeId, setActiveId] = useState(1);
  const [search, setSearch] = useState("");
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [newMessageTarget, setNewMessageTarget] = useState("2");
  const [mobileListOpen, setMobileListOpen] = useState(true);

  useEffect(() => {
    const accountRole = getAccountRole();

    if (accountRole === "professional") {
      router.replace("/professional/messages");
      return;
    }

    if (accountRole === "employer") {
      router.replace("/employer/messages");
      return;
    }

    setAccessChecked(true);
  }, [router]);

  const activeConversation = conversations.find(
    (conversation) => conversation.id === activeId
  );

  const filteredConversations = useMemo(() => {
    return conversations.filter((conversation) => {
      const matchesSearch =
        conversation.name.toLowerCase().includes(search.toLowerCase()) ||
        conversation.role.toLowerCase().includes(search.toLowerCase());

      const matchesUnread = !showUnreadOnly || conversation.unread > 0;

      return matchesSearch && matchesUnread;
    });
  }, [conversations, search, showUnreadOnly]);

  const totalUnread = conversations.reduce(
    (total, conversation) => total + conversation.unread,
    0
  );

  function openConversation(id: number) {
    setActiveId(id);
    setMobileListOpen(false);

    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === id ? { ...conversation, unread: 0 } : conversation
      )
    );
  }

  function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedMessage = messageText.trim();

    if (!trimmedMessage || !activeConversation) return;

    const newMessage: Message = {
      id: Date.now(),
      text: trimmedMessage,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      sender: "me",
    };

    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === activeId
          ? {
              ...conversation,
              messages: [...conversation.messages, newMessage],
              lastMessage: trimmedMessage,
              time: "Just now",
            }
          : conversation
      )
    );

    setMessageText("");
  }

  function startNewMessage() {
    const targetId = Number(newMessageTarget);
    const target = conversations.find(
      (conversation) => conversation.id === targetId
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
            <div className="messages-user-avatar">M</div>
            <div className="messages-user-info">
              <strong>Micah</strong>
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
              M
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
              onClick={() => setShowNewMessage(true)}
            >
              <Plus size={18} />
              New message
            </button>
          </div>

          <div className="messages-workspace">
            <section
              className={`messages-inbox ${
                !mobileListOpen ? "messages-mobile-hidden" : ""
              }`}
            >
              <div className="messages-inbox-header">
                <div>
                  <h2>Inbox</h2>
                  <span>{conversations.length} conversations</span>
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
                {filteredConversations.length > 0 ? (
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
                        {conversation.online && (
                          <span className="messages-online-dot" />
                        )}
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
                    <strong>No conversations found</strong>
                    <span>Try another search or change your filter.</span>
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
                        {activeConversation.online && (
                          <span className="messages-online-dot" />
                        )}
                      </div>

                      <div>
                        <strong>{activeConversation.name}</strong>
                        <span>
                          {activeConversation.online ? (
                            <>
                              <i className="messages-status-dot" /> Online
                            </>
                          ) : (
                            activeConversation.role
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="messages-chat-actions">
                      <button aria-label="More conversation options">
                        <MoreHorizontal size={21} />
                      </button>
                    </div>
                  </div>

                  <div className="messages-chat-context">
                    <div className="messages-context-icon">
                      <BriefcaseBusiness size={17} />
                    </div>
                    <div>
                      <span>CONVERSATION</span>
                      <strong>{activeConversation.role}</strong>
                    </div>
                    <button aria-label="Conversation details">
                      <ChevronDown size={17} />
                    </button>
                  </div>

                  <div className="messages-chat-body">
                    <div className="messages-date-divider">
                      <span>Conversation history</span>
                    </div>

                    {activeConversation.messages.map((message, index) => {
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
                    })}
                  </div>

                  <form className="messages-composer" onSubmit={sendMessage}>
                    <div className="messages-composer-box">
                      <input
                        type="text"
                        placeholder="Write your message..."
                        value={messageText}
                        onChange={(event) => setMessageText(event.target.value)}
                        aria-label="Write a message"
                      />

                      <div className="messages-composer-tools">
                        <button
                          type="button"
                          aria-label="Attach a file"
                          title="File attachments will be available when messaging is connected"
                          disabled
                        >
                          <Paperclip size={19} />
                        </button>
                        <button
                          type="button"
                          aria-label="Emoji"
                          title="Emoji support will be available later"
                          disabled
                        >
                          <Smile size={19} />
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="messages-send-button"
                      disabled={!messageText.trim()}
                      aria-label="Send message"
                    >
                      <Send size={18} />
                    </button>
                  </form>

                  <div className="messages-composer-note">
                    <Check size={13} />
                    Demo conversation: messages are not delivered to another
                    user yet.
                  </div>
                </>
              ) : (
                <div className="messages-select-empty">
                  <div className="messages-select-empty-icon">
                    <MessageCircle size={30} />
                  </div>
                  <h3>Select a conversation</h3>
                  <p>Choose someone from your inbox to view your messages.</p>
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

            <p>Select a contact to open an existing demo conversation.</p>

            <label htmlFor="messages-contact">Choose contact</label>
            <select
              id="messages-contact"
              value={newMessageTarget}
              onChange={(event) => setNewMessageTarget(event.target.value)}
            >
              {conversations.map((conversation) => (
                <option key={conversation.id} value={conversation.id}>
                  {conversation.name} — {conversation.role}
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
