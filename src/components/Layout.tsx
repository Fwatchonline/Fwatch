import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';
import { Footer } from './Footer';
import { PlansModal } from './PlansModal';
import { useUI } from '../context/UIContext';

export function Layout() {
  const { sidebarCollapsed } = useUI();

  return (
    <div className="min-h-screen bg-[#0E0F12] text-neutral-100 flex flex-col antialiased">
      {/* Fixed Left Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 min-w-0 ${
          sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        <TopNav />
        <main className="flex-1 w-full max-w-[1600px] mx-auto px-4 sm:px-8 py-6">
          <Outlet />
        </main>
        <Footer />
      </div>

      {/* Global VIP Plans Modal */}
      <PlansModal />
    </div>
  );
}
