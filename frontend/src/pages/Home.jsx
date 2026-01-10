import { useEffect, useState } from 'react';
import './Home.css';

const services = [
  {
    title: 'Custom Print for Students',
    description: 'Custom document and file printing services designed mainly for students, with free delivery to selected universities.'
  },
  {
    title: 'Color & Black-White Printing',
    description: 'Choose between high-quality color printing or cost-effective black & white printing based on your needs.'
  },
  {
    title: 'Nationwide Shop Delivery',
    description: 'Our shop offers print-related products that are delivered all over Bangladesh through courier service.'
  }
];

const heroSlides = [
  {
    title: 'Vivid prints, every time',
    description: 'State-of-the-art presses tuned for sharp color and consistent registration.',
    image: 'https://images.unsplash.com/photo-1503694978374-8a2fa686963a?q=80&w=1169&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D?auto=format&fit=crop&w=1100&q=80'
  },
  {
    title: 'Quick student deliveries',
    description: 'Same-day campus drop-off inside Dhaka and overnight courier across Bangladesh.',
    image: 'https://plus.unsplash.com/premium_photo-1663054789678-60897a202680?q=80&w=1183&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D?auto=format&fit=crop&w=1100&q=80'
  },
  {
    title: 'Shop products ready to go',
    description: 'Premium papers, sketchbooks, and merchandising items curated by our team.',
    image: 'https://images.unsplash.com/photo-1708793699492-5fa208f52dcb?q=80&w=1171&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D?auto=format&fit=crop&w=1100&q=80'
  }
];

export const HomePage = () => {
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const timeout = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % heroSlides.length);
    }, 4500);

    return () => clearInterval(timeout);
  }, []);

  return (
    <div className="home">
      <section className="home__hero">
        <div className="home__hero-content">
          <span className="home__tag">Premium Print Lab</span>
          <h1>Bring Your Colors To Life With Rong Chapa</h1>
          <p>
            Submit your custom print request online and get it printed professionally.
            We provide free delivery to selected universities and nationwide courier delivery for shop products across Bangladesh.
          </p>
          <div className="home__actions">
            <a href="/print" className="home__btn home__btn--primary">
              Custom Print Request
            </a>
            <a href="/shop" className="home__btn home__btn--ghost">
              Explore Shop
            </a>
          </div>
        </div>
        <div className="home__hero-carousel" aria-roledescription="carousel" aria-label="Hero showcase">
          {heroSlides.map((slide, index) => (
            <figure
              key={slide.title}
              className={`home__hero-slide ${index === activeSlide ? 'home__hero-slide--active' : ''}`}
              style={{ backgroundImage: `url(${slide.image})` }}
            >
              <figcaption>
                <h3>{slide.title}</h3>
                <p>{slide.description}</p>
              </figcaption>
            </figure>
          ))}

          <div className="home__hero-carousel-indicators">
            {heroSlides.map((_, index) => (
              <button
                key={index}
                type="button"
                aria-label={`Show slide ${index + 1}`}
                className={`home__hero-carousel-indicator ${index === activeSlide ? 'home__hero-carousel-indicator--active' : ''}`}
                onClick={() => setActiveSlide(index)}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="home__services">
        <header>
          <h2>Services Crafted For Every Need</h2>
          <p>Dedicated print experts, modern equipment, and meticulous quality control.</p>
        </header>
        <div className="home__service-grid">
          {services.map((service) => (
            <article key={service.title}>
              <h3>{service.title}</h3>
              <p>{service.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="home__cta">
        <div>
          <h2>Need Something Special?</h2>
          <p>Submit a custom brief and our team will confirm pricing and timeline within 2 hours.</p>
        </div>
        <a href="/print" className="home__btn home__btn--accent">
          Start A Custom Brief
        </a>
      </section>
    </div>
  );
};
