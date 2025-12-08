// src/AdminPanel.jsx
import React, { useState } from 'react';
import { supabase } from './supabaseClient';

const AdminPanel = ({ navData = [], setNavData }) => {
  const [newCategory, setNewCategory] = useState({ category: '', sort_order: 0, links: [] });
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    if (!newCategory.category.trim()) { alert('请输入分类名'); return; }
    setLoading(true);
    try {
      const payload = { category: newCategory.category, sort_order: newCategory.sort_order || 0, links: newCategory.links || [] };
      const { data, error } = await supabase.from('nav_categories').insert([payload]).select().single();
      if (error) throw error;
      setNavData(prev => [...prev, data]);
      setNewCategory({ category: '', sort_order: 0, links: [] });
    } catch (e) {
      alert('新增失败: ' + (e?.message || e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-8">
      <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-2xl font-bold text-gray-800 dark:text-white">管理员面板</h3>
        </div>

        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded mb-4">
          <input className="w-full p-3 rounded border mb-3 dark:bg-gray-600" placeholder="分类名称" value={newCategory.category} onChange={(e) => setNewCategory({ ...newCategory, category: e.target.value })} />
          <input type="number" className="w-32 p-3 rounded border mb-3 dark:bg-gray-600" value={newCategory.sort_order} onChange={(e) => setNewCategory({ ...newCategory, sort_order: parseInt(e.target.value || '0') })} />
          <div className="mb-3">
            <h4 className="font-medium mb-2">链接</h4>
            {/* 你的 LinkForm 组件 */}
          </div>
          <button onClick={handleAdd} className="px-4 py-2 bg-blue-600 text-white rounded">{loading ? '保存中...' : '保存分类'}</button>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
