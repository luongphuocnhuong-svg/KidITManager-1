import React, { useState, useEffect } from 'react';
import './Schedule.css'; // Timetable styles

const DAYS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];
const HOURS = Array.from({ length: 16 }, (_, i) => i + 7); // 7:00 to 22:00

export function Schedule() {
  const [classes, setClasses] = useState([]);
  const [scheduleBlocks, setScheduleBlocks] = useState([]);

  useEffect(() => {
    fetch('/api/classes')
      .then(res => res.json())
      .then(data => {
        setClasses(data);
        parseSchedules(data);
      })
      .catch(err => console.error(err));
  }, []);

  const parseSchedules = (classesData) => {
    const blocks = [];
    
    classesData.forEach((cls, classIndex) => {
      if (!cls.schedule) return;
      
      // Expected format: "Thứ 2 (18:00 - 20:00), Thứ 4 (18:00 - 20:00)"
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
            room: cls.room,
            day: day,
            startTime: startTime,
            endTime: endTime,
            colorIndex: classIndex % 6
          });
        }
      });
    });
    
    setScheduleBlocks(blocks);
  };

  const calculatePosition = (startTime, endTime) => {
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    
    const startOffset = (startH - 7) * 60 + startM;
    const duration = (endH - startH) * 60 + (endM - startM);
    
    // Each hour is 60px height
    return {
      top: `${startOffset}px`,
      height: `${duration}px`
    };
  };

  const colorClasses = ['bg-blue', 'bg-green', 'bg-purple', 'bg-orange', 'bg-pink', 'bg-teal'];

  return (
    <div className="schedule-page">
      <div className="page-header mb-6">
        <h1 className="text-h1">Thời khóa biểu toàn trung tâm</h1>
        <p className="text-muted mt-2">Tổng quan lịch học của tất cả các lớp trong tuần.</p>
      </div>

      <div className="schedule-container glass-panel">
        {/* Header Row */}
        <div className="schedule-header-row">
          <div className="time-col-header">Giờ</div>
          {DAYS.map(day => (
            <div key={day} className="day-col-header">{day}</div>
          ))}
        </div>

        {/* Body */}
        <div className="schedule-body">
          {/* Time Column */}
          <div className="time-column">
            {HOURS.map(hour => (
              <div key={hour} className="time-slot-label">
                <span>{`${hour.toString().padStart(2, '0')}:00`}</span>
              </div>
            ))}
          </div>

          {/* Days Columns */}
          {DAYS.map(day => {
            const dayBlocks = scheduleBlocks.filter(b => b.day === day);
            
            return (
              <div key={day} className="day-column">
                {/* Background grid lines */}
                {HOURS.map(hour => (
                  <div key={hour} className="grid-cell"></div>
                ))}
                
                {/* Class Blocks */}
                {dayBlocks.map(block => {
                  const pos = calculatePosition(block.startTime, block.endTime);
                  return (
                    <div 
                      key={block.id} 
                      className={`class-block ${colorClasses[block.colorIndex]}`}
                      style={{ top: pos.top, height: pos.height }}
                    >
                      <div className="block-title">{block.className}</div>
                      <div className="block-time">{block.startTime} - {block.endTime}</div>
                      <div className="block-detail">P.{block.room || '—'}</div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
