/*CLINICAL CORE PORTAL USER INTERACTION INTERFACE CONTROLLER*/
document.addEventListener('DOMContentLoaded', () => {

  const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px"
  };

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
      } else {
        entry.target.classList.remove('active');
      }
    });
  }, observerOptions);

  const revealSections = document.querySelectorAll('.reveal-left, .reveal-right');

  if (revealSections.length > 0) {
    revealSections.forEach(section => {
      revealObserver.observe(section);
    });
  }

  const navbar = document.querySelector('.navbar');
  let isScrolled = false;

  if (navbar) {
    window.addEventListener('scroll', () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > 50) {
        if (!isScrolled) {
          navbar.classList.add('scrolled');
          isScrolled = true;
        }
      } else {
        if (isScrolled) {
          navbar.classList.remove('scrolled');
          isScrolled = false;
        }
      }
    }, { passive: true });
  }
});