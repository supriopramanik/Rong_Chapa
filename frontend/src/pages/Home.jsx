import './Home.css';

const services = [
  {
    title: 'Digital Printing',
    description: 'High-resolution digital prints with vivid colors and sharp details for marketing materials.'
  },
  {
    title: 'Large Format',
    description: 'Banners, posters, and signage that stand out with weather-resistant finishing.'
  },
  {
    title: 'Corporate Stationery',
    description: 'Business cards, letterheads, and branded folders that elevate your identity.'
  }
];

export const HomePage = () => {
  return (
    <div className="home">
      <section className="home__hero">
        <div className="home__hero-content">
          <span className="home__tag">Premium Print Lab</span>
          <h1>Bring Your Colors To Life With Rong Chapa</h1>
          <p>
            From bold marketing campaigns to delicate wedding stationery, we craft print materials that leave a lasting
            impression.
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
        <div className="home__hero-card">
          <h3>Why customers trust us</h3>
          <ul>
            <li>⚡ Express turnaround</li>
            <li>🎯 Color-accurate printing</li>
            <li>🛠️ In-house finishing lab</li>
            <li>🧵 Premium material sourcing</li>
          </ul>
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
