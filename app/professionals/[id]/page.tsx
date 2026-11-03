
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { connection } from "next/server";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  Clock3,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Star,
} from "lucide-react";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import "./profile.css";

type Professional = {
  id: number;
  name: string;
  profession: string;
  category: string;
  location: string;
  experience: string;
  rating: number;
  reviews: number;
  description: string;
  skills: string[];
  initials: string;
  featured?: boolean;
  availability: string;
  about: string;
  services: string[];
  workHistory: { role: string; period: string; description: string }[];
  portfolio: { title: string; category: string; number: string }[];
};

const professionals: Professional[] = [
  {
    id: 1,
    name: "Chinedu Okafor",
    profession: "Graphic Designer",
    category: "Creative & Design",
    location: "Aba",
    experience: "4 years experience",
    rating: 4.9,
    reviews: 28,
    description: "Creative designer specialising in brand identity, business graphics, advertising designs and digital content.",
    skills: ["Brand Identity", "CorelDRAW", "Social Media Design"],
    initials: "CO",
    featured: true,
    availability: "Available for projects",
    about: "I am a creative graphic designer passionate about helping businesses communicate clearly through professional visual design. I work with individuals, startups and established businesses to create memorable brand identities and marketing materials.",
    services: ["Logo and brand identity design", "Business cards and stationery", "Flyers and promotional graphics", "Social media designs", "Marketing and advertising materials"],
    workHistory: [
      { role: "Freelance Graphic Designer", period: "2023 – Present", description: "Working with businesses and individuals on branding, promotional graphics and digital design projects." },
      { role: "Junior Graphic Designer", period: "2022 – 2023", description: "Supported creative projects and produced marketing materials for local businesses." },
    ],
    portfolio: [
      { title: "Brand Identity", category: "Branding", number: "01" },
      { title: "Business Graphics", category: "Print Design", number: "02" },
      { title: "Social Media Campaign", category: "Digital Design", number: "03" },
    ],
  },
  {
    id: 2,
    name: "Amara Nwosu",
    profession: "Fashion Designer",
    category: "Fashion & Tailoring",
    location: "Ariaria, Aba",
    experience: "6 years experience",
    rating: 4.8,
    reviews: 34,
    description: "Fashion designer creating beautiful ready-to-wear outfits, traditional attire and custom clothing.",
    skills: ["Fashion Design", "Tailoring", "Styling"],
    initials: "AN",
    featured: true,
    availability: "Available for orders",
    about: "I create custom clothing that combines good craftsmanship with personal style. From traditional outfits to modern ready-to-wear pieces, I focus on fit, quality and attention to detail.",
    services: ["Custom clothing", "Traditional outfits", "Ready-to-wear fashion", "Clothing alterations", "Fashion styling"],
    workHistory: [
      { role: "Independent Fashion Designer", period: "2020 – Present", description: "Designing and producing custom outfits for individual clients and fashion orders." },
      { role: "Fashion Assistant", period: "2018 – 2020", description: "Supported garment production, measurements and clothing finishing." },
    ],
    portfolio: [
      { title: "Traditional Wear", category: "Fashion", number: "01" },
      { title: "Ready-to-Wear", category: "Fashion", number: "02" },
      { title: "Custom Designs", category: "Tailoring", number: "03" },
    ],
  },
  {
    id: 3,
    name: "Emeka Eze",
    profession: "Professional Barber",
    category: "Beauty & Personal Care",
    location: "Osisioma",
    experience: "5 years experience",
    rating: 4.7,
    reviews: 19,
    description: "Experienced barber offering modern haircuts, grooming, beard styling and professional hair care.",
    skills: ["Haircuts", "Beard Grooming", "Hair Styling"],
    initials: "EE",
    availability: "Available for appointments",
    about: "I provide professional barbering and grooming services with a focus on neat finishing, customer comfort and consistent results.",
    services: ["Modern haircuts", "Beard trimming", "Hair styling", "Hairline finishing", "Personal grooming"],
    workHistory: [
      { role: "Professional Barber", period: "2021 – Present", description: "Providing haircut and grooming services to regular and walk-in clients." },
    ],
    portfolio: [
      { title: "Modern Haircuts", category: "Barbering", number: "01" },
      { title: "Beard Grooming", category: "Grooming", number: "02" },
      { title: "Hair Styling", category: "Styling", number: "03" },
    ],
  },
  {
    id: 4,
    name: "Blessing Kalu",
    profession: "Makeup Artist",
    category: "Beauty & Personal Care",
    location: "Umuahia",
    experience: "3 years experience",
    rating: 4.9,
    reviews: 16,
    description: "Professional makeup artist for weddings, special events, photoshoots and everyday beauty.",
    skills: ["Bridal Makeup", "Beauty", "Photoshoot Makeup"],
    initials: "BK",
    availability: "Available for bookings",
    about: "I am a makeup artist helping clients look and feel confident for their important moments. I offer makeup services for celebrations, photoshoots and personal occasions.",
    services: ["Bridal makeup", "Event makeup", "Photoshoot makeup", "Natural makeup", "Makeup consultation"],
    workHistory: [
      { role: "Independent Makeup Artist", period: "2023 – Present", description: "Providing makeup services for weddings, events and personal bookings." },
    ],
    portfolio: [
      { title: "Bridal Looks", category: "Bridal", number: "01" },
      { title: "Event Makeup", category: "Beauty", number: "02" },
      { title: "Photoshoot Looks", category: "Editorial", number: "03" },
    ],
  },
  {
    id: 5,
    name: "Ikenna Nwachukwu",
    profession: "Web Developer",
    category: "Technology",
    location: "Aba",
    experience: "3 years experience",
    rating: 4.8,
    reviews: 22,
    description: "Web developer building responsive websites and digital solutions for individuals and businesses.",
    skills: ["React", "Next.js", "Web Design"],
    initials: "IN",
    availability: "Open to projects",
    about: "I build responsive websites and digital experiences that help individuals and businesses establish a strong online presence. I enjoy solving practical problems through technology.",
    services: ["Business websites", "Responsive web design", "Frontend development", "Website maintenance", "Landing pages"],
    workHistory: [
      { role: "Freelance Web Developer", period: "2023 – Present", description: "Building and maintaining websites for small businesses and independent clients." },
    ],
    portfolio: [
      { title: "Business Website", category: "Web Development", number: "01" },
      { title: "Landing Page", category: "Frontend", number: "02" },
      { title: "Web Application", category: "Development", number: "03" },
    ],
  },
  {
    id: 6,
    name: "Ngozi Umeh",
    profession: "Caterer",
    category: "Food & Hospitality",
    location: "Umuahia",
    experience: "7 years experience",
    rating: 4.9,
    reviews: 41,
    description: "Experienced caterer providing delicious meals, event catering and food services for all occasions.",
    skills: ["Event Catering", "Meal Preparation", "Small Chops"],
    initials: "NU",
    availability: "Accepting bookings",
    about: "I provide food preparation and catering services for private events, celebrations and business gatherings. My focus is quality meals, good presentation and dependable service.",
    services: ["Event catering", "Small chops", "Private meal preparation", "Food trays", "Event menu planning"],
    workHistory: [
      { role: "Independent Caterer", period: "2019 – Present", description: "Providing catering services for private events, celebrations and corporate gatherings." },
    ],
    portfolio: [
      { title: "Event Catering", category: "Catering", number: "01" },
      { title: "Small Chops", category: "Food Service", number: "02" },
      { title: "Food Presentation", category: "Hospitality", number: "03" },
    ],
  },
  {
    id: 7,
    name: "Obinna Aja",
    profession: "Electrician",
    category: "Technical Services",
    location: "Aba",
    experience: "8 years experience",
    rating: 4.7,
    reviews: 25,
    description: "Qualified electrical technician handling domestic wiring, electrical installations and repairs.",
    skills: ["Electrical Wiring", "Installation", "Repairs"],
    initials: "OA",
    availability: "Available for jobs",
    about: "I handle domestic electrical installations, wiring and troubleshooting. I aim to deliver safe, reliable electrical work for homes and small businesses.",
    services: ["Electrical wiring", "Fault diagnosis", "Electrical installations", "Lighting installation", "Electrical repairs"],
    workHistory: [
      { role: "Independent Electrical Technician", period: "2018 – Present", description: "Handling residential and small-business electrical installation and maintenance jobs." },
    ],
    portfolio: [
      { title: "Home Wiring", category: "Installation", number: "01" },
      { title: "Lighting Systems", category: "Electrical", number: "02" },
      { title: "Electrical Repairs", category: "Maintenance", number: "03" },
    ],
  },
  {
    id: 8,
    name: "Esther Otti",
    profession: "Photographer",
    category: "Creative & Design",
    location: "Arochukwu",
    experience: "4 years experience",
    rating: 4.8,
    reviews: 18,
    description: "Creative photographer covering portraits, celebrations, product photography and events.",
    skills: ["Portraits", "Event Photography", "Editing"],
    initials: "EO",
    availability: "Open to bookings",
    about: "I capture meaningful moments and create visual content for individuals, events and businesses. My services include portrait sessions, event coverage and product photography.",
    services: ["Portrait photography", "Event coverage", "Product photography", "Photo editing", "Personal photography sessions"],
    workHistory: [
      { role: "Independent Photographer", period: "2022 – Present", description: "Providing photography and editing services for individuals, events and businesses." },
    ],
    portfolio: [
      { title: "Portrait Sessions", category: "Portraits", number: "01" },
      { title: "Event Coverage", category: "Events", number: "02" },
      { title: "Product Photography", category: "Commercial", number: "03" },
    ],
  },
];

