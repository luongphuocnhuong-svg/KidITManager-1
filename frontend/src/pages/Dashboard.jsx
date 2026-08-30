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
  const [currentTimeStr, setCurrentTimeStr] = useState('');

  const getVietnamTime = () => {
    return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
  };

  const processUpcomingClasses = (allClasses) => {
    const now = getVietnamTime();
    const currentDayIndex = now.getDay();
    const dayMap = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    const currentDayStr = dayMap[currentDayIndex];
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeTotal = currentHour * 60 + currentMinute;

    let upcoming = [];

    allClasses.forEach(cls => {
      if (!cls.schedule) return;
      
      const slots = cls.schedule.split(', ');
      slots.forEach(slot => {
        const match = slot.match(/(.+) \((.+) - (.+)\)/);
        if (match) {
          const day = match[1];
          const startTimeStr = match[2];
          const endTimeStr = match[3];

          // Only consider classes happening TODAY
          if (day === currentDayStr) {
            const [startH, startM] = startTimeStr.split(':').map(Number);
            const [endH, endM] = endTimeStr.split(':').map(Number);
            const startTimeTotal = startH * 60 + startM;
            const endTimeTotal = endH * 60 + endM;

            // Class hasn't ended yet
            if (currentTimeTotal <= endTimeTotal) {
              let status = 'Sắp bắt đầu';
              if (currentTimeTotal >= startTimeTotal && currentTimeTotal <= endTimeTotal) {
                status = 'Đang học';
              }

              upcoming.push({
                ...cls,
                displayStartTime: startTimeStr,
                startTimeTotal,
                status
              });
            }
          }
        }
      });
    });

    // Sort by start time (earliest first)
    upcoming.sort((a, b) => a.startTimeTotal - b.startTimeTotal);
    setUpcomingClasses(upcoming.slice(0, 4));
  };

  useEffect(() => {
    fetch('/api/dashboard/stats')
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(err => console.error(err));
      
    fetch('/api/classes')
      .then(res => res.json())
      .then(data => {
        processUpcomingClasses(data);
      })
      .catch(err => console.error(err));

    // Update time display every minute
    const interval = setInterval(() => {
      const vnTime = getVietnamTime();
      setCurrentTimeStr(`${vnTime.getHours().toString().padStart(2, '0')}:${vnTime.getMinutes().toString().padStart(2, '0')} - ${dayMap[vnTime.getDay()]}`);
    }, 60000);

    const initialTime = getVietnamTime();
    const dayMap = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    setCurrentTimeStr(`${initialTime.getHours().toString().padStart(2, '0')}:${initialTime.getMinutes().toString().padStart(2, '0')} - ${dayMap[initialTime.getDay()]}`);

    return () => clearInterval(interval);
  }, []);

  const statCards = [
    { label: 'Tổng Học sinh', value: stats.totalStudents, icon: Users, color: 'primary', trend: '+12%' },
    { label: 'Lớp Đang Mở', value: stats.totalClasses, icon: GraduationCap, color: 'secondary', trend: '+3' },
    { label: 'Doanh thu', value: new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(stats.revenue), icon: DollarSign, color: 'success', trend: '+8%' },
    { label: 'Tỉ lệ Chuyên cần', value: '96%', icon: TrendingUp, color: 'warning', trend: '+2%' },
  ];

  return (
    <div className="dashboard">
      <div className="page-header flex justify-between items-end">
        <div>
          <h1 className="text-h1">Tổng quan</h1>
          <p className="text-muted mt-2">Chào mừng trở lại! Dưới đây là thông tin về trung tâm hôm nay.</p>
        </div>
        <div className="text-right text-muted font-medium bg-surface-hover px-4 py-2 rounded-md border border-border">
          {currentTimeStr}
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
          <h3 className="text-h3 mb-4">Lớp học sắp diễn ra (Hôm nay)</h3>
          <div className="upcoming-classes">
            {upcomingClasses.length === 0 ? (
              <p className="text-muted text-small p-4 text-center border border-dashed border-border rounded-md">Không có lớp học nào đang hoặc sắp diễn ra trong ngày hôm nay.</p>
            ) : (
              upcomingClasses.map((cls, idx) => {
                return (
                  <div key={cls.id || idx} className="class-item">
                    <div className="class-time text-primary font-bold">{cls.displayStartTime}</div>
                    <div className="class-info">
                      <h4 className="font-semibold">{cls.name}</h4>
                      <p className="text-muted text-sm mt-1">
                        GV: {cls.teacher || 'Chưa xếp'} • Phòng {cls.room || '—'}
                      </p>
                    </div>
                    <div className={`class-status ${cls.status === 'Đang học' ? 'status-active bg-primary text-white px-3 py-1 rounded-full' : 'status-upcoming bg-warning text-white px-3 py-1 rounded-full'}`}>
                      {cls.status}
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
             <div className="activity-item flex items-start gap-3 p-3 hover:bg-surface-hover rounded-md transition-colors">
               <div className="activity-dot bg-success w-3 h-3 rounded-full mt-1.5"></div>
               <div className="activity-info flex-1">
                 <p className="text-sm"><strong>Lê Văn C</strong> đã đóng học phí môn Toán</p>
                 <span className="text-xs text-muted block mt-1">10 phút trước</span>
               </div>
             </div>
             <div className="activity-item flex items-start gap-3 p-3 hover:bg-surface-hover rounded-md transition-colors mt-2">
               <div className="activity-dot bg-primary w-3 h-3 rounded-full mt-1.5"></div>
               <div className="activity-info flex-1">
                 <p className="text-sm"><strong>GV Nguyễn Văn A</strong> đã điểm danh lớp Toán 10</p>
                 <span className="text-xs text-muted block mt-1">30 phút trước</span>
               </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
