import { Link } from 'react-router-dom';
import './Terms.css';

const termsSections = [
  {
    title: '1. Introduction',
    paragraphs: [
      'By accessing and using this website, you agree to comply with and be bound by these Terms & Conditions.',
      'If you do not agree with any part of these terms, please do not use our services.'
    ]
  },
  {
    title: '2. Services',
    paragraphs: [
      'We provide custom print services based on user-submitted requests and sell print-related products through our online shop.',
      'Custom print services are delivered free of charge only to selected universities.',
      'Shop products are delivered nationwide via courier service.',
      'Service availability may change at any time without prior notice.'
    ]
  },
  {
    title: '3. Custom Print Requests',
    paragraphs: [
      'To submit a custom print request, users must:'
    ],
    bullets: [
      'Fill out the custom print form with accurate information',
      'Provide a valid and accessible file link (e.g., Google Drive)',
      'Select correct print options (Color or Black & White, quantity, etc.)'
    ],
    closing: 'Once a request is submitted and accepted, the order enters the processing stage.'
  },
  {
    title: '4. Security Fee (Important)',
    paragraphs: [
      'To confirm a custom print request, we collect a non-refundable security fee of 20 BDT.'
    ],
    bullets: [
      'This fee is required to validate and process the request',
      'Orders without a valid payment transaction number will not be processed',
      'The security fee helps reduce fake or incomplete orders',
      'The security fee is not refundable once the request is submitted.'
    ]
  },
  {
    title: '5. File Responsibility',
    paragraphs: [
      'Users are fully responsible for:'
    ],
    bullets: [
      'The content and quality of submitted files',
      'Ensuring files are correct, complete, and printable',
      'Verifying spelling, layout, and formatting before submission'
    ],
    closing: 'We are not responsible for printing errors caused by incorrect or low-quality files provided by the user.'
  },
  {
    title: '6. Payment & Transaction',
    bullets: [
      'Users must submit a valid transaction number for the security fee',
      'Orders with invalid, false, or unverifiable transaction details may be delayed or cancelled',
      'Additional printing charges (if any) will be communicated before final processing'
    ]
  },
  {
    title: '7. Delivery Policy',
    bullets: [
      'Free delivery is available only for selected universities',
      'Delivery time may vary based on location and workload',
      'Shop products are delivered across Bangladesh via third-party courier services',
      'Courier delays are beyond our direct control'
    ]
  },
  {
    title: '8. Order Processing & Cancellation',
    bullets: [
      'Orders are processed only after security fee verification',
      'Cancellation requests must be submitted before printing starts',
      'Once printing has begun, cancellation is not possible'
    ]
  },
  {
    title: '9. Refund Policy',
    bullets: [
      'The 20 BDT security fee is non-refundable',
      'No refund is applicable once printing has started',
      'If an error occurs due to our mistake, the issue will be reviewed and resolved accordingly'
    ]
  },
  {
    title: '10. Content Restrictions',
    paragraphs: [
      'Users must not submit files containing:'
    ],
    bullets: [
      'Illegal content',
      'Offensive or harmful material',
      'Copyrighted content without proper authorization'
    ],
    closing: 'We reserve the right to reject any order that violates these rules.'
  },
  {
    title: '11. Limitation of Liability',
    bullets: [
      'Courier delays',
      'File quality or content issues provided by users',
      'Indirect or incidental damages'
    ],
    closing: 'Our liability is limited to the amount paid for the specific service.'
  },
  {
    title: '12. Changes to Terms',
    paragraphs: [
      'We reserve the right to update or modify these Terms & Conditions at any time.',
      'Changes will be effective immediately upon being posted on the website.'
    ]
  },
  {
    title: '13. Contact Information',
    paragraphs: [
      'For any questions regarding these Terms & Conditions, please contact us through the website.'
    ]
  }
];

export const TermsPage = () => {
  return (
    <div className="terms">
      <header className="terms__hero">
        <p className="terms__eyebrow">📜 Terms & Conditions</p>
        <h1>Understand How Rong Chapa Operates</h1>
        <p>
          These Terms & Conditions outline the responsibilities of both our team and every student who uses our services.
          Please read them carefully before placing an order or submitting a custom print request.
        </p>
      </header>

      <section className="terms__sections">
        {termsSections.map((section) => (
          <article key={section.title}>
            <h2>{section.title}</h2>
            {section.paragraphs?.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            {section.bullets && section.bullets.length > 0 && (
              <ul>
                {section.bullets.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
            {section.closing && <p className="terms__closing">{section.closing}</p>}
          </article>
        ))}
      </section>

      <section className="terms__cta">
        <h2>Questions About These Terms?</h2>
        <p>Reach out through our contact channels before placing an order. We are happy to help.</p>
        <Link to="/print" className="terms__cta-link">Review Print Request Form</Link>
      </section>
    </div>
  );
};
