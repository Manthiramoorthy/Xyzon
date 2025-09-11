import "bootstrap/dist/css/bootstrap.min.css";
import { FaPhoneAlt, FaEnvelope, FaMapMarkerAlt, FaClock, FaGlobe, FaHandsHelping, FaLaptopCode, FaPaintBrush, FaInstagram, FaFacebookF, FaLinkedin, FaTwitter, FaUserGraduate, FaAward, FaBriefcase, FaFlag } from 'react-icons/fa';
import React, { useEffect, useRef, useState } from 'react';
import { useMenu } from './context/MenuContext';
import { useAuth } from './auth/AuthContext';
import { Link } from 'react-router-dom';
import ContactForm from './components/ContactForm';
import './App.css';

function useCountUp(target, duration = 1500) {
  const [count, setCount] = useState(0);
  const rafRef = useRef();
  useEffect(() => {
    let start = null;
    const step = (timestamp) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);
  return count;
}

export default function App() {
  const { user } = useAuth ? useAuth() : { user: null }; // defensively fallback
  const { clearItems } = useMenu ? useMenu() : { clearItems: () => { } };
  useEffect(() => { clearItems(); }, [clearItems]);
  // Navigation Menu Data
  const navigationItems = [
    { label: 'Home', href: '#' },
    { label: 'About Us', href: '#about' },
    { label: 'Programs', href: '#programs' },
    { label: 'Events', href: '/events' },
    { label: 'Services', href: '#services' },
    { label: 'Success Stories', href: '#testimonials' },
    { label: 'Contact', href: '#contact' }
  ];

  // Ticker Badges Data
  const tickerBadges = [
    '3M+ Learners Worldwide',
    '500+ Certifications',
    'Global Recognition',
    'Tier 2 & 3 Focus',
    'Industry Partnerships',
    'Real Projects'
  ];

  // Why Choose Features Data
  const whyChooseFeatures = [
    {
      icon: FaGlobe,
      title: 'Global Standard Certifications',
      description: 'Oracle, Microsoft, CompTIA & international credentials that open global opportunities.',
      gradient: 'bg-gradient-primary'
    },
    {
      icon: FaLaptopCode,
      title: 'Real-World Project Experience',
      description: 'Hands-on product engineering & capstone projects with industry mentors and real clients.',
      gradient: 'bg-gradient-accent'
    },
    {
      icon: FaHandsHelping,
      title: 'Rural-to-Global Bridge',
      description: 'Makerspace & community launch pads that enable income-generating projects for rural talent.',
      gradient: 'bg-gradient-success'
    },
    {
      icon: FaPaintBrush,
      title: 'Complete Skill Ecosystem',
      description: 'Tech + Creative learning paths to build versatile, future-ready professionals.',
      gradient: 'bg-gradient-warning'
    }
  ];

  // Programs Data
  const programs = [
    {
      title: 'Technical Certifications',
      description: 'Global IT credentials & practical lab exposure.',
      badge: 'Popular',
      icon: FaLaptopCode,
      iconColor: 'navy',
      features: [
        'Oracle / Microsoft / CompTIA',
        'Cybersecurity & Cloud',
        'Data / DevOps / AI & ML',
        'Full Stack & Blockchain'
      ]
    },
    {
      title: 'Creative Skills Development',
      description: 'Design, media & digital storytelling pathways.',
      badge: 'Creative',
      icon: FaPaintBrush,
      iconColor: 'orange',
      features: [
        'Animation & Graphic Design',
        'Video & Motion Editing',
        'Digital Marketing',
        'UI / UX Fundamentals'
      ]
    },
    {
      title: 'Faculty Development (FDP)',
      description: 'Modern pedagogy & emerging tech enablement.',
      badge: 'FDP',
      icon: FaHandsHelping,
      iconColor: 'orange-light',
      features: [
        'Outcome-based delivery',
        'Emerging tech masterclasses',
        'Assessment frameworks',
        'Mentor resource kits'
      ]
    },
    {
      title: 'Software Product Engineering',
      description: 'Full-cycle build & technical acceleration.',
      badge: 'Build',
      icon: FaLaptopCode,
      iconColor: 'orange',
      features: [
        'MVP & rapid prototyping',
        'Architecture & scaling',
        'Dev sprints & QA automation',
        'Launch & support'
      ]
    },
    {
      title: 'Corporate Upskilling',
      description: 'Tailored workforce capability programs.',
      badge: 'B2B',
      icon: FaGlobe,
      iconColor: 'navy',
      features: [
        'Role gap mapping',
        'Custom learning paths',
        'Productivity analytics',
        'Certification pathways'
      ]
    },
    {
      title: 'Makerspace Initiative',
      description: 'Rural + student talent to global marketplaces.',
      badge: 'Impact',
      icon: FaHandsHelping,
      iconColor: 'green',
      features: [
        'Project sourcing bridge',
        'Mentor & tool access',
        'Earn while learning',
        'Community innovation hub'
      ]
    }
  ];

  // Services Data
  const services = [
    {
      icon: FaLaptopCode,
      gradient: 'bg-gradient-primary',
      title: 'College Training Programs',
      description: 'Comprehensive curriculum design and delivery for educational institutions across India.',
      features: [
        'Custom curriculum development',
        'Faculty training and certification',
        'Student placement assistance',
        'Industry-academia partnerships'
      ]
    },
    {
      icon: FaHandsHelping,
      gradient: 'bg-gradient-success',
      title: 'Corporate Training',
      description: 'Tailored upskilling programs for organizations to enhance their workforce capabilities.',
      features: [
        'Employee skill assessment',
        'Custom training modules',
        'Performance tracking',
        'Certification programs'
      ]
    },
    {
      icon: FaPaintBrush,
      gradient: 'bg-gradient-accent',
      title: 'Product Development',
      description: 'End-to-end software product development services for startups and enterprises.',
      features: [
        'MVP development',
        'Full-stack solutions',
        'Technical consulting',
        'Maintenance & support'
      ]
    },
    {
      icon: FaGlobe,
      gradient: 'bg-gradient-warning',
      title: 'Makerspace Services',
      description: 'Community-driven spaces that connect rural talent with global opportunities.',
      features: [
        'Co-working spaces',
        'Mentorship programs',
        'Project collaboration',
        'Freelance marketplace access'
      ]
    },
    {
      icon: FaLaptopCode,
      gradient: 'bg-gradient-primary',
      title: 'Hackathons Centric Learning',
      description: 'Immersive hackathon-led learning modules driving rapid skill acquisition and innovation.',
      features: [
        'Problem-focused sprints',
        'Industry challenge statements',
        'Mentor-led innovation',
        'Prototype to product pathways'
      ]
    },
    {
      icon: FaHandsHelping,
      gradient: 'bg-gradient-success',
      title: 'Entrepreneur Ecosystem Enablement',
      description: 'Support framework for student & rural founders to ideate, validate and scale ventures.',
      features: [
        'Ideation workshops',
        'MVP & market validation',
        'Investor & mentor connects',
        'Incubation readiness'
      ]
    }
  ];

  // Testimonials Data
  const testimonials = [
    {
      quote: "Xyzon's certification program opened doors I never thought possible. From a small town to working with Fortune 500 companies!",
      name: 'Priya Sharma',
      role: 'Software Developer @ TCS',
      subtitle: 'Tier 3 City → Global Career',
      initial: 'P',
      gradient: 'bg-gradient-primary'
    },
    {
      quote: "The Makerspace initiative helped me transition from farming to freelancing. Now I earn ₹50K+ monthly through digital projects.",
      name: 'Ramesh Kumar',
      role: 'Freelance Developer',
      subtitle: 'Rural Entrepreneur',
      initial: 'R',
      gradient: 'bg-gradient-success'
    },
    {
      quote: "Faculty development program revolutionized our teaching methodology. Student placement rates improved by 300%!",
      name: 'Dr. Ananya Patel',
      role: 'Professor & HOD',
      subtitle: 'Engineering College',
      initial: 'A',
      gradient: 'bg-gradient-accent'
    },
    {
      quote: "Started with zero coding knowledge, completed Oracle certification, and now leading a team of 15 developers. Xyzon made it possible!",
      name: 'Suresh Patel',
      role: 'Technical Lead @ Infosys',
      initial: 'S',
      gradient: 'bg-gradient-warning'
    },
    {
      quote: "Our startup got seed funding after building MVP through Xyzon's product development program. Amazing technical mentorship!",
      name: 'Meera Reddy',
      role: 'Startup Founder',
      initial: 'M',
      gradient: 'bg-gradient-primary'
    }
  ];

  // Contact Information Data
  const contactInfo = [
    {
      icon: FaEnvelope,
      gradient: 'bg-gradient-primary',
      title: 'Email',
      value: 'contact@xyzon.in',
      href: 'mailto:contact@xyzon.in'
    },
    {
      icon: FaPhoneAlt,
      gradient: 'bg-gradient-success',
      title: 'Phone',
      value: '+91 87542 00247',
      href: 'tel:+9187542002470'
    },
    {
      icon: FaMapMarkerAlt,
      gradient: 'bg-gradient-accent',
      title: 'Location',
      value: 'CAMPUS 1A, NO.143, DR.M.G.R. ROAD,\nPerungudi, Saidapet, Kanchipuram- 600096,\nTamil Nadu',
      href: 'https://g.co/kgs/T88CA9X'
    }
  ];

  // Footer Links Data
  const footerLinks = {
    quickLinks: [
      { label: 'Programs', href: '#programs' },
      { label: 'Services', href: '#services' },
      { label: 'About', href: '#about' },
      { label: 'Contact', href: '#contact' }
    ],
    resources: [
      { label: 'Blog', href: '#' },
      { label: 'Success Stories', href: '#testimonials' },
      { label: 'Downloads', href: '#' },
      { label: 'Careers', href: '#' }
    ]
  };

  // Social Media Links Data
  const socialLinks = [
    { icon: FaTwitter, href: 'https://x.com/PvtXyzon?t=sEiud0UKqv0CZS1Oaa3cmA&s=09', label: 'X' },
    { icon: FaInstagram, href: 'https://www.instagram.com/xyzoninnovations?igsh=eHhpNzg1c280YTR6', label: 'Instagram' },
    { icon: FaFacebookF, href: 'https://www.facebook.com/share/1CKjzmv1fn/', label: 'Facebook' },
    { icon: FaLinkedin, href: 'https://www.linkedin.com/company/xyzon-innovations/', label: 'LinkedIn' }
  ];

  const slides = [
    '/assets/images/slide/mou.jpeg',
    '/assets/images/slide/fdp-trichy.jpeg',
    '/assets/images/slide/fdp-bengalore.jpeg'
  ];

  const students = useCountUp(25000, 2000); // Updated to 25000+
  const certifications = useCountUp(50, 1600);
  const placements = useCountUp(200, 1600);
  const countries = useCountUp(7, 1600); // Countries reached metric

  const stats = [
    { label: 'Learners Reached', value: students, icon: FaUserGraduate, color: 'circle-navy', suffix: '+' },
    { label: 'Certifications Delivered', value: certifications, icon: FaAward, color: 'circle-orange', suffix: '+' },
    { label: 'Global Placements', value: placements, icon: FaBriefcase, color: 'circle-orange-light', suffix: '+' },
    { label: 'Countries Reached', value: countries, icon: FaFlag, color: 'circle-green', suffix: '+' }
  ];

  return (
    <div>
      {/* Unified Header component provides top navigation globally */}

      <section className="hero-section">
        <div className="hero-bg"></div>
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-12">
              <div className="hero-content">
                <h1 className="text-gradient">Transforming India into the Global Development Hub</h1>
                <p className="lead">Empowering aspirants with world-class certifications, cutting-edge training, and global opportunities — focused on Tier 2 & 3 impact and nation-building.</p>
                <div className="d-flex gap-3 mb-4">
                  <a href="#programs" className="btn btn-primary btn-lg">Explore Programs</a>
                </div>
                <p className="text-muted">We provide college & corporate training, faculty development programs and product engineering services.</p>
              </div>
            </div>
            {/* <div className="col-lg-6">
              <div id="homeCarousel" className="carousel slide carousel-modern" data-bs-ride="carousel" data-bs-interval="3500" data-bs-pause="false">
                <div className="carousel-indicators">
                  {slides.map((_, i) => (
                    <button key={i} type="button" data-bs-target="#homeCarousel" data-bs-slide-to={i} className={i === 0 ? 'active' : ''} aria-label={`Slide ${i + 1}`} aria-current={i === 0 ? 'true' : undefined}></button>
                  ))}
                </div>
                <div className="carousel-inner">
                  {slides.map((src, idx) => (
                    <div key={src} className={`carousel-item${idx === 0 ? ' active' : ''}`}>
                      <img src={src} className="d-block w-100" alt={`slide-${idx}`} />
                    </div>
                  ))}
                </div>
                <button className="carousel-control-prev" type="button" data-bs-target="#homeCarousel" data-bs-slide="prev">
                  <span className="carousel-control-prev-icon" aria-hidden="true"></span>
                  <span className="visually-hidden">Previous</span>
                </button>
                <button className="carousel-control-next" type="button" data-bs-target="#homeCarousel" data-bs-slide="next">
                  <span className="carousel-control-next-icon" aria-hidden="true"></span>
                  <span className="visually-hidden">Next</span>
                </button>
              </div>
            </div> */}
          </div>
        </div>
      </section>

      <div className="container my-5">
        <div className="overflow-hidden">
          <div className="d-flex ticker py-3">
            {tickerBadges.map((badge, index) => (
              <div key={index} className="badge">{badge}</div>
            ))}
          </div>
        </div>
      </div>

      <section id="about" className="container py-5">
        <div className="row align-items-center">
          <h2 className="text-gradient fw-bold mb-4" style={{ fontSize: '3rem' }}>About Xyzon Innovations</h2>
          <div className="col-lg-6">
            <p className="fs-5 mb-4">
              Founded with a vision to bridge the skill gap between academia and industry, Xyzon Innovations is at the forefront of transforming India into a global development powerhouse.
            </p>
            <p className="text-muted mb-4">
              We specialize in delivering world-class technical certifications, creative skill development, and comprehensive training programs. Our unique approach combines theoretical knowledge with hands-on practical experience, ensuring our learners are industry-ready from day one.
            </p>
            <div className="row g-4 mb-4">
              <div className="col-6">
                <div className="text-center">
                  <div className="text-gradient fw-bold" style={{ fontSize: '2rem' }}>2018</div>
                  <div className="text-muted small">Founded</div>
                </div>
              </div>
              <div className="col-6">
                <div className="text-center">
                  <div className="text-gradient fw-bold" style={{ fontSize: '2rem' }}>7+</div>
                  <div className="text-muted small">Countries Reached</div>
                </div>
              </div>
            </div>
            <div className="d-flex gap-3">
              <a href="#programs" className="btn btn-primary">Explore Programs</a>
              <a href="#contact" className="btn btn-outline-primary">Get in Touch</a>
            </div>
          </div>
          <div className="col-lg-6">
            <div className="card m-2 p-4">
              <h5 className="mb-4">Our Mission</h5>
              <blockquote className="blockquote mb-4">
                <p className="mb-3">"To empower individuals with cutting-edge skills and create pathways from rural communities to global opportunities, making India a leading destination for technology innovation and development."</p>
              </blockquote>
              <div className="row g-3">
                <div className="col-md-6">
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <div className="icon-circle bg-gradient-primary" style={{ width: '30px', height: '30px' }}>
                      <FaGlobe size={12} className="text-white" />
                    </div>
                    <span className="small fw-medium">Global Standards</span>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <div className="icon-circle bg-gradient-success" style={{ width: '30px', height: '30px' }}>
                      <FaHandsHelping size={12} className="text-white" />
                    </div>
                    <span className="small fw-medium">Rural Impact</span>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <div className="icon-circle bg-gradient-accent" style={{ width: '30px', height: '30px' }}>
                      <FaLaptopCode size={12} className="text-white" />
                    </div>
                    <span className="small fw-medium">Practical Learning</span>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <div className="icon-circle bg-gradient-warning" style={{ width: '30px', height: '30px' }}>
                      <FaPaintBrush size={12} className="text-white" />
                    </div>
                    <span className="small fw-medium">Creative Skills</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container py-5">
        <h2 className="text-center text-gradient fw-bold mb-5" style={{ fontSize: '3rem' }}>Why Choose Xyzon Innovations?</h2>
        <div className="row g-4">
          {whyChooseFeatures.map((feature, index) => (
            <div key={index} className="col-lg-3 col-md-6">
              <div className="card feature-card h-100 text-center p-4">
                <div className={`icon-circle mb-3 mx-auto ${feature.gradient}`}>
                  <feature.icon size={24} className="text-white" />
                </div>
                <h5 className="fw-bold mb-3">{feature.title}</h5>
                <p className="text-muted">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="container py-5">
        <div className="stats-grid mb-4">
          {stats.map((s, i) => (
            <div key={i} className="stat-card">
              <div className="stat-accent-bar" />
              <div className={`stat-icon ${s.color}`}>
                <s.icon size={26} />
              </div>
              <div className="stat-number text-gradient">{s.value.toLocaleString()}{s.suffix}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section id="programs" className="container py-5">
        <h2 className="text-center text-gradient fw-bold mb-4" style={{ fontSize: '3rem' }}>Comprehensive Learning Solutions</h2>
        <p className="text-muted text-center mx-auto mb-5" style={{ maxWidth: '760px' }}>
          Structured learning ecosystems spanning certifications, creative disciplines, pedagogy enablement, engineering delivery, corporate transformation and maker-driven impact.
        </p>
        <div className="learning-grid">
          {programs.map((p, i) => (
            <div key={i} className="learning-card">
              <div className={`learning-icon ${p.iconColor === 'green' ? 'circle-green' : p.iconColor === 'orange-light' ? 'circle-orange-light' : p.iconColor === 'orange' ? 'circle-orange' : 'circle-navy'}`}>
                <p.icon size={26} />
              </div>
              <div className="learning-head">
                {p.title}
                <span className={`learning-badge ${i % 2 === 1 ? 'alt' : ''}`}>{p.badge}</span>
              </div>
              <div className="learning-desc">{p.description}</div>
              <ul className="learning-features">
                {p.features.map((f, fi) => (
                  <li key={fi}>{f}</li>
                ))}
              </ul>
              <div className="learning-footer">
                <a
                  href="#contact"
                  className="learning-cta"
                  onClick={(e) => {
                    e.preventDefault();
                    const target = document.getElementById('contact');
                    if (target) {
                      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    } else {
                      window.location.hash = 'contact';
                    }
                  }}
                  style={{ position: 'relative', zIndex: 2 }}
                >
                  Learn More →
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="services" className="bg-light py-5">
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="text-gradient fw-bold mb-3" style={{ fontSize: '3rem' }}>Our Services</h2>
            <p className="text-muted fs-5 mb-0" style={{ maxWidth: '600px', margin: '0 auto' }}>
              Comprehensive solutions designed to empower individuals, institutions, and organizations with cutting-edge skills and technology.
            </p>
          </div>
          <div className="row g-4">
            {services.map((service, index) => (
              <div key={index} className="col-lg-6 text-center">
                <div className="card h-100 p-4 service-card ">
                  <div className="d-flex align-items-start gap-3">

                    <div>
                      <div className="d-flex justify-content-center align-items-center gap-3 mb-3">
                        <div className={`icon-circle ${service.gradient}`}>
                          <service.icon size={24} className="text-white" />
                        </div>
                        <h4 className="mb-3 mt-3 text-center">{service.title}</h4>
                      </div>
                      <p className="text-muted mb-3">{service.description}</p>
                      <ul className="text-muted list-unstyled service-features">
                        {service.features.map((feature, featureIndex) => (
                          <li key={featureIndex} className="mb-2">✓ {feature}</li>
                        ))}
                      </ul>
                      <a href="#contact" className="btn btn-outline-primary btn-sm mt-3">Learn More</a>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="testimonials" className="container py-5">
        <div className="text-center mb-5">
          <h2 className="text-gradient fw-bold mb-3" style={{ fontSize: '3rem' }}>Success Stories</h2>
          <p className="text-muted fs-5 mb-0" style={{ maxWidth: '600px', margin: '0 auto' }}>
            Real transformations from our learners who've built careers, launched startups, and created impact in their communities.
          </p>
        </div>

        <div className="testimonials-scroll-container">
          <div className="testimonials-scroll">
            {/* First set of testimonials */}
            {testimonials.map((testimonial, index) => (
              <div key={`first-${index}`} className="testimonial-item">
                <div className="card h-100 testimonial-card mb-2">
                  <div className="card-body d-flex flex-column">
                    <div className="mb-3">
                      <div className="d-flex mb-3">
                        {[...Array(5)].map((_, i) => (
                          <span key={i} className="text-warning">★</span>
                        ))}
                      </div>
                      <p className="mb-4 line-clamp-4">"{testimonial.quote}"</p>
                    </div>
                    <div className="mt-auto">
                      <div className="d-flex align-items-center gap-3">
                        <div className={`icon-circle ${testimonial.gradient}`}>
                          <span className="fw-bold text-white">{testimonial.initial}</span>
                        </div>
                        <div>
                          <div className="fw-bold line-clamp-1">{testimonial.name}</div>
                          <div className="text-muted small line-clamp-1">{testimonial.role}</div>
                          {testimonial.subtitle && (
                            <div className="text-muted small">{testimonial.subtitle}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {/* Duplicate set for infinite scroll */}
            {testimonials.map((testimonial, index) => (
              <div key={`second-${index}`} className="testimonial-item">
                <div className="card h-100 testimonial-card mb-2">
                  <div className="card-body d-flex flex-column">
                    <div className="mb-3">
                      <div className="d-flex mb-3">
                        {[...Array(5)].map((_, i) => (
                          <span key={i} className="text-warning">★</span>
                        ))}
                      </div>
                      <p className="mb-4 line-clamp-4">"{testimonial.quote}"</p>
                    </div>
                    <div className="mt-auto">
                      <div className="d-flex align-items-center gap-3">
                        <div className={`icon-circle ${testimonial.gradient}`}>
                          <span className="fw-bold text-white">{testimonial.initial}</span>
                        </div>
                        <div>
                          <div className="fw-bold line-clamp-1">{testimonial.name}</div>
                          <div className="text-muted small line-clamp-1">{testimonial.role}</div>
                          {testimonial.subtitle && (
                            <div className="text-muted small">{testimonial.subtitle}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center mt-5">
          <a href="#contact" className="btn btn-primary btn-lg">Share Your Success Story</a>
        </div>
      </section>


      <section id="contact" className="container py-5">
        <div className="text-center mb-5">
          <h3 className="text-gradient fw-bold mb-4" style={{ fontSize: '2.5rem' }}>Get in Touch</h3>
          <p className="text-muted mb-4 fs-5">Ready to transform your career or scale your organization? Let's discuss how we can help you achieve your goals.</p>
        </div>
        <div className="row g-5">
          <div className="col-lg-12">
            <ContactForm />
          </div>
          <div className="col-lg-12">
            <div className="card p-4 h-100">
              <h5 className="mb-4 text-center"><b>Contact Information</b></h5>
              <div className="row">
                <div className="col-md-12">
                  <div className="mb-4">
                    <div className="d-flex align-items-center gap-3 mb-2">
                      <div className="icon-circle bg-gradient-primary" style={{ width: '40px', height: '40px' }}>
                        <FaEnvelope size={16} className="text-white" />
                      </div>
                      <div>
                        <div className="fw-bold">Email</div>
                        <a href="mailto:contact@xyzon.in" className="text-primary text-decoration-none">contact@xyzon.in</a>
                      </div>
                    </div>
                  </div>
                  <div className="mb-4">
                    <div className="d-flex align-items-center gap-3 mb-2">
                      <div className="icon-circle bg-gradient-success" style={{ width: '40px', height: '40px' }}>
                        <FaPhoneAlt size={16} className="text-white" />
                      </div>
                      <div>
                        <div className="fw-bold">Phone</div>
                        <a href="tel:+9187542002470" className="text-primary text-decoration-none">+91 87542 00247</a>
                      </div>
                    </div>
                  </div>
                  <div className="mb-4">
                    <div className="d-flex align-items-center gap-3 mb-2">
                      <div className="icon-circle bg-gradient-accent" style={{ width: '40px', height: '40px' }}>
                        <FaMapMarkerAlt size={16} className="text-white" />
                      </div>
                      <div>
                        <div className="fw-bold">Location</div>
                        <a className="text-primary text-decoration-none" href="https://g.co/kgs/T88CA9X" target="_blank" rel="noreferrer">
                          CAMPUS 1A, NO.143, DR.M.G.R. ROAD,<br />
                          Perungudi, Saidapet, Kanchipuram- 600096,<br />
                          Tamil Nadu
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="footer-modern">
        <div className="container">
          <div className="row g-4">
            <div className="col-lg-4">
              <div className="d-flex align-items-center gap-2 mb-3">
                <img src="/assets/images/default-logo.jpeg" alt="xyzon" style={{ height: 40 }} />
                <span className="fw-bold fs-4">Xyzon Innovations</span>
              </div>
              <p className="text-muted mb-4">Transforming India into a global development hub through world-class certifications, training and product engineering.</p>
              <div className="d-flex gap-3">
                <a className="text-primary" href="https://x.com/PvtXyzon?t=sEiud0UKqv0CZS1Oaa3cmA&s=09" target="_blank" rel="noreferrer" aria-label="X">
                  <FaTwitter size={20} />
                </a>
                <a className="text-primary" href="https://www.instagram.com/xyzoninnovations?igsh=eHhpNzg1c280YTR6" target="_blank" rel="noreferrer" aria-label="Instagram">
                  <FaInstagram size={20} />
                </a>
                <a className="text-primary" href="https://www.facebook.com/share/1CKjzmv1fn/" target="_blank" rel="noreferrer" aria-label="Facebook">
                  <FaFacebookF size={20} />
                </a>
                <a className="text-primary" href="https://www.linkedin.com/company/xyzon-innovations/" target="_blank" rel="noreferrer" aria-label="LinkedIn">
                  <FaLinkedin size={20} />
                </a>
              </div>
            </div>
            <div className="col-lg-2 col-md-6">
              <h6 className="fw-bold mb-3">Quick Links</h6>
              <ul className="list-unstyled">
                <li className="mb-2"><a className="text-muted text-decoration-none" href="#programs">Programs</a></li>
                <li className="mb-2"><a className="text-muted text-decoration-none" href="#services">Services</a></li>
                <li className="mb-2"><a className="text-muted text-decoration-none" href="#about">About</a></li>
                <li className="mb-2"><a className="text-muted text-decoration-none" href="#contact">Contact</a></li>
              </ul>
            </div>
            <div className="col-lg-3 col-md-6">
              <h6 className="fw-bold mb-3">Resources</h6>
              <ul className="list-unstyled">
                <li className="mb-2"><a className="text-muted text-decoration-none" href="#">Blog</a></li>
                <li className="mb-2"><a className="text-muted text-decoration-none" href="#testimonials">Success Stories</a></li>
                <li className="mb-2"><a className="text-muted text-decoration-none" href="#">Downloads</a></li>
                <li className="mb-2"><a className="text-muted text-decoration-none" href="#">Careers</a></li>
              </ul>
            </div>
            <div className="col-lg-3">
              <h6 className="fw-bold mb-3">Newsletter</h6>
              <p className="text-muted small mb-3">Stay updated with our latest programs and opportunities.</p>
              <div className="gap-2">
                <input className="form-control mb-2" placeholder="Your email" />
                <a className="btn btn-primary">Subscribe</a>
              </div>
            </div>
          </div>
          <hr className="my-4" style={{ borderColor: 'var(--glass-border)' }} />
          <div className="text-center text-muted">
            <p className="mb-0">© {new Date().getFullYear()} Xyzon Innovations Private Limited. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

