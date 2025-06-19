import React, { ReactNode } from 'react';
import Header from './Header'; // Assuming a Header component
import SidebarTreeMenu from './SidebarTreeMenu';
import Breadcrumbs from './Breadcrumbs'; // Import Breadcrumbs

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* Sidebar: Fixed width, scrollable if content exceeds height */}
      <div className="w-64 md:w-72 bg-white dark:bg-gray-800 shadow-md overflow-y-auto">
        <SidebarTreeMenu />
      </div>

      {/* Main Content Area: Flexible width, contains Header and scrollable main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header /> {/* Optional: if you have a global header, ensure it doesn't overflow badly */}

        {/* Scrollable Main Content (below Header) */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto">
          <Breadcrumbs /> {/* Breadcrumbs typically appear above the main page content */}
          <div className="p-4 md:p-6"> {/* Padding for the actual page content rendered by {children} */}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;

