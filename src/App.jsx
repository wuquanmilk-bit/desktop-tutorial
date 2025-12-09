// src/App.jsx
import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from './supabaseClient';
import { ExternalLink, X, Search, Settings, Edit, Trash2, Plus, LogOut, User, Mail, Lock, Key } from 'lucide-react';
import './index.css';

// 配置
const ADMIN_EMAIL = '115382613@qq.com';

// 工具函数
function useDebounce(value, delay = 200) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

// 默认数据
const DEFAULT_PUBLIC_NAV = [
  {
    id: 1,
    category: '常用开发',
    sort_order: 1,
    links: [
      { id: 'link-1', name: 'GitHub', url: 'https://github.com', description: '代码托管平台' },
      { id: 'link-2', name: 'Supabase', url: 'https://supabase.com', description: '后端即服务' },
      { id: 'link-3', name: 'Vercel', url: 'https://vercel.com', description: '部署平台' }
    ]
  },
  {
    id: 2,
    category: '设计资源',
    sort_order: 2,
    links: [
      { id: 'link-4', name: 'Figma', url: 'https://figma.com', description: '设计工具' },
      { id: 'link-5', name: 'Unsplash', url: 'https://unsplash.com', description: '免费图片' }
    ]
  }
];

// 组件
// 链接图标组件
const LinkIcon = ({ link }) => {
  const [err, setErr] = useState(false);
  const src = link.icon || `https://icons.duckduckgo.com/ip3/${new URL(link.url).hostname}.ico`;
  
  return (
    <div className="w-10 h-10 rounded-lg border bg-gray-50 dark:bg-gray-700 flex items-center justify-center">
      {!src || err ? (
        <ExternalLink className="w-5 h-5 text-blue-500" />
      ) : (
        <img 
          src={src} 
          alt={link.name} 
          className="w-6 h-6 object-contain" 
          onError={() => setErr(true)}
        />
      )}
    </div>
  );
};

// 链接卡片
const LinkCard = ({ link }) => (
  <a 
    href={link.url} 
    target="_blank" 
    rel="noopener noreferrer" 
    className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl border hover:shadow-lg transition flex gap-3"
  >
    <LinkIcon link={link} />
    <div className="min-w-0 flex-1">
      <h3 className="text-lg font-semibold truncate dark:text-white">{link.name}</h3>
      {link.description && (
        <p className="text-sm text-gray-500 dark:text-gray-300 truncate">{link.description}</p>
      )}
    </div>
    <ExternalLink className="w-4 h-4 text-gray-400" />
  </a>
);

