import React from 'react';
import './ScheduleExportTemplate.css';

const DAYS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN'];
const TIME_SLOTS = [
  { time: '07:00-09:00', label: 'Sáng', icon: '☀️', type: 'morning' },
  { time: '09:00-11:00', label: '', icon: '', type: 'morning' },
  { time: '15:15-17:15', label: 'Chiều', icon: '🌙', type: 'night' },
  { time: '17:15-19:15', label: 'Tối', icon: '', type: 'night' },
  { time: '19:15-21:15', label: '', icon: '', type: 'night' }
];

const COLORS = {
  'KID 1': '#00a8e8',
  'KID 2': '#33cc33',
  'KID 3': '#ff9900',
  'KID 5': '#ff6600',
  'KID 7': '#0033cc',
  'KID 9': '#ffcc00',
  'TỰ LUYỆN': '#cc0000'
};

export const ScheduleExportTemplate = React.forwardRef(({ scheduleBlocks, applyDate }, ref) => {
  
  const getCellColor = (className) => {
    // Basic color matching based on class name or default to blue
    for (const [key, color] of Object.entries(COLORS)) {
      if (className.toUpperCase().includes(key)) {
        return color;
      }
    }
    return '#0055ff'; // default blue
  };

  return (
    <div className="export-template-wrapper">
      <div className="export-container" ref={ref}>
        
        {/* Header Section */}
        <div className="export-header">
          <img src="/logo.png" alt="Logo" className="export-logo" />
          <div className="export-title-container">
            <h1 className="export-title">LỊCH HỌC</h1>
            <div className="export-date-pill">
              Áp dụng từ ngày {applyDate || new Date().toLocaleDateString('vi-VN')}
            </div>
          </div>
          <div className="export-logo" style={{ opacity: 0 }}>
            {/* Invisible placeholder for symmetry */}
          </div>
        </div>

        {/* Table Section */}
        <div className="export-table-container">
          <table className="export-table">
            <thead>
              <tr>
                <th>THỜI GIAN</th>
                {DAYS.map(day => <th key={day}>{day.toUpperCase()}</th>)}
              </tr>
            </thead>
            <tbody>
              {TIME_SLOTS.map((slot, index) => (
                <tr key={slot.time}>
                  <td>
                    <div className="export-time-col">
                      {slot.label && (
                        <span className={`time-label ${slot.type === 'night' ? 'night' : ''}`}>
                          {slot.icon} {slot.label}
                        </span>
                      )}
                      <span>{slot.time.replace(':', 'h').replace(':', 'h')}</span>
                    </div>
                  </td>
                  
                  {DAYS.map((day) => {
                    // Match the day string. Note: Our app uses "Chủ nhật", the template uses "CN"
                    const appDay = day === 'CN' ? 'Chủ nhật' : day;
                    
                    const block = scheduleBlocks.find(b => b.day === appDay && b.timeKey === slot.time);
                    
                    if (block) {
                      return (
                        <td key={`${day}-${slot.time}`} style={{ backgroundColor: getCellColor(block.className) }}>
                          <div className="export-cell">
                            {block.className}
                          </div>
                        </td>
                      );
                    }
                    return <td key={`${day}-${slot.time}`}></td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer Section */}
        <div className="export-footer">
          <div className="export-notes">
            <div className="export-notes-title">
              ⭐ GHI CHÚ:
            </div>
            <ul>
              <li>Tự luyện: Học viên ưu tiên theo nhóm lớp.</li>
              <li>Lịch học có thể thay đổi khi cần thiết.</li>
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
});
