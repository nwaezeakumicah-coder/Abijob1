
"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  Bell,
  BookOpen,
  Bookmark,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Compass,
  GraduationCap,
  Lightbulb,
  MapPin,
  Menu,
  MessageCircle,
  Newspaper,
  Search,
  SlidersHorizontal,
  Sparkles,
  Users,
  Video,
  X,
} from "lucide-react";
import "./hub.css";

type HubCategory =
  | "All"
  | "Career advice"
  | "Scholarships"
  | "Skills"
  | "Business"
  | "Technology";

type HubArticle = {
  id: number;
  category: Exclude<HubCategory, "All">;
  title: string;
  excerpt: string;
  author: string;
  date: string;
  readTime: string;
  color: string;
  icon: typeof BookOpen;
};

const articles: HubArticle[] = [
  {
    id: 1,
    category: "Career advice",
    title: "How to build a CV that gets employers' attention",
    excerpt:
      "Learn how to present your skills, experience and achievements in a way that makes recruiters want to know more.",
    author: "AbiJob Career Desk",
    date: "October 28, 2026",
    readTime: "6 min read",
    color: "green",
    icon: BookOpen,
  },
  {
    id: 2,
    category: "Technology",
    title: "Technology skills creating new opportunities in Abia",
    excerpt:
      "Explore practical digital skills that can help young people access work and grow their careers.",
    author: "Technology Desk",
    date: "October 25, 2026",
    readTime: "5 min read",
    color: "blue",
    icon: Lightbulb,
  },
  {
    id: 3,
    category: "Scholarships",
    title: "Preparing a strong scholarship application",
    excerpt:
      "A practical guide to finding suitable scholarships and preparing the documents you need.",
    author: "Education Desk",
    date: "October 22, 2026",
    readTime: "7 min read",
    color: "orange",
    icon: GraduationCap,
  },
  {
    id: 4,
    category: "Business",
    title: "Simple ways small businesses can attract more customers",
    excerpt:
      "Useful branding, customer service and marketing ideas for growing businesses.",
    author: "Business Desk",
    date: "October 19, 2026",
    readTime: "4 min read",
    color: "purple",
    icon: BriefcaseBusiness,
  },
  {
    id: 5,
    category: "Skills",
    title: "Turning a practical skill into a sustainable career",
    excerpt:
      "From pricing your services to building a portfolio, learn how to make your skill work for you.",
    author: "Skills Development Desk",
    date: "October 16, 2026",
    readTime: "6 min read",
    color: "pink",
    icon: Sparkles,
  },
  {
    id: 6,
    category: "Career advice",
    title: "What to expect during your first job interview",
    excerpt:
      "Understand common interview questions, preparation techniques and professional conduct.",
    author: "AbiJob Career Desk",
    date: "October 12, 2026",
    readTime: "5 min read",
    color: "blue",
    icon: MessageCircle,
  },
];

const communities = [
  {
    name: "Technology & Developers",
    description: "Discuss coding, digital products and tech careers.",
    members: "1,240",
    icon: "⌘",
    color: "blue",
  },
  {
    name: "Fashion & Creative Design",
    description: "Connect with designers, tailors and creative minds.",
    members: "980",
    icon: "✦",
    color: "pink",
  },
  {
    name: "Business & Entrepreneurship",
    description: "Share ideas and learn how to grow a business.",
    members: "860",
    icon: "↗",
    color: "orange",
  },
  {
    name: "Skilled Professionals & Artisans",
    description: "Connect with artisans and service professionals.",
    members: "720",
    icon: "✳",
    color: "green",
  },
];

const events = [
  {
    day: "08",
    month: "NOV",
    title: "Building a professional CV",
    type: "Online workshop",
    time: "10:00 AM",
    location: "AbiJob Virtual Room",
  },
  {
    day: "14",
    month: "NOV",
    title: "Starting and growing a small business",
    type: "Career session",
    time: "12:00 PM",
    location: "Online event",
  },
  {
    day: "21",
    month: "NOV",
    title: "Introduction to digital skills",
    type: "Skills workshop",
    time: "11:00 AM",
    location: "Online event",
  },
];

const categories: HubCategory[] = [
  "All",
  "Career advice",
  "Scholarships",
  "Skills",
  "Business",
  "Technology",
];

