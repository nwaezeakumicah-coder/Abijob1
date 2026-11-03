
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Logo from "../../../components/Logo";
import {
  Activity,
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

type Message = {
  id: number;
  text: string;
  time: string;
  sender: "me" | "them";
  read?: boolean;
};

type Conversation = {
  id: number;
  name: string;
  role: string;
  initials: string;
  color: string;
  online: boolean;
  unread: number;
  messages: Message[];
};

const STORAGE_KEY = "abijob-professional-conversations";

const initialConversations: Conversation[] = [
  {
    id: 1,
    name: "Amara Okafor",
    role: "Recruitment Manager · BrightPath Ltd",
    initials: "AO",
    color: "green",
    online: true,
    unread: 2,
    messages: [
      {
        id: 1,
        text: "Hello! I came across your professional profile on Abi Job.",
        time: "9:14 AM",
        sender: "them",
      },
      {
        id: 2,
        text: "Your experience and listed skills caught our attention. We may have an opportunity that suits your background.",
        time: "9:15 AM",
        sender: "them",
      },
      {
        id: 3,
        text: "Thank you for reaching out. I'd be happy to learn more about the opportunity.",
        time: "9:23 AM",
        sender: "me",
        read: true,
      },
      {
        id: 4,
        text: "Great! Could you share a little more about your availability?",
        time: "9:30 AM",
        sender: "them",
      },
    ],
  },
  {
    id: 2,
    name: "Daniel Eze",
    role: "Business Owner · Eze Digital Studio",
    initials: "DE",
    color: "orange",
    online: false,
    unread: 0,
    messages: [
      {
        id: 1,
        text: "Good afternoon. I saw your profile and wanted to ask about your services.",
        time: "Yesterday",
        sender: "them",
      },
      {
        id: 2,
        text: "Good afternoon! Thank you for contacting me. What would you like to know?",
        time: "Yesterday",
        sender: "me",
        read: true,
      },
      {
        id: 3,
        text: "Are you currently available for a new project?",
        time: "Yesterday",
        sender: "them",
      },
    ],
  },
  {
    id: 3,
    name: "Chisom Nwosu",
    role: "Talent Coordinator · WorkLink",
    initials: "CN",
    color: "purple",
    online: true,
    unread: 0,
    messages: [
      {
        id: 1,
        text: "Thank you for submitting your application. We will review your details and get back to you.",
        time: "Monday",
        sender: "them",
      },
      {
        id: 2,
        text: "Thank you. I look forward to hearing from you.",
        time: "Monday",
        sender: "me",
        read: true,
      },
    ],
  },
  {
    id: 4,
    name: "Ifeanyi Umeh",
    role: "Project Manager · Creative Hub",
    initials: "IU",
    color: "blue",
    online: false,
    unread: 0,
    messages: [
      {
        id: 1,
        text: "We are looking for skilled professionals for an upcoming project.",
        time: "Oct 28",
        sender: "them",
      },
    ],
  },
];

export default function ProfessionalMessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [messageInput, setMessageInput] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [mobileChatOpen, setMobileChatOpen] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);

      if (stored) {
        const parsed = JSON.parse(stored);

        if (Array.isArray(parsed)) {
          setConversations(parsed);
          setSelectedId(parsed[0]?.id ?? null);
        } else {
          setConversations(initialConversations);
          setSelectedId(initialConversations[0].id);
        }
      } else {
        setConversations(initialConversations);
        setSelectedId(initialConversations[0].id);
      }
    } catch {
      setConversations(initialConversations);
      setSelectedId(initialConversations[0].id);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!loaded) return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
    } catch {
      console.error("Unable to save professional messages.");
    }
  }, [conversations, loaded]);

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

  function openConversation(id: number) {
    setSelectedId(id);
    setMobileChatOpen(true);

    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === id
          ? { ...conversation, unread: 0 }
          : conversation
      )
    );
  }

  function sendMessage() {
    const text = messageInput.trim();

    if (!text || !selectedConversation) return;

    const now = new Date();
    const time = now.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });

    const newMessage: Message = {
      id: Date.now(),
      text,
      time,
      sender: "me",
      read: false,
    };

    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === selectedConversation.id
          ? {
              ...conversation,
              messages: [...conversation.messages, newMessage],
            }
          : conversation
      )
    );

    setMessageInput("");
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
            <Activity size={19} />
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
                Communicate with employers, clients and people interested in
                your professional services.
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
                    {unreadCount} unread {unreadCount === 1 ? "message" : "messages"}
                  </span>
                </div>
                <button
                  type="button"
                  aria-label="More inbox options"
                  title="Inbox options"
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
                            <span>{lastMessage?.time}</span>
                          </div>

                          <p>{conversation.role}</p>

                          <div className="professional-messages-contact-bottom">
                            <span>
                              {lastMessage?.sender === "me" && "You: "}
                              {lastMessage?.text}
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
                    <Search size={23} />
                    <strong>No conversations found</strong>
                    <span>Try searching with another name or keyword.</span>
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
                      {selectedConversation.online && (
                        <span className="professional-messages-online-dot" />
                      )}
                    </div>

                    <div className="professional-messages-chat-person">
                      <strong>{selectedConversation.name}</strong>
                      <span>
                        <i
                          className={
                            selectedConversation.online ? "online" : ""
                          }
                        />
                        {selectedConversation.online
                          ? "Online"
                          : "Offline"}
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
                    {selectedConversation.messages.map((message) => (
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
                    ))}
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
                        title="File attachments will be available after backend integration"
                        onClick={() =>
                          alert(
                            "File attachments will be available after backend integration."
                          )
                        }
                      >
                        <Paperclip size={19} />
                      </button>
                      <button
                        type="button"
                        aria-label="Emoji"
                        title="Emoji"
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
                      disabled={!messageInput.trim()}
                      aria-label="Send message"
                    >
                      <Send size={18} />
                    </button>
                  </form>

                  <p className="professional-messages-composer-note">
                    Press Enter to send · Shift + Enter for a new line
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
