// src/Footer.jsx
import React from 'react';

const Footer = ({ setCurrentPage }) => {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-12 py-8">
      <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-500">
        <div>© {year} 极速导航网 · 由 第一象限 制作</div>
        <div className="mt-2">
          <button className="mr-4 hover:text-blue-600" onClick={() => setCurrentPage('about')}>关于</button>
          <button className="hover:text-blue-600" onClick={() => setCurrentPage('disclaimer')}>免责声明</button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

