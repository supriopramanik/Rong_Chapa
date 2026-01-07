import { Link } from 'react-router-dom';
import './Footer.css';

export const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer__content">
        <div>
          <h4>Rong Chapa · রং ছাপা</h4>
          <p>Premium print and design services crafted in Bangladesh.</p>
        </div>
        <div>
          <h5>Visit Us</h5>
          <p>Mohanogor Project, Dhaka</p>
          <p>Phone: +880 1751156833</p>
        </div>
        <div>
          <h5>Others</h5>
          <p>
            <Link className="footer__link" to="/terms">Privacy Policy & Terms</Link>
          </p>
          <div className="footer__social">
            <a href="https://wa.me/8801751156833" aria-label="WhatsApp" target="_blank" rel="noopener noreferrer">
              <svg className="footer__icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 2.2c-5.4 0-9.8 4.2-9.8 9.4 0 2 .6 3.8 1.7 5.4L3 21.8l4.9-1.5c1.4.8 3 .9 4.1.9 5.4 0 9.8-4.2 9.8-9.4-.1-5.2-4.5-9.4-9.8-9.4zm5.6 13.5c-.2.6-1 1.1-1.6 1.2-.4.1-.9.1-1.4-.1-.3-.1-.7-.2-1.2-.5-2.1-1.1-3.4-2.9-3.5-3.1-.1-.2-.8-1.1-.8-2.1s.5-1.5.7-1.7c.2-.2.4-.3.6-.3h.4c.1 0 .3 0 .4.3.2.6.5 1.4.6 1.5.1.1.1.3 0 .4 0 .1-.1.2-.2.4s-.2.2-.3.3c-.1.1-.2.2-.1.4.1.2.5.8 1 1.3.7.6 1.3.8 1.5.9.2.1.3.1.4 0 .1-.1.6-.7.8-.9.2-.2.3-.2.4-.1.1.1 1.1.5 1.3.6.2.1.3.1.4.2.1.2.1.7-.1 1.3z" />
              </svg>
            </a>
            <a href="https://facebook.com" aria-label="Facebook" target="_blank" rel="noopener noreferrer">
              <svg className="footer__icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M13.6 21.9v-7.5h2.5l.4-2.9h-2.9V9.3c0-.8.2-1.3 1.3-1.3h1.6V5.3c-.3 0-1.1-.1-2.1-.1-2.1 0-3.5 1.3-3.5 3.6v2h-2.4v2.9h2.4v7.5h2.7z" />
              </svg>
            </a>
          </div>
        </div>
        
      </div>
      <div className="footer__bottom">
        <span>© {new Date().getFullYear()} Rong Chapa. All rights reserved. Design & Developed by <a href="https://ekon-portfolio.vercel.app/" target="_blank">Ekon</a></span>
      </div>
    </footer>
  );
};
