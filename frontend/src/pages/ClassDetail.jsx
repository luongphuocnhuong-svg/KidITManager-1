import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Users, UserPlus, CheckCircle, XCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import { Button } from '../components/ui/Button';
import './ClassDetail.css';

export function ClassDetail() {
  const { id } = useParams();
  const [classInfo, setClassInfo] = useState(null);
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [teachersList, setTeachersList] = useState([]);
  
  const [attendance, setAttendance] = useState({});
  const [teacherAttendance, setTeacherAttendance] = useState({});
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');

  const [activeOverride, setActiveOverride] = useState(null); // 'teacher' or 'ta'

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

  const fetchTeachers = async () => {
    try {
      const res = await fetch('/api/teachers');
      if (res.ok) setTeachersList(await res.json());
    } catch (error) {
      console.error('Failed to fetch teachers:', error);
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

      const tRes = await fetch(`/api/classes/${id}/teacher-attendance?date=${attendanceDate}`);
      if (tRes.ok) {
        const tData = await tRes.json();
        const tAttMap = {};
        tData.forEach(item => { 
          tAttMap[item.role] = { status: item.status, name: item.teacher_name }; 
        });
        setTeacherAttendance(tAttMap);
      }
    } catch (error) {
      console.error('Failed to fetch attendance:', error);
    }
  };

  useEffect(() => {
    fetchData();
    fetchTeachers();
  }, [id]);

  useEffect(() => {
    fetchAttendance();
    setActiveOverride(null); // Reset override state when date changes
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

  const handleTeacherAttendance = async (teacherName, role, status) => {
    try {
      const res = await fetch(`/api/classes/${id}/teacher-attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: attendanceDate, teacher_name: teacherName, role, status })
      });
      if (res.ok) {
        setTeacherAttendance({ 
          ...teacherAttendance, 
          [role]: { status, name: teacherName } 
        });
        setActiveOverride(null);
      }
    } catch (error) {
      console.error('Failed to mark teacher attendance:', error);
    }
  };

  if (!classInfo) return <div className="p-4">Đang tải...</div>;

  const half = Math.ceil(enrolledStudents.length / 2);
  const leftColumn = enrolledStudents.slice(0, half);
  const rightColumn = enrolledStudents.slice(half);

  const getTeacherDisplayInfo = (role, defaultName) => {
    // Nếu có dữ liệu điểm danh trên máy chủ thì lấy tên đó (chính xác người dạy thay)
    if (teacherAttendance[role]?.name) return teacherAttendance[role].name;
    // Ngược lại lấy tên giáo viên mặc định của lớp
    return defaultName;
  };

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
          <p className="text-muted mt-2">
            Giáo viên: {classInfo.teacher} 
            {classInfo.ta && ` • Trợ giảng: ${classInfo.ta}`} 
            <br/>
            Phòng: {classInfo.room}
          </p>
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

          <div className="seating-chart">
            <div className="teacher-attendance-area">
              <div className="teacher-desk-title">Khu vực Bàn Giáo Viên</div>
              <div className="teacher-desks">
                {classInfo.teacher && (
                  <TeacherDesk 
                    role="teacher"
                    label="Giáo viên"
                    currentName={getTeacherDisplayInfo('teacher', classInfo.teacher)}
                    status={teacherAttendance['teacher']?.status}
                    isOverrideActive={activeOverride === 'teacher'}
                    teachersList={teachersList.filter(t => t.role === 1)}
                    onMark={(name, status) => handleTeacherAttendance(name, 'teacher', status)}
                    onToggleOverride={() => setActiveOverride(activeOverride === 'teacher' ? null : 'teacher')}
                  />
                )}
                
                {classInfo.ta && (
                  <TeacherDesk 
                    role="ta"
                    label="Trợ giảng"
                    currentName={getTeacherDisplayInfo('ta', classInfo.ta)}
                    status={teacherAttendance['ta']?.status}
                    isOverrideActive={activeOverride === 'ta'}
                    teachersList={teachersList.filter(t => t.role === 2 || t.role === 1)}
                    onMark={(name, status) => handleTeacherAttendance(name, 'ta', status)}
                    onToggleOverride={() => setActiveOverride(activeOverride === 'ta' ? null : 'ta')}
                  />
                )}

                {!classInfo.teacher && !classInfo.ta && (
                  <div className="text-muted text-sm text-center w-full">Chưa phân công giáo viên</div>
                )}
              </div>
            </div>
            
            {enrolledStudents.length === 0 ? (
              <p className="text-center text-muted mt-6">Chưa có học sinh trong lớp này.</p>
            ) : (
              <div className="classroom-grid mt-6">
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
            )}
          </div>
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

function TeacherDesk({ role, label, currentName, status, isOverrideActive, teachersList, onMark, onToggleOverride }) {
  const isPresent = status === 'present';
  const isAbsent = status === 'absent';
  
  const [selectedName, setSelectedName] = useState(currentName);

  // Sync internal selected name when currentName changes (from props)
  useEffect(() => {
    setSelectedName(currentName);
  }, [currentName]);

  return (
    <div className={`desk-wrapper ${isPresent ? 'border-success' : isAbsent ? 'border-danger' : ''}`}>
      <div className="flex justify-between items-center px-1">
        <span className="text-xs text-muted font-medium">{label}</span>
        <button 
          className="text-primary hover:text-primary-dark" 
          onClick={onToggleOverride}
          title="Dạy thay"
        >
          <RefreshCw size={14} />
        </button>
      </div>
      
      {isOverrideActive ? (
        <select 
          className="form-input text-sm p-1"
          value={selectedName}
          onChange={(e) => setSelectedName(e.target.value)}
        >
          <option value={currentName}>{currentName}</option>
          {teachersList.filter(t => t.name !== currentName).map(t => (
            <option key={t.id} value={t.name}>{t.name}</option>
          ))}
        </select>
      ) : (
        <div className="desk-name" title={currentName}>{currentName}</div>
      )}

      <div className="desk-actions">
        <button 
          className={`desk-btn ${isPresent ? 'bg-success text-white' : 'text-success'}`}
          onClick={() => onMark(selectedName, 'present')}
          title="Có mặt"
        >
          <CheckCircle size={16} />
        </button>
        <button 
          className={`desk-btn ${isAbsent ? 'bg-danger text-white' : 'text-danger'}`}
          onClick={() => onMark(selectedName, 'absent')}
          title="Vắng mặt"
        >
          <XCircle size={16} />
        </button>
      </div>
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
