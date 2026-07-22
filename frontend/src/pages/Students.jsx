import React, { useState, useEffect } from 'react';
import { Search, Plus, MoreVertical, Edit2, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import './Students.css';

export function Students() {
  const [students, setStudents] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '', parentName: '', parentPhone: '' });
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/students');
      if (response.ok) {
        const data = await response.json();
        setStudents(data);
      }
    } catch (error) {
      console.error('Failed to fetch students:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editId ? `/api/students/${editId}` : '/api/students';
      const method = editId ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        await fetchStudents();
        closeModal();
      }
    } catch (error) {
      console.error('Failed to save student:', error);
    }
  };

  const openEditModal = (student) => {
    setFormData({
      name: student.name,
      phone: student.phone || '',
      parentName: student.parentName || '',
      parentPhone: student.parentPhone || ''
    });
    setEditId(student.id);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditId(null);
    setFormData({ name: '', phone: '', parentName: '', parentPhone: '' });
  };

  return (
    <div className="students-page">
      <div className="page-header flex justify-between items-center">
        <div>
          <h1 className="text-h1">Quản lý Học sinh</h1>
          <p className="text-muted mt-2">Danh sách tất cả học sinh đang theo học tại trung tâm.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus size={18} className="mr-2" />
          Thêm Học sinh
        </Button>
      </div>

      <div className="glass-panel table-container">
        <div className="table-actions">
          <div className="search-box">
            <Search size={18} className="text-muted" />
            <input type="text" placeholder="Tìm kiếm theo tên hoặc SĐT..." className="table-search-input" />
          </div>
          <div className="filter-actions">
            <Button variant="secondary" size="sm">Bộ lọc</Button>
            <Button variant="secondary" size="sm">Xuất Excel</Button>
          </div>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Họ và Tên</th>
              <th>SĐT Học sinh</th>
              <th>Phụ huynh</th>
              <th>SĐT Phụ huynh</th>
              <th>Ngày Đăng ký</th>
              <th className="text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" className="text-center py-4">Đang tải dữ liệu...</td></tr>
            ) : students.length === 0 ? (
              <tr><td colSpan="7" className="text-center py-4">Chưa có học sinh nào.</td></tr>
            ) : (
              students.map(student => (
                <tr key={student.id}>
                  <td>HS{String(student.id).padStart(4, '0')}</td>
                  <td className="font-medium">{student.name}</td>
                  <td>{student.phone || '—'}</td>
                  <td>{student.parentName || '—'}</td>
                  <td>{student.parentPhone || '—'}</td>
                  <td>{new Date(student.createdAt).toLocaleDateString('vi-VN')}</td>
                  <td className="text-right">
                    <button className="action-btn" onClick={() => openEditModal(student)}><Edit2 size={16} /></button>
                    <button className="action-btn text-danger"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel animate-fade-in">
            <h2 className="text-h2 mb-4">{editId ? 'Sửa thông tin Học sinh' : 'Thêm Học sinh mới'}</h2>
            <form onSubmit={handleSubmit} className="form-layout">
              <div className="form-group">
                <label>Họ và Tên (*)</label>
                <input required type="text" name="name" value={formData.name} onChange={handleInputChange} className="form-input" />
              </div>
              <div className="form-group">
                <label>SĐT Học sinh</label>
                <input type="text" name="phone" value={formData.phone} onChange={handleInputChange} className="form-input" />
              </div>
              <div className="form-group">
                <label>Tên Phụ huynh</label>
                <input type="text" name="parentName" value={formData.parentName} onChange={handleInputChange} className="form-input" />
              </div>
              <div className="form-group">
                <label>SĐT Phụ huynh</label>
                <input type="text" name="parentPhone" value={formData.parentPhone} onChange={handleInputChange} className="form-input" />
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
