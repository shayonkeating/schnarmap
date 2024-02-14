import React, { useState } from 'react';
import './Header.css';


function Header() {
    const [darkMode, setDarkMode] = useState(false);
  
    const handleDarkModeToggle = () => {
      setDarkMode(!darkMode);
      document.body.classList.toggle('dark-mode');
    };

  return (
    <header className="header">
      <div className="header-logo">
        <img src="/logo_nav.png" alt="Logo" />
      </div>
      <nav className="header-nav">
      </nav>
      <div className="theme-switch-wrapper">
        <label className="theme-switch" htmlFor="checkbox">
          <input type="checkbox" id="checkbox" className="checkbox" onChange={handleDarkModeToggle} checked={darkMode} />
          <div className="slider round"></div>
        </label>
      </div>
    </header>
  );
}

export default Header;
