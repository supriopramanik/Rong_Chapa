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
      </div>
      <div className="footer__bottom">
        <span>© {new Date().getFullYear()} Rong Chapa. All rights reserved. Design & Developed by <a href="https://ekon-portfolio.vercel.app/" target="_blank">Ekon</a></span>
      </div>
    </footer>
  );
};