// 公共导航显示组件
const PublicNav = ({ navData = [], searchTerm = '' }) => {
  const filtered = useMemo(() => {
    if (!searchTerm) return navData;
    const t = searchTerm.toLowerCase();
    return navData
      .map(category => ({
        ...category, 
        links: (category.links || []).filter(link =>
          (link.name || '').toLowerCase().includes(t) ||
          (link.url || '').toLowerCase().includes(t) ||
          (link.description || '').toLowerCase().includes(t)
        )
      }))
      .filter(category => (category.links || []).length > 0);
  }, [navData, searchTerm]);

  if (!filtered || filtered.length === 0) {
    return (
      <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl shadow">
        <Search className="w-12 h-12 mx-auto text-gray-400 mb-4" />
        <p className="text-lg text-gray-600 dark:text-gray-300">没有找到匹配结果。</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {filtered.map(category => (
        <section key={category.id} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">{category.category}</h2>
            <div className="text-sm text-gray-400">{(category.links || []).length} 个链接</div>
          </div>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {(category.links || []).map(link => (
              <LinkCard key={link.id} link={link} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};

// 链接表单组件
const LinkForm = ({ onSave, onCancel, initialData = null, mode = 'add' }) => {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    url: initialData?.url || '',
    description: initialData?.description || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.url.trim()) {
      alert('请输入链接名称和地址');
      return;
    }
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg space-y-3">
      <h4 className="font-semibold">{mode === 'add' ? '添加链接' : '编辑链接'}</h4>
      <input
        type="text"
        className="w-full p-2 border rounded dark:bg-gray-600"
        placeholder="链接名称 *"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        required
      />
      <input
        type="url"
        className="w-full p-2 border rounded dark:bg-gray-600"
        placeholder="链接地址 * (https://...)"
        value={formData.url}
        onChange={(e) => setFormData({ ...formData, url: e.target.value })}
        required
      />
      <input
        type="text"
        className="w-full p-2 border rounded dark:bg-gray-600"
        placeholder="描述 (可选)"
        value={formData.description}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
      />
      <div className="flex gap-2">
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          {mode === 'add' ? '添加链接' : '保存'}
        </button>
        {onCancel && (
          <button 
            type="button" 
            onClick={onCancel}
            className="px-4 py-2 border rounded hover:bg-gray-100 dark:hover:bg-gray-600"
          >
            取消
          </button>
        )}
      </div>
    </form>
  );
};

// 管理员面板
const AdminPanel = ({ navData = [], setNavData, onClose }) => {
  const [newCategory, setNewCategory] = useState({ category: '', sort_order: 0 });
  const [editingCategory, setEditingCategory] = useState(null);
  const [addingLinkTo, setAddingLinkTo] = useState(null);
  const [editingLink, setEditingLink] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleAddCategory = async () => {
    if (!newCategory.category.trim()) {
      alert('请输入分类名称');
      return;
    }
    
    setLoading(true);
    try {
      const newId = Math.max(0, ...navData.map(c => c.id)) + 1;
      const newCategoryData = {
        id: newId,
        category: newCategory.category,
        sort_order: newCategory.sort_order || 0,
        links: []
      };
      setNavData(prev => [...prev, newCategoryData]);
      setNewCategory({ category: '', sort_order: 0 });
    } catch (e) {
      alert('添加分类失败: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const startEditCategory = (cat) => setEditingCategory({ ...cat });
  const cancelEditCategory = () => setEditingCategory(null);
  const saveEditCategory = async () => {
    if (!editingCategory) return;
    try {
      setNavData(prev => prev.map(c => c.id === editingCategory.id ? editingCategory : c));
      cancelEditCategory();
    } catch (e) {
      alert('保存失败: ' + e.message);
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!confirm('确定删除此分类？分类下的所有链接也将被删除')) return;
    try {
      setNavData(prev => prev.filter(c => c.id !== id));
    } catch (e) {
      alert('删除失败: ' + e.message);
    }
  };

  const handleAddLink = async (categoryId, linkData) => {
    try {
      const category = navData.find(c => c.id === categoryId);
      if (!category) return;
      
      const newLink = {
        id: `link-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: linkData.name,
        url: linkData.url,
        description: linkData.description || '',
        icon: null
      };
      
      const updatedLinks = [...(category.links || []), newLink];
      setNavData(prev => prev.map(c => c.id === categoryId ? { ...c, links: updatedLinks } : c));
      setAddingLinkTo(null);
    } catch (e) {
      alert('添加链接失败: ' + e.message);
    }
  };

  const startEditLink = (categoryId, link) => setEditingLink({ categoryId, ...link });
  const cancelEditLink = () => setEditingLink(null);
  const saveEditLink = async (linkData) => {
    if (!editingLink) return;
    try {
      setNavData(prev => 
        prev.map(c => 
          c.id === editingLink.categoryId
            ? { ...c, links: (c.links || []).map(l => l.id === editingLink.id ? { ...linkData, id: editingLink.id } : l) }
            : c
        )
      );
      cancelEditLink();
    } catch (e) {
      alert('保存链接失败: ' + e.message);
    }
  };

  const handleDeleteLink = async (categoryId, linkId) => {
    if (!confirm('确定删除此链接？')) return;
    try {
      setNavData(prev => 
        prev.map(c => 
          c.id === categoryId
            ? { ...c, links: (c.links || []).filter(l => l.id !== linkId) }
            : c
        )
      );
    } catch (e) {
      alert('删除链接失败: ' + e.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-6xl my-8">
        {/* 标题栏 */}
        <div className="p-6 border-b flex justify-between items-center">
          <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
            <Settings className="inline mr-2" /> 管理公共导航
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {/* 新增分类区域 */}
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-6">
            <h4 className="font-semibold mb-3">新增分类</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                className="p-2 border rounded dark:bg-gray-600"
                placeholder="分类名称"
                value={newCategory.category}
                onChange={(e) => setNewCategory({ ...newCategory, category: e.target.value })}
              />
              <input
                type="number"
                className="p-2 border rounded dark:bg-gray-600"
                placeholder="排序"
                value={newCategory.sort_order}
                onChange={(e) => setNewCategory({ ...newCategory, sort_order: parseInt(e.target.value) || 0 })}
              />
              <button
                onClick={handleAddCategory}
                className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                disabled={loading}
              >
                {loading ? '添加中...' : '添加分类'}
              </button>
            </div>
          </div>

          {/* 分类列表 */}
          <div className="space-y-4">
            {navData.map(category => (
              <div key={category.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h4 className="font-semibold text-lg">{category.category}</h4>
                    <p className="text-sm text-gray-500">排序: {category.sort_order} | 链接数: {(category.links || []).length}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setAddingLinkTo(addingLinkTo === category.id ? null : category.id)}
                      className="px-3 py-1 bg-green-600 text-white rounded flex items-center gap-1 hover:bg-green-700"
                    >
                      <Plus className="w-4 h-4" /> 添加链接
                    </button>
                    <button onClick={() => startEditCategory(category)} className="px-3 py-1 bg-yellow-500 text-white rounded">编辑</button>
                    <button onClick={() => handleDeleteCategory(category.id)} className="px-3 py-1 bg-red-600 text-white rounded">删除</button>
                  </div>
                </div>

                {/* 添加链接表单 */}
                {addingLinkTo === category.id && (
                  <LinkForm
                    onSave={(link) => handleAddLink(category.id, link)}
                    onCancel={() => setAddingLinkTo(null)}
                    mode="add"
                  />
                )}

                {/* 链接列表 */}
                <div className="space-y-2">
                  {(category.links || []).map(link => (
                    <div key={link.id}>
                      {editingLink && editingLink.id === link.id ? (
                        <LinkForm
                          initialData={editingLink}
                          onSave={saveEditLink}
                          onCancel={cancelEditLink}
                          mode="edit"
                        />
                      ) : (
                        <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded flex justify-between items-center">
                          <div className="flex items-center gap-3 flex-1">
                            <LinkIcon link={link} />
                            <div>
                              <div className="font-medium">{link.name}</div>
                              <div className="text-sm text-gray-500 truncate max-w-md">{link.url}</div>
                              {link.description && (
                                <div className="text-sm text-gray-400">{link.description}</div>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => startEditLink(category.id, link)} className="px-2 py-1 bg-yellow-500 text-white rounded text-sm">编辑</button>
                            <button onClick={() => handleDeleteLink(category.id, link.id)} className="px-2 py-1 bg-red-500 text-white rounded text-sm">删除</button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 编辑分类模态框 */}
      {editingCategory && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h4 className="text-xl font-bold mb-4">编辑分类</h4>
            <div className="space-y-3">
              <input
                className="w-full p-2 border rounded dark:bg-gray-600"
                value={editingCategory.category}
                onChange={(e) => setEditingCategory({ ...editingCategory, category: e.target.value })}
              />
              <input
                type="number"
                className="w-full p-2 border rounded dark:bg-gray-600"
                value={editingCategory.sort_order}
                onChange={(e) => setEditingCategory({ ...editingCategory, sort_order: parseInt(e.target.value) || 0 })}
              />
              <div className="flex gap-2">
                <button onClick={saveEditCategory} className="flex-1 py-2 bg-green-600 text-white rounded">保存</button>
                <button onClick={cancelEditCategory} className="flex-1 py-2 border rounded">取消</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// 用户面板
const UserPanel = ({ user, userNav, setUserNav, onClose }) => {
  const [newCategory, setNewCategory] = useState({ category: '', sort_order: 0 });
  const [editingCategory, setEditingCategory] = useState(null);
  const [addingLinkTo, setAddingLinkTo] = useState(null);
  const [editingLink, setEditingLink] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleAddCategory = async () => {
    if (!newCategory.category.trim()) {
      alert('请输入分类名');
      return;
    }
    setLoading(true);
    try {
      const newId = Math.max(0, ...userNav.map(c => c.id)) + 1;
      const newCategoryData = {
        id: newId,
        user_id: user.id,
        category: newCategory.category,
        sort_order: newCategory.sort_order || 0,
        links: []
      };
      setUserNav(prev => [...prev, newCategoryData]);
      setNewCategory({ category: '', sort_order: 0 });
    } catch (e) {
      alert('新增失败: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const startEditCategory = (cat) => setEditingCategory({ ...cat });
  const cancelEditCategory = () => setEditingCategory(null);
  const saveEditCategory = async () => {
    if (!editingCategory) return;
    try {
      setUserNav(prev => prev.map(p => p.id === editingCategory.id ? editingCategory : p));
      setEditingCategory(null);
    } catch (e) {
      alert('保存失败: ' + e.message);
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!confirm('确定删除此分类？分类下的所有链接也将被删除')) return;
    try {
      setUserNav(prev => prev.filter(c => c.id !== id));
    } catch (e) {
      alert('删除失败: ' + e.message);
    }
  };

  const handleAddLink = async (categoryId, linkData) => {
    try {
      const category = userNav.find(c => c.id === categoryId);
      if (!category) return;
      
      const newLink = {
        id: `link-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: linkData.name,
        url: linkData.url,
        description: linkData.description || '',
        icon: null
      };
      
      const updatedLinks = [...(category.links || []), newLink];
      setUserNav(prev => prev.map(c => c.id === categoryId ? { ...c, links: updatedLinks } : c));
      setAddingLinkTo(null);
    } catch (e) {
      alert('添加链接失败: ' + e.message);
    }
  };

  const startEditLink = (categoryId, link) => setEditingLink({ categoryId, ...link });
  const cancelEditLink = () => setEditingLink(null);
  const saveEditLink = async (linkData) => {
    if (!editingLink) return;
    try {
      setUserNav(prev => 
        prev.map(c => 
          c.id === editingLink.categoryId
            ? { ...c, links: (c.links || []).map(l => l.id === editingLink.id ? { ...linkData, id: editingLink.id } : l) }
            : c
        )
      );
      setEditingLink(null);
    } catch (e) {
      alert('保存链接失败: ' + e.message);
    }
  };

  const handleDeleteLink = async (categoryId, linkId) => {
    if (!confirm('确定删除此链接？')) return;
    try {
      setUserNav(prev => 
        prev.map(c => 
          c.id === categoryId
            ? { ...c, links: (c.links || []).filter(l => l.id !== linkId) }
            : c
        )
      );
    } catch (e) {
      alert('删除链接失败: ' + e.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-6xl my-8">
        {/* 标题 */}
        <div className="p-6 border-b flex justify-between items-center">
          <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
            <User className="inline mr-2" /> 管理我的导航
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {/* 新增分类 */}
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-6">
            <h4 className="font-semibold mb-3">新增分类</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                className="p-2 border rounded dark:bg-gray-600"
                placeholder="分类名称"
                value={newCategory.category}
                onChange={(e) => setNewCategory({ ...newCategory, category: e.target.value })}
              />
              <input
                type="number"
                className="p-2 border rounded dark:bg-gray-600"
                placeholder="排序"
                value={newCategory.sort_order}
                onChange={(e) => setNewCategory({ ...newCategory, sort_order: parseInt(e.target.value) || 0 })}
              />
              <button
                onClick={handleAddCategory}
                className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                disabled={loading}
              >
                {loading ? '添加中...' : '添加分类'}
              </button>
            </div>
          </div>

          {/* 分类列表 */}
          <div className="space-y-4">
            {userNav.map(category => (
              <div key={category.id} className="border rounded-lg p-4">
                {/* 分类头部 */}
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h4 className="font-semibold text-lg">{category.category}</h4>
                    <p className="text-sm text-gray-500">排序: {category.sort_order} | 链接数: {(category.links || []).length}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setAddingLinkTo(addingLinkTo === category.id ? null : category.id)}
                      className="px-3 py-1 bg-green-600 text-white rounded flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4" /> 添加链接
                    </button>
                    <button onClick={() => startEditCategory(category)} className="px-3 py-1 bg-yellow-500 text-white rounded">编辑</button>
                    <button onClick={() => handleDeleteCategory(category.id)} className="px-3 py-1 bg-red-600 text-white rounded">删除</button>
                  </div>
                </div>

                {/* 添加链接表单 */}
                {addingLinkTo === category.id && (
                  <LinkForm
                    onSave={(link) => handleAddLink(category.id, link)}
                    onCancel={() => setAddingLinkTo(null)}
                    mode="add"
                  />
                )}

                {/* 链接列表 */}
                <div className="space-y-2">
                  {(category.links || []).map(link => (
                    <div key={link.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <LinkIcon link={link} />
                        <div>
                          <div className="font-medium">{link.name}</div>
                          <div className="text-sm text-gray-500 truncate max-w-md">{link.url}</div>
                          {link.description && (
                            <div className="text-sm text-gray-400">{link.description}</div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => startEditLink(category.id, link)} className="px-2 py-1 bg-yellow-500 text-white rounded text-sm">编辑</button>
                        <button onClick={() => handleDeleteLink(category.id, link.id)} className="px-2 py-1 bg-red-500 text-white rounded text-sm">删除</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 编辑分类模态框 */}
      {editingCategory && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h4 className="text-xl font-bold mb-4">编辑分类</h4>
            <div className="space-y-3">
              <input
                className="w-full p-2 border rounded dark:bg-gray-600"
                value={editingCategory.category}
                onChange={(e) => setEditingCategory({ ...editingCategory, category: e.target.value })}
              />
              <input
                type="number"
                className="w-full p-2 border rounded dark:bg-gray-600"
                value={editingCategory.sort_order}
                onChange={(e) => setEditingCategory({ ...editingCategory, sort_order: parseInt(e.target.value) || 0 })}
              />
              <div className="flex gap-2">
                <button onClick={saveEditCategory} className="flex-1 py-2 bg-green-600 text-white rounded">保存</button>
                <button onClick={cancelEditCategory} className="flex-1 py-2 border rounded">取消</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 编辑链接模态框 */}
      {editingLink && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h4 className="text-xl font-bold mb-4">编辑链接</h4>
            <LinkForm
              initialData={editingLink}
              onSave={saveEditLink}
              onCancel={cancelEditLink}
              mode="edit"
            />
          </div>
        </div>
      )}
    </div>
  );
};

// 登录/注册模态框
const AuthModal = ({ onClose, onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isRegister, setIsRegister] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('请输入邮箱和密码');
      return;
    }
    
    if (isRegister && password.length < 6) {
      setError('密码至少需要6位');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      if (isRegister) {
        // 注册
        const { data, error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            emailRedirectTo: window.location.origin
          }
        });
        if (error) throw error;
        alert('注册成功！请查收邮件并登录');
        setIsRegister(false);
        setEmail('');
        setPassword('');
      } else {
        // 登录
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onLogin && onLogin(data.user);
        onClose();
      }
    } catch (err) { 
      setError((isRegister ? '注册失败: ' : '登录失败: ') + (err.message || err)); 
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <button onClick={onClose} className="float-right">
          <X className="w-5 h-5" />
        </button>
        
        <div className="text-center mb-6">
          {isRegister ? (
            <>
              <Mail className="w-12 h-12 mx-auto text-green-500 mb-2" />
              <h3 className="text-xl font-bold mb-2">注册账户</h3>
              <p className="text-sm text-gray-500 dark:text-gray-300">创建您的个人导航账户</p>
            </>
          ) : (
            <>
              <User className="w-12 h-12 mx-auto text-blue-500 mb-2" />
              <h3 className="text-xl font-bold mb-2">登录账户</h3>
              <p className="text-sm text-gray-500 dark:text-gray-300">登录以管理您的个人导航</p>
            </>
          )}
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-800 rounded text-red-600 dark:text-red-300 text-sm">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">邮箱地址</label>
            <input
              type="email"
              className="w-full p-3 border rounded dark:bg-gray-700 dark:border-gray-600"
              placeholder="请输入邮箱"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">密码</label>
            <input
              type="password"
              className="w-full p-3 border rounded dark:bg-gray-700 dark:border-gray-600"
              placeholder={isRegister ? "设置密码 (至少6位)" : "请输入密码"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />
          </div>
          
          {isRegister && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded text-sm text-blue-700 dark:text-blue-300">
              <Key className="w-4 h-4 inline mr-1" /> 注册成功后，您将可以创建和管理个人导航
            </div>
          )}
          
          <button
            type="submit"
            className="w-full py-3 bg-blue-600 text-white rounded hover:bg-blue-700"
            disabled={loading}
          >
            {loading ? (isRegister ? '注册中...' : '登录中...') : (isRegister ? '注册' : '登录')}
          </button>
          
          <div className="text-center pt-4 border-t">
            <button
              type="button"
              onClick={() => setIsRegister(!isRegister)}
              className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              {isRegister ? '已有账户？立即登录' : '没有账户？立即注册'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// 欢迎新用户组件
const WelcomeModal = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <div className="text-center mb-6">
          <User className="w-12 h-12 mx-auto text-green-500 mb-2" />
          <h3 className="text-xl font-bold mb-2">欢迎使用！</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">您的账户已创建成功</p>
        </div>
        
        <div className="space-y-3 mb-6">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded flex items-start">
            <div className="bg-blue-100 dark:bg-blue-800 p-2 rounded mr-3">
              <Settings className="w-5 h-5 text-blue-600 dark:text-blue-300" />
            </div>
            <div>
              <h4 className="font-medium">管理您的导航</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">点击右上角的"管理我的导航"来添加分类和链接</p>
            </div>
          </div>

          <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded flex items-start">
            <div className="bg-green-100 dark:bg-green-800 p-2 rounded mr-3">
              <Plus className="w-5 h-5 text-green-600 dark:text-green-300" />
            </div>
            <div>
              <h4 className="font-medium">创建个人收藏</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">您可以创建完全私人的导航，与公共导航完全独立</p>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          开始使用
        </button>
      </div>
    </div>
  );
};

// 主应用组件
export default function App() {
  const [publicNav, setPublicNav] = useState(DEFAULT_PUBLIC_NAV);
  const [userNav, setUserNav] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 180);
  const [showAuth, setShowAuth] = useState(false);
  const [user, setUser] = useState(null);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showUserPanel, setShowUserPanel] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [viewMode, setViewMode] = useState('public'); // 'public' 或 'user'

  const isAdmin = user?.email === ADMIN_EMAIL;

  // 初始化认证状态
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data?.session?.user) {
        setUser(data.session.user);
        const isNew = localStorage.getItem(`first_time_${data.session.user.id}`) === null;
        if (isNew) {
          setIsNewUser(true);
          setShowWelcome(true);
          localStorage.setItem(`first_time_${data.session.user.id}`, 'true');
        }
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        const isNew = localStorage.getItem(`first_time_${session.user.id}`) === null;
        if (isNew) {
          setIsNewUser(true);
          setShowWelcome(true);
          localStorage.setItem(`first_time_${session.user.id}`, 'true');
        }
      } else {
        setUser(null);
        setIsNewUser(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // 加载用户导航
  useEffect(() => {
    if (!user) {
      setUserNav([]);
      return;
    }

    const loadUserNav = async () => {
      // 默认用户数据
      setUserNav([
        {
          id: 1,
          user_id: user.id,
          category: '我的收藏',
          sort_order: 1,
          links: [
            { 
              id: 'user-link-1', 
              name: '个人仪表板', 
              url: 'https://example.com', 
              description: '示例链接'
            }
          ]
        }
      ]);
    };

    loadUserNav();
  }, [user]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setShowAdminPanel(false);
    setShowUserPanel(false);
    setViewMode('public');
  };

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === '/' && !e.target.matches('input, textarea')) {
        e.preventDefault();
        document.getElementById('searchInput')?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-[#0b1020]">
      {/* 顶部导航栏 */}
      <header className="sticky top-0 z-40 bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">极速导航</h1>
              <span className="text-sm text-gray-500 dark:text-gray-300 hidden sm:inline">快速入口</span>
            </div>

            <div className="flex items-center gap-3">
              {/* 搜索框 */}
              <div className="hidden md:block w-[320px]">
                <input
                  id="searchInput"
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="搜索链接... (按 / 聚焦)"
                  className="w-full px-3 py-2 rounded-full border bg-white dark:bg-gray-700 dark:border-gray-600"
                />
              </div>

              {/* 用户操作 */}
              {!user ? (
                <div className="flex gap-2">
                  <button 
                    onClick={() => setShowAuth(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    登录
                  </button>
                  <button 
                    onClick={() => setShowAuth(true)}
                    className="px-4 py-2 border border-blue-600 text-blue-600 dark:text-blue-300 rounded hover:bg-blue-50 dark:hover:bg-gray-700"
                  >
                    注册
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    {user.email}
                  </span>
                  {isAdmin && (
                    <button
                      onClick={() => { setShowAdminPanel(true); setShowUserPanel(false); }}
                      className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                    >
                      管理公共导航
                    </button>
                  )}
                  <button
                    onClick={() => { setShowUserPanel(true); setShowAdminPanel(false); }}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    管理我的导航
                  </button>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center gap-1"
                  >
                    <LogOut className="w-4 h-4" /> 退出
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 移动端搜索框 */}
      <div className="md:hidden p-4">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="搜索链接..."
          className="w-full px-3 py-2 rounded-full border bg-white dark:bg-gray-700 dark:border-gray-600"
        />
      </div>

      {/* 视图切换按钮（用户登录时显示） */}
      {user && (
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('public')}
              className={`px-4 py-2 rounded-lg ${viewMode === 'public' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
            >
              <Settings className="w-4 h-4 inline mr-2" /> 公共导航
            </button>
            <button
              onClick={() => setViewMode('user')}
              className={`px-4 py-2 rounded-lg ${viewMode === 'user' ? 'bg-green-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
            >
              <User className="w-4 h-4 inline mr-2" /> 我的导航
            </button>
          </div>
        </div>
      )}

      {/* 主内容区 */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {!user && viewMode === 'user' ? (
          <div className="text-center py-12">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-8">
              <User className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">请先登录</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">登录后可以管理个人导航</p>
              <button
                onClick={() => setShowAuth(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                立即登录
              </button>
            </div>
          </div>
        ) : (
          <PublicNav 
            navData={viewMode === 'user' ? userNav : publicNav} 
            searchTerm={debouncedSearch} 
          />
        )}
      </main>

      {/* 模态框 */}
      {showAuth && (
        <AuthModal 
          onClose={() => setShowAuth(false)} 
          onLogin={(u) => {
            setUser(u);
            setShowAuth(false);
            setViewMode('user');
          }}
        />
      )}
      
      {showAdminPanel && isAdmin && (
        <AdminPanel 
          navData={publicNav}
          setNavData={setPublicNav}
          onClose={() => setShowAdminPanel(false)}
        />
      )}
      
      {showUserPanel && user && (
        <UserPanel 
          user={user}
          userNav={userNav}
          setUserNav={setUserNav}
          onClose={() => setShowUserPanel(false)}
        />
      )}
      
      {showWelcome && isNewUser && (
        <WelcomeModal onClose={() => setShowWelcome(false)} />
      )}
    </div>
  );
}