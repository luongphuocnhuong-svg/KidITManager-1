import React, { useState, useEffect } from 'react';
import { Users, GraduationCap, DollarSign, TrendingUp } from 'lucide-react';
import './Dashboard.css';

export function Dashboard() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalClasses: 0,
    revenue: 0
  });
  const [upcomingClasses, setUpcomingClasses] = useState([]);

  useEffect(() => {
    fetch('/api/dashboard/stats')
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(err => console.error(err));
      
    fetch('/api/classes')
      .then(res => res.json())
      .then(data => {
        // Just take the first 4 classes for demonstration
        setUpcomingClasses(data.slice(0, 4));
      })
      .catch(err => console.error(err));
  }, []);

  const statCards = [
    { label: 'Tổng Học sinh', value: stats.totalStudents, icon: Users, color: 'primary', trend: '+12%' },
    { label: 'Lớp Đang Mở', value: stats.totalClasses, icon: GraduationCap, color: 'secondary', trend: '+3' },
    { label: 'Doanh thu', value: new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(stats.revenue), icon: DollarSign, color: 'success', trend: '+8%' },
    { label: 'Tỉ lệ Chuyên cần', value: '96%', icon: TrendingUp, color: 'warning', trend: '+2%' },
  ];

  return (
    <div className="dashboard">
      <div className="page-header">
        <div>
          <h1 className="text-h1">Tổng quan</h1>
          <p className="text-muted mt-2">Chào mừng trở lại! Dưới đây là thông tin về trung tâm hôm nay.</p>
        </div>
      </div>

      <div className="stats-grid">
        {statCards.map((stat, idx) => (
          <div key={idx} className="stat-card glass-panel">
            <div className={`stat-icon-wrapper bg-${stat.color}-light`}>
              <stat.icon className={`text-${stat.color}`} size={24} />
            </div>
            <div className="stat-info">
              <p className="stat-label text-muted">{stat.label}</p>
              <h3 className="stat-value text-h2">{stat.value}</h3>
            </div>
            <div className="stat-trend">
              <span className="trend-badge positive">{stat.trend}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-content grid-2">
        <div className="dashboard-card glass-panel">
          <h3 className="text-h3 mb-4">Lớp học sắp diễn ra</h3>
          <div className="upcoming-classes">
            {upcomingClasses.length === 0 ? (
              <p className="text-muted text-small">Không có lớp học nào sắp diễn ra.</p>
            ) : (
              upcomingClasses.map((cls, idx) => {
                // Extract first start time if possible (e.g., from "Thứ 2 (18:00 - 20:00)")
                const match = cls.schedule ? cls.schedule.match(/\(([^ -]+)/) : null;
                const startTime = match ? match[1] : '--:--';
                
                return (
                  <div key={cls.id || idx} className="class-item">
                    <div className="class-time">{startTime}</div>
                    <div className="class-info">
                      <h4>{cls.name}</h4>
                      <p>GV: {cls.teacher || 'Chưa xếp'} • Phòng {cls.room || '—'}</p>
                    </div>
                    <div className={`class-status ${idx % 2 === 0 ? 'status-active' : 'status-upcoming'}`}>
                      {idx % 2 === 0 ? 'Đang học' : 'Sắp bắt đầu'}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
        
        <div className="dashboard-card glass-panel">
          <h3 className="text-h3 mb-4">Hoạt động gần đây</h3>
          <div className="recent-activities">
             <div className="activity-item">
               <div className="activity-dot bg-success"></div>
               <div className="activity-info">
                 <p><strong>Lê Văn C</strong> đã đóng học phí môn Toán</p>
                 <span className="text-small">10 phút trước</span>
               </div>
             </div>
             <div className="activity-item">
               <div className="activity-dot bg-primary"></div>
               <div className="activity-info">
                 <p><strong>GV Nguyễn Văn A</strong> đã điểm danh lớp Toán 10</p>
                 <span className="text-small">30 phút trước</span>
               </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
