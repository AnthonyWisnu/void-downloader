function Footer() {
  return (
    <footer className="footer bg-black" aria-label="Informasi Footer">
      <div className="section-inner footer-inner">
        <div className="footer-top">
          <div className="footer-brand">
            <span className="footer-logo">VOID</span>
            <p className="footer-tagline mono">HIGH-PERFORMANCE MEDIA EXTRACTION UTILITY</p>
          </div>

          <div className="footer-security-note mono">
            <span className="footer-security-badge">[SECURITY ARCHITECTURE]</span>
            <p className="footer-security-text">
              COOKIES AND EXTRACTION CREDENTIALS REMAIN SERVER-SIDE.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
