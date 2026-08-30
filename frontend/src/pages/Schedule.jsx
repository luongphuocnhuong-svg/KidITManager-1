import React, { useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';
import { Download } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { ScheduleExportTemplate } from './ScheduleExportTemplate';
import './Schedule.css'; // Timetable styles

const DAYS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];
const TIME_SLOTS = [
  '07:00-09:00',
  '09:00-11:00',
  '15:15-17:15',
  '17:15-19:15',
  '19:15-21:15'
];

export function Schedule() {
  const [scheduleBlocks, setScheduleBlocks] = useState([]);
  const exportRef = useRef(null);

  useEffect(() => {
    fetch('/api/classes')
      .then(res => res.json())
      .then(data => {
        parseSchedules(data);
      })
      .catch(err => console.error(err));
  }, []);

  const parseSchedules = (classesData) => {
    const blocks = [];
    
    classesData.forEach((cls, classIndex) => {
      if (!cls.schedule) return;
      
      const slots = cls.schedule.split(', ');
      
      slots.forEach(slot => {
        const match = slot.match(/(.+) \((.+) - (.+)\)/);
        if (match) {
          const day = match[1];
          const startTime = match[2];
          const endTime = match[3];
          
          blocks.push({
            id: `${cls.id}-${day}-${startTime}`,
            classId: cls.id,
            className: cls.name,
            teacher: cls.teacher,
            ta: cls.ta,
            room: cls.room,
            day: day,
            timeKey: `${startTime}-${endTime}`,
            colorIndex: classIndex % 6
          });
        }
      });
    });
    
    setScheduleBlocks(blocks);
  };

  const colorClasses = ['bg-blue', 'bg-green', 'bg-purple', 'bg-orange', 'bg-pink', 'bg-teal'];

  const handleExport = async () => {
    if (exportRef.current) {
      try {
        const canvas = await html2canvas(exportRef.current, {
          scale: 2, // High resolution for better quality
          useCORS: true,
          backgroundColor: null,
        });
        const image = canvas.toDataURL('image/png', 1.0);
        const link = document.createElement('a');
        link.download = `Lich_Hoc_${new Date().toLocaleDateString('vi-VN').replace(/\//g, '-')}.png`;
        link.href = image;
        link.click();
      } catch (err) {
        console.error('Lỗi khi xuất ảnh:', err);
        alert('Không thể xuất ảnh, vui lòng thử lại.');
      }
    }
  };

  return (
    <div className="schedule-page">
      <div className="page-header mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-h1">Thời khóa biểu toàn trung tâm</h1>
          <p className="text-muted mt-2">Tổng quan lịch học của tất cả các lớp trong tuần.</p>
        </div>
        <Button onClick={handleExport} variant="primary">
          <Download size={18} className="mr-2" />
          Xuất ảnh
        </Button>
      </div>

      <div className="schedule-container glass-panel p-4">
        <div className="schedule-fixed-grid">
          {/* Header Row */}
          <div className="grid-header-cell time-header">Giờ / Ngày</div>
          {DAYS.map(day => (
            <div key={day} className="grid-header-cell day-header">{day}</div>
          ))}

          {/* Time Slots Rows */}
          {TIME_SLOTS.map((slot) => (
            <React.Fragment key={slot}>
              {/* Time Label Cell */}
              <div className="grid-time-cell">
                <span>{slot.replace('-', ' - ')}</span>
              </div>
              
              {/* Day Cells for this Time Slot */}
              {DAYS.map((day) => {
                // Find blocks that fall into this exact time slot and day
                const dayBlocks = scheduleBlocks.filter(b => b.day === day && b.timeKey === slot);
                
                return (
                  <div key={`${day}-${slot}`} className="grid-body-cell">
                    {dayBlocks.map(block => (
                      <div 
                        key={block.id} 
                        className={`class-block ${colorClasses[block.colorIndex]}`}
                      >
                        <div className="block-title">{block.className}</div>
                        <div className="block-teacher text-small">
                          {block.teacher || 'Chưa PC'}
                          {block.ta && ` / TG: ${block.ta}`}
                        </div>
                        <div className="block-detail text-small">P.{block.room || '—'}</div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
      
      <ScheduleExportTemplate ref={exportRef} scheduleBlocks={scheduleBlocks} applyDate="" />
    </div>
  );
}
