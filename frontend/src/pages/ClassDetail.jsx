import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Users, UserPlus, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/Button';
import './ClassDetail.css';

export function ClassDetail() {
  const { id } = useParams();
  const [classInfo, setClassInfo] = useState(null);
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');

  const fetchData = async () => {
    try {
      const classRes = await fetch(`/api/classes/${id}`);
      if (classRes.ok) setClassInfo(await classRes.json());

      const enrolledRes = await fetch(`/api/classes/${id}/students`);
      if (enrolledRes.ok) setEnrolledStudents(await enrolledRes.json());

      const allRes = await fetch(`/api/students`);
      if (allRes.ok) setAllStudents(await allRes.json());
    } catch (error) {
      console.error('Failed to fetch class details:', error);
    }
  };

  const fetchAttendance = async () => {
    try {
      const res = await fetch(`/api/classes/${id}/attendance?date=${attendanceDate}`);
      if (res.ok) {
        const data = await res.json();
        const attMap = {};
        data.forEach(item => { attMap[item.student_id] = item.status; });
        setAttendance(attMap);
      }
    } catch (error) {
      console.error('Failed to fetch attendance:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  useEffect(() => {
    fetchAttendance();
  }, [id, attendanceDate]);

  const handleEnroll = async (e) => {
    e.preventDefault();
    if (!selectedStudentId) return;
    try {
      const res = await fetch(`/api/classes/${id}/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: selectedStudentId })
      });
      if (res.ok) {
        await fetchData();
        setIsEnrollModalOpen(false);
      }
    } catch (error) {
      console.error('Failed to enroll:', error);
    }
  };

  const handleAttendance = async (studentId, status) => {
    try {
      const res = await fetch(`/api/classes/${id}/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: attendanceDate, student_id: studentId, status })
      });
      if (res.ok) {
        setAttendance({ ...attendance, [studentId]: status });
      }
    } catch (error) {
      console.error('Failed to mark attendance:', error);
    }
  };

  if (!classInfo) return <div className="p-4">Đang tải...</div>;

  // Split students into 2 columns for seating chart
  const half = Math.ceil(enrolledStudents.length / 2);
  const leftColumn = enrolledStudents.slice(0, half);
  const rightColumn = enrolledStudents.slice(half);

  return (
    <div className="class-detail-page">
      <div className="mb-4">
        <Link to="/classes" className="back-link flex items-center text-primary">
          <ArrowLeft size={16} className="mr-2" /> Quay lại danh sách lớp
        </Link>
      </div>

      <div className="page-header flex justify-between items-start">
        <div>
          <h1 className="text-h1">{classInfo.name}</h1>
          <p className="text-muted mt-2">Giáo viên: {classInfo.teacher} • Phòng: {classInfo.room}</p>
        </div>
        <Button onClick={() => setIsEnrollModalOpen(true)}>
          <UserPlus size={18} className="mr-2" />
          Thêm Học sinh
        </Button>
      </div>

      <div className="grid-2 gap-6 mt-6">
        {/* Attendance Seating Chart */}
        <div className="glass-panel p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-h2 flex items-center">
              <Users size={20} className="mr-2 text-primary" /> Sơ đồ Điểm danh
            </h2>
            <input 
              type="date" 
              className="form-input" 
              value={attendanceDate}
              onChange={(e) => setAttendanceDate(e.target.value)}
            />
          </div>

          {enrolledStudents.length === 0 ? (
            <p className="text-center text-muted">Chưa có học sinh trong lớp này.</p>
          ) : (
            <div className="seating-chart">
              <div className="teacher-desk">Bàn Giáo Viên</div>
              <div className="classroom-grid">
                <div className="seating-column">
                  {leftColumn.map(student => (
                    <SeatingDesk 
                      key={student.id} 
                      student={student} 
                      status={attendance[student.id]} 
                      onMark={(status) => handleAttendance(student.id, status)} 
                    />
                  ))}
                </div>
                <div className="aisle">Lối đi</div>
                <div className="seating-column">
                  {rightColumn.map(student => (
                    <SeatingDesk 
                      key={student.id} 
                      student={student} 
                      status={attendance[student.id]} 
                      onMark={(status) => handleAttendance(student.id, status)} 
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Student List */}
        <div className="glass-panel p-6">
          <h2 className="text-h2 mb-4">Danh sách Học sinh ({enrolledStudents.length}/{classInfo.capacity})</h2>
          <div className="enrolled-list">
            {enrolledStudents.map(student => (
              <div key={student.id} className="enrolled-item">
                <div className="user-avatar-sm">{student.name.charAt(0)}</div>
                <div className="enrolled-info">
                  <p className="font-medium">{student.name}</p>
                  <p className="text-small">{student.phone || 'Chưa cập nhật SĐT'}</p>
                </div>
              </div>
            ))}
            {enrolledStudents.length === 0 && <p className="text-muted text-sm">Chưa có học sinh.</p>}
          </div>
        </div>
      </div>

      {/* Enroll Modal */}
      {isEnrollModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel animate-fade-in">
            <h2 className="text-h2 mb-4">Thêm học sinh vào lớp</h2>
            <form onSubmit={handleEnroll} className="form-layout">
              <div className="form-group">
                <label>Chọn Học sinh</label>
                <select 
                  className="form-input" 
                  value={selectedStudentId} 
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  required
                >
                  <option value="">-- Chọn học sinh --</option>
                  {allStudents.filter(s => !enrolledStudents.some(es => es.id === s.id)).map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.phone})</option>
                  ))}
                </select>
              </div>
              <div className="modal-actions mt-6">
                <Button type="button" variant="ghost" onClick={() => setIsEnrollModalOpen(false)}>Hủy</Button>
                <Button type="submit" variant="primary">Thêm vào lớp</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function SeatingDesk({ student, status, onMark }) {
  const isPresent = status === 'present';
  const isAbsent = status === 'absent';
  
  return (
    <div className={`desk-wrapper ${isPresent ? 'border-success' : isAbsent ? 'border-danger' : ''}`}>
      <div className="desk-name">{student.name}</div>
      <div className="desk-actions">
        <button 
          className={`desk-btn ${isPresent ? 'bg-success text-white' : 'text-success'}`}
          onClick={() => onMark('present')}
          title="Có mặt"
        >
          <CheckCircle size={16} />
        </button>
        <button 
          className={`desk-btn ${isAbsent ? 'bg-danger text-white' : 'text-danger'}`}
          onClick={() => onMark('absent')}
          title="Vắng mặt"
        >
          <XCircle size={16} />
        </button>
      </div>
    </div>
  );
}
