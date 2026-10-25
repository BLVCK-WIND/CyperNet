import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { StaffSidebar } from './StaffSidebar';
import { StaffTopBar } from './StaffTopBar';
import { PageTransition } from '@/components/animations/PageTransition';

export const StaffLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);

  const handleToggleCollapse = () => {
    setCollapsed((prev) => !prev);
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-midnight text-sand">
      {/* 1. Sidebar bên trái */}
      <StaffSidebar
        collapsed={collapsed}
        onToggleCollapse={handleToggleCollapse}
      />

      {/* 2. Khung nội dung chính bên phải */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* TopBar */}
        <StaffTopBar
          collapsed={collapsed}
          onToggleCollapse={handleToggleCollapse}
        />

        {/* Nội dung trang thay đổi theo Router Outlet */}
        <main className="flex-1 p-6 overflow-y-auto bg-midnight/50">
          <PageTransition>
            <Outlet />
          </PageTransition>
        </main>
      </div>
    </div>
  );
};
