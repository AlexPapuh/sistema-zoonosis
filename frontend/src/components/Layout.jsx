import React, { useState } from 'react';
import Sidebar from './Sidebar';

const Layout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />


      <div 
        className={`flex-1 transition-[margin-left] duration-300 ease-in-out p-6 md:p-8 will-change-[margin-left]
        ${isSidebarOpen ? 'ml-64' : 'ml-20'}`}
      >
        {children}
      </div>
      
    </div>
  );
};

export default Layout;