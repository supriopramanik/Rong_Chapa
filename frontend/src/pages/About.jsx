import { Link } from 'react-router-dom';
import './About.css';

const aboutSections = [
  {
    title: 'What We Do',
    intro: [
      'We provide custom printing services for documents, notes, assignments, and other academic materials.',
      'Users can submit their files digitally, select print preferences, and choose a convenient collection time.'
    ],
    highlights: [
      'Free delivery to selected universities',
      'Nationwide courier delivery for shop products',
      'Simple and secure order submission'
    ]
  },
  {
    title: 'Our Goal',
    intro: [
      'Our goal is to provide affordable print services for students while bringing printing into a smarter and more modern system.',
      'We aim to modernize every step of the print journey with convenient, student-friendly workflows.'
    ],
    highlights: [
      'Reduce printing costs for students',
      'Save time by eliminating unnecessary shop visits',
      'Introduce a digital, organized, and reliable printing process',
      'Make print services accessible through an easy-to-use online platform'
    ]
  },
  {
    title: 'Why We Exist',
    intro: [
      'Traditional printing can be time-consuming, expensive, and inconvenient for students.',
      'We created this platform to solve these problems by combining technology with practical student needs.'
    ],
    highlights: [
      'By offering online print requests and campus-based delivery, we make printing more efficient and student-friendly.'
    ]
  },
  {
    title: 'Delivery Policy (Transparency Section)',
    intro: [
      'Free delivery is available only for selected universities.'
    ],
    highlights: [
      'For shop items, we deliver across Bangladesh through trusted courier services.'
    ]
  },
  {
    title: 'Our Vision',
    intro: [
      'To become a trusted, smart print service platform that supports students with reliable, low-cost printing solutions and modern digital workflows.'
    ],
    highlights: []
  },
  {
    title: 'Call to Action',
    intro: [
      'Printing doesn’t have to be complicated or expensive.'
    ],
    highlights: [
      'Submit your print request today and experience a smarter way to print.'
    ]
  }
];

export const AboutPage = () => {
  return (
    <div className="about">
      <section className="about__hero">
        <h1>Crafting Print Experiences Since 2026</h1>
        <p>
          We are a student-focused print service platform designed to make printing easier, faster, and more affordable.
          Our system allows users to submit custom print requests online instead of visiting print shops and waiting in line.
          We handle the printing process and ensure reliable delivery—so students can focus on their studies without worrying about printing hassles.
        </p>
      </section>

      <section className="about__sections">
        {aboutSections.map((section) => (
          <article key={section.title}>
            <h3>{section.title}</h3>
            {section.intro.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            {section.highlights.length > 0 && (
              <ul>
                {section.highlights.map((text) => (
                  <li key={text}>{text}</li>
                ))}
              </ul>
            )}
          </article>
        ))}
      </section>

      <section className="about__cta">
        <h2>Ready To Print Smarter?</h2>
        <p>Join many of students who trust Rong Chapa for hassle-free, reliable printing.</p>
        <Link className="about__cta-button" to="/print">Submit Your Request</Link>
      </section>
    </div>
  );
};
