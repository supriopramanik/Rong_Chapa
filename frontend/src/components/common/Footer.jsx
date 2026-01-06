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
          <p>House 12, Road 7, Dhanmondi, Dhaka</p>
          <p>Phone: +880 1234-567890</p>
        </div>
        <div>
          <h5>Hours</h5>
          <p>Sat - Thu: 9:00 AM - 9:00 PM</p>
          <p>Friday: 3:00 PM - 9:00 PM</p>
        </div>
      </div>
      <div className="footer__bottom">
        <span>© {new Date().getFullYear()} Rong Chapa. All rights reserved.</span>
      </div>
    </footer>
  );
};
