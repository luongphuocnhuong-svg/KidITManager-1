import React, { useState, useEffect } from 'react';
import { Search, Plus, UserCheck, UserPlus, Phone, Edit, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import './Teachers.css';

export function Teachers() {
  const [teachers, setTeachers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', role: '1', phone: '' });
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/teachers');
      if (response.ok) {
        const data = await response.json();
        setTeachers(data);
      }
    } catch (error) {
      console.error('Failed to fetch teachers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editId ? `/api/teachers/${editId}` : '/api/teachers';
      const method = editId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, role: parseInt(formData.role) })
      });
      if (response.ok) {
        await fetchTeachers();
        closeModal();
      } else {
        const errData = await response.json().catch(() => ({}));
        alert('Lỗi khi lưu giáo viên: ' + (errData.error || 'Server Error'));
      }
    } catch (error) {
      console.error('Failed to save teacher:', error);
      alert('Lỗi kết nối mạng: ' + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa nhân sự này?')) return;
    try {
      const response = await fetch(`/api/teachers/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        await fetchTeachers();
      }
    } catch (error) {
      console.error('Failed to delete teacher:', error);
    }
  };

  const openEditModal = (teacher) => {
    setFormData({
      name: teacher.name,
      role: teacher.role.toString(),
      phone: teacher.phone || ''
    });
    setEditId(teacher.id);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditId(null);
    setFormData({ name: '', role: '1', phone: '' });
  };

  const filteredTeachers = teachers.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (t.phone && t.phone.includes(searchTerm))
  );

  return (
    <div className="teachers-page">
      <div className="page-header flex justify-between items-center">
        <div>
          <h1 className="text-h1">Quản lý Giáo viên & Trợ giảng</h1>
          <p className="text-muted mt-2">Danh sách nhân sự giảng dạy tại trung tâm.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus size={18} className="mr-2" />
          Thêm Nhân Sự
        </Button>
      </div>

      <div className="teachers-actions glass-panel mb-4">
        <div className="search-box">
          <Search size={18} className="text-muted" />
          <input 
            type="text" 
            placeholder="Tìm kiếm theo tên, số điện thoại..." 
            className="table-search-input"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-4">Đang tải dữ liệu...</div>
      ) : filteredTeachers.length === 0 ? (
        <div className="text-center py-4 glass-panel">Chưa có nhân sự nào. Bấm "Thêm Nhân Sự" để tạo.</div>
      ) : (
        <div className="teachers-grid">
          {filteredTeachers.map(teacher => (
            <div key={teacher.id} className="teacher-card glass-panel">
              <div className="teacher-header flex justify-between items-start">
                <div className="teacher-avatar">
                  {teacher.role === 1 ? <UserCheck size={24} /> : <UserPlus size={24} />}
                </div>
                <div className="teacher-actions">
                  <button onClick={() => openEditModal(teacher)} className="action-icon text-muted mr-2 hover:text-primary"><Edit size={16} /></button>
                  <button onClick={() => handleDelete(teacher.id)} className="action-icon text-danger hover:text-danger"><Trash2 size={16} /></button>
                </div>
              </div>
              
              <div className="teacher-info mt-3">
                <h3 className="text-h3">{teacher.name}</h3>
                <span className={`role-badge role-${teacher.role}`}>
                  {teacher.role === 1 ? 'Giáo viên' : 'Trợ giảng'}
                </span>
                
                <div className="contact-info mt-4">
                  <div className="info-row">
                    <Phone size={16} className="text-muted" />
                    <span>{teacher.phone || 'Chưa cập nhật'}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel animate-fade-in">
            <h2 className="text-h2 mb-4">{editId ? 'Sửa thông tin Nhân sự' : 'Thêm Nhân sự mới'}</h2>
            <form onSubmit={handleSubmit} className="form-layout">
              <div className="form-group">
                <label>Họ và Tên (*)</label>
                <input required type="text" name="name" value={formData.name} onChange={handleInputChange} className="form-input" placeholder="Nguyễn Văn A" />
              </div>
              
              <div className="form-group">
                <label>Chức vụ (*)</label>
                <select name="role" value={formData.role} onChange={handleInputChange} className="form-input">
                  <option value="1">Giáo viên</option>
                  <option value="2">Trợ giảng</option>
                </select>
              </div>

              <div className="form-group">
                <label>Số điện thoại</label>
                <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} className="form-input" placeholder="09xxxxxxx" />
              </div>
              
              <div className="modal-actions mt-6">
                <Button type="button" variant="ghost" onClick={closeModal}>Hủy</Button>
                <Button type="submit" variant="primary">Lưu thông tin</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
