import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, Users, Clock, MapPin } from 'lucide-react';
import { Button } from '../components/ui/Button';
import './Classes.css';

export function Classes() {
  const [classes, setClasses] = useState([]);
  const [teachersList, setTeachersList] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', teacher: '', ta: '', room: '', capacity: '' });
  const [scheduleSlots, setScheduleSlots] = useState([{ day: 'Thứ 2', startTime: '15:15', endTime: '17:15' }]);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(true);

  const TIME_SLOTS = [
    { label: '07:00 - 09:00', start: '07:00', end: '09:00' },
    { label: '09:00 - 11:00', start: '09:00', end: '11:00' },
    { label: '15:15 - 17:15', start: '15:15', end: '17:15' },
    { label: '17:15 - 19:15', start: '17:15', end: '19:15' },
    { label: '19:15 - 21:15', start: '19:15', end: '21:15' }
  ];

  const fetchClasses = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/classes');
      if (response.ok) {
        const data = await response.json();
        setClasses(data);
      }
    } catch (error) {
      console.error('Failed to fetch classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      const response = await fetch('/api/teachers');
      if (response.ok) {
        const data = await response.json();
        setTeachersList(data);
      }
    } catch (error) {
      console.error('Failed to fetch teachers:', error);
    }
  };

  useEffect(() => {
    fetchClasses();
    fetchTeachers();
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Format schedule table into string: "Thứ 2 (15:15 - 17:15), Thứ 4..."
    const scheduleString = scheduleSlots
      .filter(s => s.startTime && s.endTime)
      .map(s => `${s.day} (${s.startTime} - ${s.endTime})`)
      .join(', ');

    try {
      const url = editId ? `/api/classes/${editId}` : '/api/classes';
      const method = editId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, schedule: scheduleString })
      });
      if (response.ok) {
        await fetchClasses();
        closeModal();
      } else {
        const errData = await response.json().catch(() => ({}));
        alert('Lỗi khi lưu lớp học: ' + (errData.error || 'Server Error'));
      }
    } catch (error) {
      console.error('Failed to save class:', error);
      alert('Lỗi kết nối mạng: ' + error.message);
    }
  };

  const openEditModal = (cls) => {
    setFormData({
      name: cls.name,
      teacher: cls.teacher || '',
      ta: cls.ta || '',
      room: cls.room || '',
      capacity: cls.capacity || ''
    });
    
    // Parse schedule string back to slots array
    if (cls.schedule) {
      const parsedSlots = cls.schedule.split(', ').map(str => {
        // Expected format: "Thứ 2 (18:00 - 20:00)"
        const match = str.match(/(.+) \((.+) - (.+)\)/);
        if (match) {
          return { day: match[1], startTime: match[2], endTime: match[3] };
        }
        return { day: 'Thứ 2', startTime: '15:15', endTime: '17:15' };
      });
      setScheduleSlots(parsedSlots.length > 0 ? parsedSlots : [{ day: 'Thứ 2', startTime: '15:15', endTime: '17:15' }]);
    } else {
      setScheduleSlots([{ day: 'Thứ 2', startTime: '15:15', endTime: '17:15' }]);
    }
    
    setEditId(cls.id);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditId(null);
    setFormData({ name: '', teacher: '', ta: '', room: '', capacity: '' });
    setScheduleSlots([{ day: 'Thứ 2', startTime: '15:15', endTime: '17:15' }]);
  };

  const handleScheduleChange = (index, field, value) => {
    const newSlots = [...scheduleSlots];
    newSlots[index][field] = value;
    setScheduleSlots(newSlots);
  };

  const handleTimeSlotChange = (index, value) => {
    const slot = TIME_SLOTS.find(s => `${s.start}-${s.end}` === value);
    if (slot) {
      const newSlots = [...scheduleSlots];
      newSlots[index].startTime = slot.start;
      newSlots[index].endTime = slot.end;
      setScheduleSlots(newSlots);
    }
  };

  const addScheduleSlot = () => {
    setScheduleSlots([...scheduleSlots, { day: 'Thứ 3', startTime: '15:15', endTime: '17:15' }]);
  };

  const removeScheduleSlot = (index) => {
    const newSlots = scheduleSlots.filter((_, i) => i !== index);
    setScheduleSlots(newSlots);
  };

  return (
    <div className="classes-page">
      <div className="page-header flex justify-between items-center">
        <div>
          <h1 className="text-h1">Quản lý Lớp học</h1>
          <p className="text-muted mt-2">Danh sách các lớp học hiện tại và thông tin phân công giáo viên.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus size={18} className="mr-2" />
          Mở Lớp Mới
        </Button>
      </div>

      <div className="classes-actions glass-panel mb-4">
        <div className="search-box">
          <Search size={18} className="text-muted" />
          <input type="text" placeholder="Tìm kiếm lớp học, môn học..." className="table-search-input" />
        </div>
        <div className="filter-actions">
          <select className="form-input" style={{ width: 'auto' }}>
            <option>Tất cả trạng thái</option>
            <option>Đang học</option>
            <option>Sắp mở</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-4">Đang tải dữ liệu...</div>
      ) : classes.length === 0 ? (
        <div className="text-center py-4 glass-panel">Chưa có lớp học nào. Bấm "Mở Lớp Mới" để tạo.</div>
      ) : (
        <div className="classes-grid">
          {classes.map(cls => (
            <div key={cls.id} className="class-card glass-panel">
              <div className="class-card-header bg-primary-light">
                <h3 className="text-h3 text-primary">{cls.name}</h3>
                <span className="status-badge active">Đang hoạt động</span>
              </div>
              <div className="class-card-body">
                <div className="info-row">
                  <Users size={16} className="text-muted" />
                  <span>Giáo viên: <strong>{cls.teacher || 'Chưa phân công'}</strong></span>
                </div>
                {cls.ta && (
                  <div className="info-row">
                    <Users size={16} className="text-muted" />
                    <span>Trợ giảng: <strong>{cls.ta}</strong></span>
                  </div>
                )}
                <div className="info-row">
                  <Clock size={16} className="text-muted" />
                  <span>Lịch học: {cls.schedule || 'Chưa xếp'}</span>
                </div>
                <div className="info-row">
                  <MapPin size={16} className="text-muted" />
                  <span>Phòng học: {cls.room || 'Chưa xếp'}</span>
                </div>
                
                <div className="capacity-bar-container mt-4">
                  <div className="flex justify-between text-small mb-1">
                    <span>Sĩ số</span>
                    <span>{cls.enrolledCount || 0} / {cls.capacity || 20}</span>
                  </div>
                  <div className="capacity-bar">
                    <div className="capacity-fill" style={{ width: `${Math.min(100, ((cls.enrolledCount || 0) / (cls.capacity || 20)) * 100)}%` }}></div>
                  </div>
                </div>
              </div>
              <div className="class-card-footer flex gap-2">
                <Link to={`/classes/${cls.id}`} className="flex-1">
                  <Button variant="secondary" size="sm" className="w-full">Chi tiết</Button>
                </Link>
                <Button variant="secondary" size="sm" onClick={() => openEditModal(cls)}>Sửa</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel animate-fade-in">
            <h2 className="text-h2 mb-4">{editId ? 'Sửa thông tin Lớp học' : 'Mở Lớp Mới'}</h2>
            <form onSubmit={handleSubmit} className="form-layout">
              <div className="form-group">
                <label>Tên Lớp học (*)</label>
                <input required type="text" name="name" value={formData.name} onChange={handleInputChange} className="form-input" placeholder="VD: Toán 10 - Nâng cao" />
              </div>
              
              <div className="grid-2 gap-4">
                <div className="form-group">
                  <label>Giáo viên phụ trách</label>
                  <select name="teacher" value={formData.teacher} onChange={handleInputChange} className="form-input">
                    <option value="">Chọn Giáo viên</option>
                    {teachersList.map(t => (
                      <option key={t.id} value={t.name}>{t.name} ({t.role === 1 ? 'GV' : 'TG'})</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Trợ giảng</label>
                  <select name="ta" value={formData.ta} onChange={handleInputChange} className="form-input">
                    <option value="">Chọn Trợ giảng</option>
                    {teachersList.map(t => (
                      <option key={t.id} value={t.name}>{t.name} ({t.role === 1 ? 'GV' : 'TG'})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Lịch học (Ca học)</label>
                <div className="schedule-table-wrapper">
                  <table className="schedule-table">
                    <thead>
                      <tr>
                        <th>Ngày trong tuần</th>
                        <th>Ca học</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {scheduleSlots.map((slot, index) => (
                        <tr key={index}>
                          <td>
                            <select 
                              className="form-input schedule-input"
                              value={slot.day} 
                              onChange={(e) => handleScheduleChange(index, 'day', e.target.value)}
                            >
                              {['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'].map(d => (
                                <option key={d} value={d}>{d}</option>
                              ))}
                            </select>
                          </td>
                          <td>
                            <select 
                              className="form-input schedule-input"
                              value={`${slot.startTime}-${slot.endTime}`}
                              onChange={(e) => handleTimeSlotChange(index, e.target.value)}
                            >
                              {TIME_SLOTS.map(s => (
                                <option key={s.label} value={`${s.start}-${s.end}`}>{s.label}</option>
                              ))}
                            </select>
                          </td>
                          <td>
                            <button 
                              type="button" 
                              className="action-btn text-danger p-2" 
                              onClick={() => removeScheduleSlot(index)}
                              title="Xóa ca này"
                            >
                              Xóa
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <Button type="button" variant="ghost" size="sm" onClick={addScheduleSlot} className="mt-2 text-primary">
                    + Thêm ca học
                  </Button>
                </div>
              </div>
              
              <div className="grid-2 gap-4">
                <div className="form-group">
                  <label>Phòng học</label>
                  <input type="text" name="room" value={formData.room} onChange={handleInputChange} className="form-input" />
                </div>
                <div className="form-group">
                  <label>Sĩ số tối đa</label>
                  <input type="number" name="capacity" value={formData.capacity} onChange={handleInputChange} className="form-input" />
                </div>
              </div>
              
              <div className="modal-actions mt-6">
                <Button type="button" variant="ghost" onClick={closeModal}>Hủy</Button>
                <Button type="submit" variant="primary">Lưu Lớp học</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