export default function HubPage() {
  const [activeCategory, setActiveCategory] = useState<HubCategory>("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [savedArticles, setSavedArticles] = useState<number[]>([]);
  const [joinedCommunities, setJoinedCommunities] = useState<string[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<HubArticle | null>(
    null
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!sidebarOpen) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setSidebarOpen(false);
    }

    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  const filteredArticles = useMemo(() => {
    return articles.filter((article) => {
      const matchesCategory =
        activeCategory === "All" || article.category === activeCategory;

      const search = searchTerm.toLowerCase();

      const matchesSearch =
        article.title.toLowerCase().includes(search) ||
        article.excerpt.toLowerCase().includes(search) ||
        article.category.toLowerCase().includes(search);

      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchTerm]);

  function toggleSaved(id: number) {
    setSavedArticles((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  }

  function toggleCommunity(name: string) {
    setJoinedCommunities((current) =>
      current.includes(name)
        ? current.filter((item) => item !== name)
        : [...current, name]
    );
  }

  function closeSidebar() {
    setSidebarOpen(false);
  }

  return (
    <main className="hub-page">
      {sidebarOpen && (
        <button
          type="button"
          className="hub-sidebar-overlay"
          aria-label="Close navigation menu"
          onClick={closeSidebar}
        />
      )}

      <aside
        id="hub-sidebar"
        className={`hub-sidebar ${sidebarOpen ? "hub-sidebar-open" : ""}`}
        onClick={(event) => {
          const target = event.target as HTMLElement;

          if (target.closest("a")) {
            closeSidebar();
          }
        }}
      >
        <Link href="/" className="hub-brand" aria-label="Abi Job home">
          <Image
            src="/images/abijob-logo-green.png"
            alt="Abi Job — Opportunity Starts Here"
            width={164}
            height={53}
            priority
            className="hub-brand-logo"
          />
        </Link>

        <div className="hub-sidebar-label">WORKSPACE</div>

        <nav className="hub-navigation">
          <Link href="/dashboard" className="hub-nav-link">
            <Activity size={19} />
            <span>Dashboard</span>
          </Link>

          <Link href="/jobs" className="hub-nav-link">
            <BriefcaseBusiness size={19} />
            <span>Find jobs</span>
          </Link>

          <Link href="/saved-jobs" className="hub-nav-link">
            <Bookmark size={19} />
            <span>Saved jobs</span>
          </Link>

          <Link href="/applications" className="hub-nav-link">
            <CheckCircle2 size={19} />
            <span>My applications</span>
          </Link>

          <Link href="/notifications" className="hub-nav-link">
            <Bell size={19} />
            <span>Notifications</span>
          </Link>
        </nav>

        <div className="hub-sidebar-label hub-discover-label">
          DISCOVER
        </div>

        <nav className="hub-navigation">
          <Link href="/hub" className="hub-nav-link active">
            <Compass size={19} />
            <span>Career Hub</span>
            <span className="hub-active-dot" />
          </Link>

          <Link href="/professionals" className="hub-nav-link">
            <Users size={19} />
            <span>Professionals</span>
          </Link>
        </nav>

        <div className="hub-sidebar-bottom">
          <div className="hub-sidebar-help">
            <div className="hub-help-icon">
              <Lightbulb size={20} />
            </div>

            <strong>Keep growing</strong>

            <p>
              Discover resources that move your career forward.
            </p>

            <Link href="/profile">
              Complete your profile <ArrowRight size={14} />
            </Link>
          </div>

          <Link href="/settings" className="hub-profile-link">
            <span className="hub-avatar">M</span>

            <span className="hub-profile-text">
              <strong>My account</strong>
              <small>Manage your profile</small>
            </span>

            <ChevronRight size={17} />
          </Link>
        </div>
      </aside>

      <section className="hub-main">
        <header className="hub-topbar">
          <div className="hub-topbar-left">
            <button
              type="button"
              className="hub-menu-button"
              onClick={() => setSidebarOpen((open) => !open)}
              aria-label={
                sidebarOpen
                  ? "Close navigation menu"
                  : "Open navigation menu"
              }
              aria-expanded={sidebarOpen}
              aria-controls="hub-sidebar"
            >
              {sidebarOpen ? <X size={22} /> : <Menu size={23} />}
            </button>

            <div className="hub-breadcrumb">
              <span>Workspace</span>
              <ChevronRight size={15} />
              <strong>Career Hub</strong>
            </div>
          </div>

          <div className="hub-topbar-actions">
            <span className="hub-location">
              <MapPin size={15} /> Abia State, Nigeria
            </span>

            <Link
              href="/notifications"
              className="hub-notification-button"
              aria-label="Notifications"
            >
              <Bell size={19} />
              <i />
            </Link>

            <Link href="/profile" className="hub-top-avatar">
              M
            </Link>
          </div>
        </header>

        <div className="hub-content">
          <section className="hub-welcome">
            <div className="hub-welcome-copy">
              <div className="hub-eyebrow">
                <Sparkles size={15} /> ABIJOB CAREER HUB
              </div>

              <h1>
                Learn more.
                <br />
                <span>Become more.</span>
              </h1>

              <p>
                Your space to discover opportunities, develop useful skills,
                connect with professionals and take your next career step.
              </p>

              <div className="hub-welcome-actions">
                <a href="#hub-explore" className="hub-primary-button">
                  Explore resources <ArrowRight size={17} />
                </a>

                <a href="#hub-communities" className="hub-text-button">
                  Find your community <ArrowUpRight size={16} />
                </a>
              </div>
            </div>

            <div className="hub-welcome-art" aria-hidden="true">
              <div className="hub-art-orbit hub-orbit-one" />
              <div className="hub-art-orbit hub-orbit-two" />

              <div className="hub-art-circle">
                <GraduationCap size={76} strokeWidth={1.35} />
              </div>

              <div className="hub-art-note hub-note-one">
                <BookOpen size={18} />
                <span>Keep learning</span>
              </div>

              <div className="hub-art-note hub-note-two">
                <Sparkles size={18} />
                <span>Grow your skills</span>
              </div>

              <div className="hub-art-dot hub-dot-one" />
              <div className="hub-art-dot hub-dot-two" />
            </div>
          </section>

          <section className="hub-quick-stats">
            <div className="hub-stat-item">
              <span className="hub-stat-icon green-stat">
                <Newspaper size={20} />
              </span>
              <div>
                <strong>Career insights</strong>
                <small>Guides and useful articles</small>
              </div>
            </div>

            <div className="hub-stat-item">
              <span className="hub-stat-icon orange-stat">
                <GraduationCap size={21} />
              </span>
              <div>
                <strong>Learning resources</strong>
                <small>Skills and scholarships</small>
              </div>
            </div>

            <div className="hub-stat-item">
              <span className="hub-stat-icon blue-stat">
                <Users size={21} />
              </span>
              <div>
                <strong>Career communities</strong>
                <small>Connect and collaborate</small>
              </div>
            </div>

            <div className="hub-stat-item">
              <span className="hub-stat-icon purple-stat">
                <CalendarDays size={20} />
              </span>
              <div>
                <strong>Events & workshops</strong>
                <small>Learn with other people</small>
              </div>
            </div>
          </section>

          <section className="hub-section" id="hub-explore">
            <div className="hub-section-heading">
              <div>
                <span className="hub-section-kicker">STAY INFORMED</span>
                <h2>Explore career resources</h2>
                <p>
                  Ideas, knowledge and practical guidance for your journey.
                </p>
              </div>

              <div className="hub-article-search">
                <Search size={18} />
                <input
                  type="search"
                  placeholder="Search articles..."
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </div>
            </div>

            <div className="hub-category-tabs">
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  className={
                    activeCategory === category ? "selected" : ""
                  }
                  onClick={() => setActiveCategory(category)}
                >
                  {category}
                </button>
              ))}

              <span className="hub-filter-label">
                <SlidersHorizontal size={15} /> Filter resources
              </span>
            </div>

            {filteredArticles.length > 0 ? (
              <div className="hub-articles-grid">
                {filteredArticles.map((article) => {
                  const ArticleIcon = article.icon;
                  const isSaved = savedArticles.includes(article.id);

                  return (
                    <article
                      className="hub-article-card"
                      key={article.id}
                    >
                      <div
                        className={`hub-article-visual ${article.color}-visual`}
                      >
                        <span className="hub-article-visual-icon">
                          <ArticleIcon size={35} strokeWidth={1.5} />
                        </span>

                        <span className="hub-article-category">
                          {article.category}
                        </span>

                        <button
                          type="button"
                          className={`hub-save-button ${
                            isSaved ? "is-saved" : ""
                          }`}
                          onClick={() => toggleSaved(article.id)}
                          aria-label={
                            isSaved ? "Unsave article" : "Save article"
                          }
                        >
                          <Bookmark
                            size={17}
                            fill={isSaved ? "currentColor" : "none"}
                          />
                        </button>
                      </div>

                      <div className="hub-article-body">
                        <div className="hub-article-meta">
                          <span>{article.date}</span>
                          <span className="hub-meta-dot" />
                          <span>{article.readTime}</span>
                        </div>

                        <h3>{article.title}</h3>
                        <p>{article.excerpt}</p>

                        <div className="hub-article-footer">
                          <span>{article.author}</span>

                          <button
                            type="button"
                            onClick={() => setSelectedArticle(article)}
                          >
                            Read article <ArrowRight size={15} />
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="hub-empty-state">
                <Search size={28} />
                <h3>No resources found</h3>
                <p>
                  Try another search term or choose a different category.
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm("");
                    setActiveCategory("All");
                  }}
                >
                  Clear filters
                </button>
              </div>
            )}
          </section>

          <section className="hub-scholarship-banner">
            <div className="hub-scholarship-icon">
              <GraduationCap size={35} />
            </div>

            <div className="hub-scholarship-copy">
              <span>INVEST IN YOUR FUTURE</span>
              <h2>Education can open new doors.</h2>
              <p>
                Explore scholarship information, learning opportunities and
                resources to support your next step.
              </p>
            </div>

            <Link
              href="/hub/scholarships"
              className="hub-scholarship-link"
            >
              Explore scholarships <ArrowRight size={17} />
            </Link>

            <div className="hub-scholarship-decoration" />
          </section>

          <section
            className="hub-section hub-community-section"
            id="hub-communities"
          >
            <div className="hub-section-heading">
              <div>
                <span className="hub-section-kicker">GROW TOGETHER</span>
                <h2>Find your people</h2>
                <p>
                  Join communities built around your interests, skills and
                  professional goals.
                </p>
              </div>

              <Link
                href="/hub/communities"
                className="hub-view-all"
              >
                Explore communities <ArrowRight size={16} />
              </Link>
            </div>

            <div className="hub-community-grid">
              {communities.map((community) => {
                const joined = joinedCommunities.includes(
                  community.name
                );

                return (
                  <article
                    className="hub-community-card"
                    key={community.name}
                  >
                    <div
                      className={`hub-community-icon ${community.color}-community`}
                    >
                      {community.icon}
                    </div>

                    <div className="hub-community-members">
                      <Users size={14} /> {community.members} members
                    </div>

                    <h3>{community.name}</h3>
                    <p>{community.description}</p>

                    <button
                      type="button"
                      className={joined ? "joined" : ""}
                      onClick={() => toggleCommunity(community.name)}
                    >
                      {joined ? (
                        <>
                          <CheckCircle2 size={16} /> Joined
                        </>
                      ) : (
                        <>
                          Join community <ArrowRight size={15} />
                        </>
                      )}
                    </button>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="hub-section hub-events-section">
            <div className="hub-section-heading">
              <div>
                <span className="hub-section-kicker">
                  LEARN SOMETHING NEW
                </span>
                <h2>Upcoming events & workshops</h2>
                <p>
                  Take part in sessions designed to help you learn and connect.
                </p>
              </div>

              <Link href="/hub/events" className="hub-view-all">
                View all events <ArrowRight size={16} />
              </Link>
            </div>

            <div className="hub-events-list">
              {events.map((event) => (
                <article className="hub-event-card" key={event.title}>
                  <div className="hub-event-date">
                    <strong>{event.day}</strong>
                    <span>{event.month}</span>
                  </div>

                  <div className="hub-event-info">
                    <span>{event.type}</span>
                    <h3>{event.title}</h3>

                    <div className="hub-event-details">
                      <span>
                        <Clock3 size={14} /> {event.time}
                      </span>
                      <span>
                        <MapPin size={14} /> {event.location}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="hub-event-action"
                    onClick={() =>
                      alert(
                        "Event registration will be available when AbiJob backend services are connected."
                      )
                    }
                  >
                    View details <ArrowUpRight size={16} />
                  </button>
                </article>
              ))}
            </div>
          </section>

          <section className="hub-bottom-cta">
            <div className="hub-bottom-cta-icon">
              <Video size={27} />
            </div>

            <div>
              <h2>Your next opportunity starts with growth.</h2>
              <p>
                Keep your profile updated and discover opportunities that
                match your skills.
              </p>
            </div>

            <Link href="/profile">
              Update my profile <ArrowRight size={17} />
            </Link>
          </section>

          <footer className="hub-footer">
            <span>© 2026 Abijob. Opportunity starts here.</span>

            <div>
              <Link href="/about">About Abijob</Link>
              <Link href="/settings">Settings</Link>
              <Link href="/support">Help & support</Link>
            </div>
          </footer>
        </div>
      </section>

      {selectedArticle && (
        <div
          className="hub-modal-backdrop"
          onClick={() => setSelectedArticle(null)}
        >
          <div
            className="hub-article-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="hub-modal-title"
          >
            <button
              type="button"
              className="hub-modal-close"
              onClick={() => setSelectedArticle(null)}
              aria-label="Close article"
            >
              <X size={20} />
            </button>

            <span className="hub-modal-category">
              {selectedArticle.category}
            </span>

            <h2 id="hub-modal-title">{selectedArticle.title}</h2>

            <div className="hub-modal-meta">
              {selectedArticle.author} · {selectedArticle.date} ·{" "}
              {selectedArticle.readTime}
            </div>

            <p>{selectedArticle.excerpt}</p>

            <div className="hub-modal-placeholder">
              <BookOpen size={25} />
              <p>
                The full article will be published here when the AbiJob
                content management system is connected.
              </p>
            </div>

            <button
              type="button"
              className="hub-primary-button"
              onClick={() => setSelectedArticle(null)}
            >
              Back to Career Hub
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
