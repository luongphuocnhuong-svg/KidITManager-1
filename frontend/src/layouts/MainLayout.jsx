import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  BookOpen, 
  CreditCard,
  Settings,
  LogOut,
  Calendar
} from 'lucide-react';
import './MainLayout.css';

export function MainLayout() {
  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/schedule', icon: Calendar, label: 'Thời khóa biểu' },
    { path: '/students', icon: Users, label: 'Học sinh' },
    { path: '/classes', icon: GraduationCap, label: 'Lớp học' },
    { path: '/courses', icon: BookOpen, label: 'Khóa học' },
    { path: '/finance', icon: CreditCard, label: 'Học phí' },
  ];

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo-icon">KI</div>
          <h2 className="logo-text">KidIT Manager</h2>
        </div>
        
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink 
              key={item.path} 
              to={item.path} 
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="nav-item">
            <Settings size={20} />
            <span>Cài đặt</span>
          </button>
          <button className="nav-item text-danger" style={{ color: 'var(--color-danger)' }}>
            <LogOut size={20} />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="top-header glass-panel">
          <div className="header-search">
            <input type="text" placeholder="Tìm kiếm học sinh, lớp học..." className="search-input" />
          </div>
          <div className="header-user">
            <div className="user-avatar">A</div>
            <div className="user-info">
              <p className="user-name">Admin</p>
              <p className="user-role">Quản lý</p>
            </div>
          </div>
        </header>

        <div className="page-wrapper animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
