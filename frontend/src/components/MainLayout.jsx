import React, { useState } from 'react';
import Sidebar from './Sidebar.jsx';

const MainLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      
      <main className="flex-1 overflow-y-auto transition-all duration-300">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default MainLayout;