async function ProfessionalProfileContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();

  const { id } = await params;

  const professional = professionals.find(
    (person) => person.id === Number(id)
  );

  if (!professional) notFound();

  return (
    <>
      <Header />

      <main className="public-profile-page">
        <div className="public-profile-container">
          <Link href="/professionals" className="public-profile-back">
            <ArrowLeft size={17} />
            Back to professionals
          </Link>

          <section className="public-profile-hero">
            <div className="public-profile-identity">
              <div className="public-profile-avatar">
                {professional.initials}
              </div>

              <div className="public-profile-name-block">
                <div className="public-profile-badges">
                  {professional.featured && (
                    <span className="public-profile-featured">
                      FEATURED PROFESSIONAL
                    </span>
                  )}
                  <span className="public-profile-verified">
                    <ShieldCheck size={14} /> Sample profile
                  </span>
                </div>

                <h1>{professional.name}</h1>
                <p>{professional.profession}</p>

                <div className="public-profile-quick-meta">
                  <span>
                    <MapPin size={16} /> {professional.location}, Abia State
                  </span>
                  <span>
                    <BriefcaseBusiness size={16} /> {professional.experience}
                  </span>
                  <span className="public-profile-rating">
                    <Star size={16} fill="currentColor" /> {professional.rating} ({professional.reviews} reviews)
                  </span>
                </div>
              </div>
            </div>

            <div className="public-profile-actions">
              <span className="public-profile-availability">
                <span /> {professional.availability}
              </span>
              <Link href="/login" className="public-profile-contact">
                <MessageCircle size={18} />
                Contact professional
              </Link>
              <span className="public-profile-action-note">
                Sign in to connect through Abi Job.
              </span>
            </div>
          </section>

          <div className="public-profile-layout">
            <div className="public-profile-main-column">
              <section className="public-profile-section">
                <div className="public-profile-section-heading">
                  <span>01</span>
                  <h2>About this professional</h2>
                </div>
                <p className="public-profile-about">{professional.about}</p>
              </section>

              <section className="public-profile-section">
                <div className="public-profile-section-heading">
                  <span>02</span>
                  <h2>Services offered</h2>
                </div>

                <div className="public-profile-services">
                  {professional.services.map((service) => (
                    <div key={service} className="public-profile-service">
                      <CheckCircle2 size={18} />
                      {service}
                    </div>
                  ))}
                </div>
              </section>

              <section className="public-profile-section">
                <div className="public-profile-section-heading">
                  <span>03</span>
                  <h2>Portfolio and work samples</h2>
                </div>

                <p className="public-profile-section-intro">
                  Examples of the type of work this professional offers.
                </p>

                <div className="public-profile-portfolio">
                  {professional.portfolio.map((item) => (
                    <article
                      className="public-profile-portfolio-card"
                      key={item.number}
                    >
                      <div className={`public-profile-portfolio-art portfolio-art-${item.number}`}>
                        <span>{item.number}</span>
                        <BriefcaseBusiness size={31} />
                      </div>
                      <div>
                        <h3>{item.title}</h3>
                        <p>{item.category}</p>
                      </div>
                    </article>
                  ))}
                </div>
                <p className="public-profile-demo-note">
                  Portfolio previews are placeholders until professionals upload their actual work.
                </p>
              </section>

              <section className="public-profile-section">
                <div className="public-profile-section-heading">
                  <span>04</span>
                  <h2>Experience</h2>
                </div>

                <div className="public-profile-work-history">
                  {professional.workHistory.map((work) => (
                    <article className="public-profile-work-item" key={work.role}>
                      <div className="public-profile-work-icon">
                        <BriefcaseBusiness size={19} />
                      </div>
                      <div>
                        <h3>{work.role}</h3>
                        <span>{work.period}</span>
                        <p>{work.description}</p>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            </div>

            <aside className="public-profile-sidebar">
              <section className="public-profile-side-card">
                <h2>Professional overview</h2>

                <div className="public-profile-side-row">
                  <span><BriefcaseBusiness size={17} /> Category</span>
                  <strong>{professional.category}</strong>
                </div>

                <div className="public-profile-side-row">
                  <span><MapPin size={17} /> Location</span>
                  <strong>{professional.location}</strong>
                </div>

                <div className="public-profile-side-row">
                  <span><Clock3 size={17} /> Experience</span>
                  <strong>{professional.experience}</strong>
                </div>

                <div className="public-profile-side-row">
                  <span><CalendarDays size={17} /> Availability</span>
                  <strong>{professional.availability}</strong>
                </div>
              </section>

              <section className="public-profile-side-card">
                <h2>Skills and expertise</h2>
                <div className="public-profile-skills">
                  {professional.skills.map((skill) => (
                    <span key={skill}>{skill}</span>
                  ))}
                </div>
              </section>

              <section className="public-profile-help-card">
                <div><MessageCircle size={22} /></div>
                <h2>Interested in working together?</h2>
                <p>Sign in to Abi Job to connect with this professional.</p>
                <Link href="/login">
                  Sign in to connect <ArrowUpRight size={17} />
                </Link>
              </section>
            </aside>
          </div>

          <div className="public-profile-bottom-link">
            <Link href="/professionals">
              <ArrowLeft size={17} /> Explore more professionals
            </Link>
            <Link href="/register/professional">
              Are you a professional? Join Abi Job <ArrowRight size={17} />
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}

export default function ProfessionalProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={
        <main className="public-profile-page">
          <div className="public-profile-container">
            <p>Loading professional profile...</p>
          </div>
        </main>
      }
    >
      <ProfessionalProfileContent params={params} />
    </Suspense>
  );
}
