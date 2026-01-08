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

export const HomePage = () => {
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
        <div className="home__hero-card">
          <h3>How It Works</h3>
          <ul>
            <li>1️⃣ Submit Your Print Request</li>
            <li>2️⃣ We Print Your Order</li>
            <li>3️⃣ Delivery or Collection</li>
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
