import './About.css';

export const AboutPage = () => {
  return (
    <div className="about">
      <section className="about__hero">
        <h1>Crafting Print Experiences Since 2026</h1>
        <p>
          Rong Chapa started as a small family-run print studio in Dhaka and evolved into a full-service production lab.
          We combine Bangladeshi creativity with international print standards.
        </p>
      </section>

      <section className="about__grid">
        <article>
          <h3>Dedicated Craftsmanship</h3>
          <p>Our artisans inspect every sheet, ensuring faithful color reproduction and precise cutting.</p>
        </article>
        <article>
          <h3>Eco-Friendly Materials</h3>
          <p>We source FSC-certified papers and soy-based inks to reduce environmental footprint.</p>
        </article>
        <article>
          <h3>Nationwide Delivery</h3>
          <p>Partnered logistics ensure timely deliveries to Dhaka, Chattogram, Sylhet, and beyond.</p>
        </article>
      </section>

      <section className="about__team">
        <h2>Meet The Core Team</h2>
        <ul>
          <li>
            <strong>Suprio Pramanik</strong>
            <span>Creative Director</span>
          </li>
          <li>
            <strong>Shrabontika Roy</strong>
            <span>Print Production Lead</span>
          </li>
        </ul>
      </section>
    </div>
  );
};
