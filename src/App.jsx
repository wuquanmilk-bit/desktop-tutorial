// src/App.jsx
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { supabase } from './supabaseClient';
import { ExternalLink, X, Search, Settings, Edit, Trash2, Plus, LogOut, User, Mail, Lock, Key } from 'lucide-react';
import './index.css';

// ====================================================================
// 配置
// ====================================================================
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

// 辅助函数: 计算运行天数
function useRunningDays(startDateString) {
  const [runningDays, setRunningDays] = useState(0);

  useEffect(() => {
    const startDate = new Date(startDateString);
    const today = new Date();
    
    // 计算时间差 (毫秒)
    const diffTime = Math.abs(today - startDate);
    // 转换为天数
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    
    setRunningDays(diffDays);
  }, [startDateString]);

  return runningDays;
}


// 默认数据 (数据库加载失败时的回退)
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

// ====================================================================
// 核心数据同步函数
// ====================================================================

// **数据加载：公共导航**
async function fetchPublicNav() {
  const { data: categories, error: catError } = await supabase
    .from('nav_categories')
    .select('*')
    .order('sort_order', { ascending: true });

  if (catError) throw catError;

  const { data: links, error: linkError } = await supabase
    .from('nav_links')
    .select('*');

  if (linkError) throw linkError;

  return categories.map(cat => ({
    ...cat,
    links: links
      .filter(link => link.category_id === cat.id)
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
      .map(link => ({ 
        ...link, 
        id: `link-${link.id}`, // 将数据库ID转换为前端ID格式
        category_id: cat.id
      })) 
  }));
}

// **数据加载：用户导航**
async function fetchUserNav(userId) {
  const { data: categories, error: catError } = await supabase
    .from('nav_user_categories')
    .select('*')
    .eq('user_id', userId)
    .order('sort_order', { ascending: true });

  if (catError) throw catError;

  const { data: links, error: linkError } = await supabase
    .from('nav_user_links')
    .select('*')
    .eq('user_id', userId);

  if (linkError) throw linkError;

  return categories.map(cat => ({
    ...cat,
    links: links
      .filter(link => link.category_id === cat.id)
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
      .map(link => ({ 
        ...link, 
        id: `link-${link.id}`, 
        category_id: cat.id 
      })) 
  }));
}

// **数据保存：公共导航 (调用 RPC)**
async function savePublicNavToDB(navData) {
  const categoriesToSave = navData.map(c => ({ 
    id: typeof c.id === 'number' && c.id > 0 ? c.id : null, 
    category: c.category, 
    sort_order: c.sort_order 
  }));

  const linksToSave = navData.flatMap(c => 
    c.links.map(l => ({ 
      category_id: c.id, 
      name: l.name, 
      url: l.url, 
      description: l.description, 
      icon: l.icon, 
      sort_order: l.sort_order || 0,
      id: l.id && l.id.startsWith('link-') ? parseInt(l.id.replace('link-', '')) : null 
    }))
  );

  const { error } = await supabase.rpc('sync_public_nav', {
    categories_data: categoriesToSave,
    links_data: linksToSave
  });

  if (error) throw error;
}

// **数据保存：用户导航 (调用 RPC)**
async function saveUserNavToDB(userId, navData) {
    
    // 强制使用数组索引 (index) 作为 sort_order
    const categoriesToSave = navData.map((c, index) => ({ 
        id: typeof c.id === 'number' && c.id > 0 ? c.id : null, 
        category: c.category, 
        sort_order: index, 
        user_id: userId
    }));

    const linksToSave = navData.flatMap(c => 
        c.links.map((l, index) => ({ 
            category_id: c.id, 
            user_id: userId,
            name: l.name, 
            url: l.url, 
            description: l.description, 
            icon: l.icon, 
            sort_order: index, 
            id: l.id && l.id.startsWith('link-') ? parseInt(l.id.replace('link-', '')) : null 
        }))
    );
    
    // 修正：参数名称必须是 p_user_id
    const { error } = await supabase.rpc('sync_my_nav', {
        p_user_id: userId, 
        categories_data: categoriesToSave,
        links_data: linksToSave
    });

    if (error) throw error;
}

// ====================================================================
// 核心组件 (LinkIcon, LinkCard, PublicNav, LinkForm)
// ====================================================================

// 链接图标组件
const LinkIcon = ({ link }) => {
  const [err, setErr] = useState(false);
  // 使用 link.icon 或 DuckDuckGo 的 favicon 服务
  const src = link.icon || (link.url ? `https://icons.duckduckgo.com/ip3/${new URL(link.url).hostname}.ico` : null);
  
  return (
    <div className="w-10 h-10 rounded-lg border bg-gray-50 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
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

// 链接卡片 (已修改为可点击触发操作，实现手机 App 悬浮功能)
const LinkCard = ({ link, onOpen }) => (
  <div 
    onClick={() => onOpen(link)} // 点击时弹出操作菜单
    className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl border hover:shadow-lg transition flex gap-3 cursor-pointer"
  >
    <LinkIcon link={link} />
    <div className="min-w-0 flex-1">
      <h3 className="text-lg font-semibold truncate dark:text-white">{link.name}</h3>
      {link.description && (
        <p className="text-sm text-gray-500 dark:text-gray-300 truncate">{link.description}</p>
      )}
    </div>
    <ExternalLink className="w-4 h-4 text-gray-400 flex-shrink-0" />
  </div>
);

// 公共导航显示组件 (修改：接受 onLinkClick 回调)
const PublicNav = ({ navData = [], searchTerm = '', user, viewMode, onLinkClick }) => {
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
              <LinkCard 
                key={link.id} 
                link={link} 
                onOpen={onLinkClick} // 传递点击事件
              />
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
    <form onSubmit={handleSubmit} className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg space-y-3">
      <h4 className="font-semibold">{mode === 'add' ? '添加链接' : '编辑链接'}</h4>
      <input
        type="text"
        className="w-full p-2 border rounded dark:bg-gray-600 dark:border-gray-500"
        placeholder="链接名称 *"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        required
      />
      <input
        type="url"
        className="w-full p-2 border rounded dark:bg-gray-600 dark:border-gray-500"
        placeholder="链接地址 * (https://...)"
        value={formData.url}
        onChange={(e) => setFormData({ ...formData, url: e.target.value })}
        required
      />
      <input
        type="text"
        className="w-full p-2 border rounded dark:bg-gray-600 dark:border-gray-500"
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
            className="px-4 py-2 border rounded hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            取消
          </button>
        )}
      </div>
    </form>
  );
};

// ====================================================================
// AdminPanel (管理面板组件)
// ====================================================================
const AdminPanel = ({ navData = [], setNavData, onClose, onSave }) => {
  const [newCategory, setNewCategory] = useState({ category: '', sort_order: 0 });
  const [editingCategory, setEditingCategory] = useState(null);
  const [addingLinkTo, setAddingLinkTo] = useState(null);
  const [editingLink, setEditingLink] = useState(null);
  const [loading, setLoading] = useState(false);

  const sortedNavData = useMemo(() => {
    return [...navData].sort((a, b) => a.sort_order - b.sort_order);
  }, [navData]);

  const handleAddCategory = () => {
    if (!newCategory.category.trim()) {
      alert('请输入分类名称');
      return;
    }
    const newId = Date.now(); 
    
    const newCategoryData = {
      id: newId,
      category: newCategory.category,
      sort_order: newCategory.sort_order || 0,
      links: []
    };
    setNavData(prev => [...prev, newCategoryData]);
    setNewCategory({ category: '', sort_order: 0 });
  };

  const startEditCategory = (cat) => setEditingCategory({ ...cat });
  const cancelEditCategory = () => setEditingCategory(null);
  const saveEditCategory = () => {
    if (!editingCategory) return;
    setNavData(prev => prev.map(c => c.id === editingCategory.id ? editingCategory : c));
    cancelEditCategory();
  };

  const handleDeleteCategory = (id) => {
    if (!confirm('确定删除此分类？分类下的所有链接也将被删除')) return;
    setNavData(prev => prev.filter(c => c.id !== id));
  };

  const handleAddLink = (categoryId, linkData) => {
    const newLink = {
      id: `link-temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: linkData.name,
      url: linkData.url,
      description: linkData.description || '',
      icon: null,
      sort_order: 999,
    };
    
    setNavData(prev => 
      prev.map(c => 
        c.id === categoryId
          ? { ...c, links: [...(c.links || []), newLink] }
          : c
      )
    );
    setAddingLinkTo(null);
  };

  const startEditLink = (categoryId, link) => setEditingLink({ categoryId, ...link });
  const cancelEditLink = () => setEditingLink(null);
  const saveEditLink = (linkData) => {
    if (!editingLink) return;
    
    const updatedLink = { ...linkData, id: editingLink.id }; 
    
    setNavData(prev => 
      prev.map(c => 
        c.id === editingLink.categoryId
          ? { ...c, links: (c.links || []).map(l => l.id === editingLink.id ? updatedLink : l) }
          : c
      )
    );
    cancelEditLink();
  };

  const handleDeleteLink = (categoryId, linkId) => {
    if (!confirm('确定删除此链接？')) return;
    setNavData(prev => 
      prev.map(c => 
        c.id === categoryId
          ? { ...c, links: (c.links || []).filter(l => l.id !== linkId) }
          : c
      )
    );
  };
  
  const handleSave = async () => {
      setLoading(true);
      try {
          // *** 关键：调用 App 组件传入的 onSave prop (handleSavePublicNav) ***
          await onSave(); 
      } catch (e) {
          console.error("保存失败:", e);
      } finally {
          setLoading(false);
      }
  };


  return (
    <div className="fixed inset-0 bg-black/60 flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-6xl my-8">
        {/* 标题栏 - 添加了保存按钮 */}
        <div className="p-6 border-b flex justify-between items-center">
          <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
            <Settings className="inline mr-2" /> 管理公共导航
          </h3>
          <div className="flex gap-3 items-center">
            <button 
                onClick={handleSave} 
                className={`px-4 py-2 text-white rounded font-semibold ${loading ? 'bg-gray-500' : 'bg-blue-600 hover:bg-blue-700'}`}
                disabled={loading}
            >
                {loading ? '保存中...' : '保存公共导航'}
            </button>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {/* 新增分类区域 */}
          <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg mb-6">
            <h4 className="font-semibold mb-3">新增分类</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                className="p-2 border rounded dark:bg-gray-600 dark:border-gray-500"
                placeholder="分类名称"
                value={newCategory.category}
                onChange={(e) => setNewCategory({ ...newCategory, category: e.target.value })}
              />
              <input
                type="number"
                className="p-2 border rounded dark:bg-gray-600 dark:border-gray-500"
                placeholder="排序"
                value={newCategory.sort_order}
                onChange={(e) => setNewCategory({ ...newCategory, sort_order: parseInt(e.target.value) || 0 })}
              />
              <button
                onClick={handleAddCategory}
                className="p-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                添加分类
              </button>
            </div>
          </div>

          {/* 分类列表 */}
          <div className="space-y-4">
            {sortedNavData.map(category => (
              <div key={category.id} className="border rounded-lg p-4 bg-white dark:bg-gray-800">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h4 className="font-semibold text-lg">{category.category}</h4>
                    <p className="text-sm text-gray-500">
                        排序: {category.sort_order} | 链接数: {(category.links || []).length} 
                        {typeof category.id !== 'number' && <span className="text-red-500 ml-2">(新ID)</span>}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setAddingLinkTo(addingLinkTo === category.id ? null : category.id)}
                      className="px-3 py-1 bg-green-600 text-white rounded flex items-center gap-1 hover:bg-green-700 text-sm"
                    >
                      <Plus className="w-4 h-4" /> 添加链接
                    </button>
                    <button onClick={() => startEditCategory(category)} className="px-3 py-1 bg-yellow-500 text-white rounded text-sm">编辑</button>
                    <button onClick={() => handleDeleteCategory(category.id)} className="px-3 py-1 bg-red-600 text-white rounded text-sm">删除</button>
                  </div>
                </div>

                {/* 编辑分类模态框 */}
                {editingCategory && editingCategory.id === category.id && (
                    <div className="my-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded space-y-3">
                        <h4 className="font-bold">编辑分类：{editingCategory.category}</h4>
                        <input
                            className="w-full p-2 border rounded dark:bg-gray-600 dark:border-gray-500"
                            value={editingCategory.category}
                            onChange={(e) => setEditingCategory({ ...editingCategory, category: e.target.value })}
                        />
                        <input
                            type="number"
                            className="w-full p-2 border rounded dark:bg-gray-600 dark:border-gray-500"
                            value={editingCategory.sort_order}
                            onChange={(e) => setEditingCategory({ ...editingCategory, sort_order: parseInt(e.target.value) || 0 })}
                        />
                        <div className="flex gap-2">
                            <button onClick={saveEditCategory} className="flex-1 py-2 bg-green-600 text-white rounded">保存</button>
                            <button onClick={cancelEditCategory} className="flex-1 py-2 border rounded dark:text-white">取消</button>
                        </div>
                    </div>
                )}
                
                {/* 添加链接表单 */}
                {addingLinkTo === category.id && (
                  <LinkForm
                    onSave={(link) => handleAddLink(category.id, link)}
                    onCancel={() => setAddingLinkTo(null)}
                    mode="add"
                  />
                )}

                {/* 链接列表 */}
                <div className="space-y-2 mt-4">
                  {(category.links || []).map(link => (
                    <div key={link.id}>
                      {editingLink && editingLink.id === link.id ? (
                        <div className="mt-2">
                            <LinkForm
                            initialData={editingLink}
                            onSave={saveEditLink}
                            onCancel={cancelEditLink}
                            mode="edit"
                            />
                        </div>
                      ) : (
                        <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded flex justify-between items-center">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <LinkIcon link={link} />
                            <div className="min-w-0 flex-1">
                              <div className="font-medium truncate">{link.name}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{link.url}</div>
                            </div>
                          </div>
                          <div className="flex gap-2 flex-shrink-0">
                            <button onClick={() => startEditLink(category.id, link)} className="px-2 py-1 bg-yellow-500 text-white rounded text-xs">编辑</button>
                            <button onClick={() => handleDeleteLink(category.id, link.id)} className="px-2 py-1 bg-red-500 text-white rounded text-xs">删除</button>
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
    </div>
  );
};

// ====================================================================
// UserPanel (用户面板组件)
// ====================================================================
const UserPanel = ({ user, userNav, setUserNav, onClose, onSave }) => {
  const [newCategory, setNewCategory] = useState({ category: '', sort_order: 0 });
  const [editingCategory, setEditingCategory] = useState(null);
  const [addingLinkTo, setAddingLinkTo] = useState(null);
  const [editingLink, setEditingLink] = useState(null);
  const [loading, setLoading] = useState(false);

  const sortedUserNav = useMemo(() => {
    return [...userNav].sort((a, b) => a.sort_order - b.sort_order);
  }, [userNav]);

  const handleAddCategory = () => {
    if (!newCategory.category.trim()) {
      alert('请输入分类名');
      return;
    }
    const newId = Date.now();
    const newCategoryData = {
      id: newId,
      user_id: user.id,
      category: newCategory.category,
      sort_order: newCategory.sort_order || 0,
      links: []
    };
    setUserNav(prev => [...prev, newCategoryData]);
    setNewCategory({ category: '', sort_order: 0 });
  };

  const startEditCategory = (cat) => setEditingCategory({ ...cat });
  const cancelEditCategory = () => setEditingCategory(null);
  const saveEditCategory = () => {
    if (!editingCategory) return;
    setUserNav(prev => prev.map(p => p.id === editingCategory.id ? editingCategory : p));
    setEditingCategory(null);
  };

  const handleDeleteCategory = (id) => {
    if (!confirm('确定删除此分类？分类下的所有链接也将被删除')) return;
    setUserNav(prev => prev.filter(c => c.id !== id));
  };

  const handleAddLink = (categoryId, linkData) => {
    const newLink = {
      id: `link-temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: linkData.name,
      url: linkData.url,
      description: linkData.description || '',
      icon: null,
      sort_order: 999,
    };
    
    setUserNav(prev => 
      prev.map(c => 
        c.id === categoryId
          ? { ...c, links: [...(c.links || []), newLink] }
          : c
      )
    );
    setAddingLinkTo(null);
  };

  const startEditLink = (categoryId, link) => setEditingLink({ categoryId, ...link });
  const cancelEditLink = () => setEditingLink(null);
  const saveEditLink = (linkData) => {
    if (!editingLink) return;
    const updatedLink = { ...linkData, id: editingLink.id }; 

    setUserNav(prev => 
      prev.map(c => 
        c.id === editingLink.categoryId
          ? { ...c, links: (c.links || []).map(l => l.id === editingLink.id ? updatedLink : l) }
          : c
      )
    );
    setEditingLink(null);
  };

  const handleDeleteLink = (categoryId, linkId) => {
    if (!confirm('确定删除此链接？')) return;
    setUserNav(prev => 
      prev.map(c => 
        c.id === categoryId
          ? { ...c, links: (c.links || []).filter(l => l.id !== linkId) }
          : c
      )
    );
  };
  
  const handleSave = async () => {
      setLoading(true);
      try {
          // *** 关键：调用 App 组件传入的 onSave prop (handleSaveUserNav) ***
          await onSave(); 
      } catch (e) {
          console.error("保存失败:", e);
      } finally {
          setLoading(false);
      }
  };


  return (
    <div className="fixed inset-0 bg-black/60 flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-6xl my-8">
        {/* 标题 - 添加了保存按钮 */}
        <div className="p-6 border-b flex justify-between items-center">
          <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
            <User className="inline mr-2" /> 管理我的导航
          </h3>
          <div className="flex gap-3 items-center">
            <button 
                onClick={handleSave} 
                className={`px-4 py-2 text-white rounded font-semibold ${loading ? 'bg-gray-500' : 'bg-green-600 hover:bg-green-700'}`}
                disabled={loading}
            >
                {loading ? '保存中...' : '保存我的导航'}
            </button>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {/* 新增分类 */}
          <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg mb-6">
            <h4 className="font-semibold mb-3">新增分类</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                className="p-2 border rounded dark:bg-gray-600 dark:border-gray-500"
                placeholder="分类名称"
                value={newCategory.category}
                onChange={(e) => setNewCategory({ ...newCategory, category: e.target.value })}
              />
              <input
                type="number"
                className="p-2 border rounded dark:bg-gray-600 dark:border-gray-500"
                placeholder="排序"
                value={newCategory.sort_order}
                onChange={(e) => setNewCategory({ ...newCategory, sort_order: parseInt(e.target.value) || 0 })}
              />
              <button
                onClick={handleAddCategory}
                className="p-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                添加分类
              </button>
            </div>
          </div>

          {/* 分类列表 */}
          <div className="space-y-4">
            {sortedUserNav.map(category => (
              <div key={category.id} className="border rounded-lg p-4 bg-white dark:bg-gray-800">
                {/* 分类头部 */}
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h4 className="font-semibold text-lg">{category.category}</h4>
                    <p className="text-sm text-gray-500">
                        排序: {category.sort_order} | 链接数: {(category.links || []).length}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setAddingLinkTo(addingLinkTo === category.id ? null : category.id)}
                      className="px-3 py-1 bg-green-600 text-white rounded flex items-center gap-1 text-sm"
                    >
                      <Plus className="w-4 h-4" /> 添加链接
                    </button>
                    <button onClick={() => startEditCategory(category)} className="px-3 py-1 bg-yellow-500 text-white rounded text-sm">编辑</button>
                    <button onClick={() => handleDeleteCategory(category.id)} className="px-3 py-1 bg-red-600 text-white rounded text-sm">删除</button>
                  </div>
                </div>
                
                {/* 编辑分类模态框 */}
                {editingCategory && editingCategory.id === category.id && (
                    <div className="my-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded space-y-3">
                        <h4 className="font-bold">编辑分类：{editingCategory.category}</h4>
                        <input
                            className="w-full p-2 border rounded dark:bg-gray-600 dark:border-gray-500"
                            value={editingCategory.category}
                            onChange={(e) => setEditingCategory({ ...editingCategory, category: e.target.value })}
                        />
                        <input
                            type="number"
                            className="w-full p-2 border rounded dark:bg-gray-600 dark:border-gray-500"
                            value={editingCategory.sort_order}
                            onChange={(e) => setEditingCategory({ ...editingCategory, sort_order: parseInt(e.target.value) || 0 })}
                        />
                        <div className="flex gap-2">
                            <button onClick={saveEditCategory} className="flex-1 py-2 bg-green-600 text-white rounded">保存</button>
                            <button onClick={cancelEditCategory} className="flex-1 py-2 border rounded dark:text-white">取消</button>
                        </div>
                    </div>
                )}


                {/* 添加链接表单 */}
                {addingLinkTo === category.id && (
                  <LinkForm
                    onSave={(link) => handleAddLink(category.id, link)}
                    onCancel={() => setAddingLinkTo(null)}
                    mode="add"
                  />
                )}

                {/* 链接列表 */}
                <div className="space-y-2 mt-4">
                  {(category.links || []).map(link => (
                    <div key={link.id}>
                      {editingLink && editingLink.id === link.id ? (
                        <div className="mt-2">
                            <LinkForm
                            initialData={editingLink}
                            onSave={saveEditLink}
                            onCancel={cancelEditLink}
                            mode="edit"
                            />
                        </div>
                      ) : (
                        <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded flex justify-between items-center">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <LinkIcon link={link} />
                            <div className="min-w-0 flex-1">
                              <div className="font-medium truncate">{link.name}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{link.url}</div>
                            </div>
                          </div>
                          <div className="flex gap-2 flex-shrink-0">
                            <button onClick={() => startEditLink(category.id, link)} className="px-2 py-1 bg-yellow-500 text-white rounded text-xs">编辑</button>
                            <button onClick={() => handleDeleteLink(category.id, link.id)} className="px-2 py-1 bg-red-500 text-white rounded text-xs">删除</button>
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
    </div>
  );
};

// ====================================================================
// AuthModal, WelcomeModal, InfoModal, LinkActionModal (认证、欢迎、信息和链接操作组件)
// ====================================================================
const InfoModal = ({ title, content, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-3xl my-8">
        <div className="p-6 border-b flex justify-between items-center">
          <h3 className="text-2xl font-bold text-gray-800 dark:text-white">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
          {content}
        </div>
        <div className="p-4 border-t flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">关闭</button>
        </div>
      </div>
    </div>
  );
};

// 链接操作模态框 (用于实现手机 App 悬浮功能)
const LinkActionModal = ({ link, user, onClose, onEdit, isUserNav }) => {
    
    // 如果是用户导航，或者管理员编辑公共导航，则可以编辑
    const canEdit = (user && isUserNav) || (user && user.email === ADMIN_EMAIL && !isUserNav);

    return (
        // z-50 确保在最顶层
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-sm">
                <div className="text-center mb-4">
                    <h3 className="text-xl font-bold truncate dark:text-white">{link.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{link.url}</p>
                </div>
                
                <div className="space-y-3">
                    {/* 1. 打开链接 (主要操作) */}
                    <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={onClose}
                        className="flex items-center justify-center w-full py-3 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        <ExternalLink className="w-5 h-5 mr-2" /> 立即打开链接
                    </a>
                    
                    {/* 2. 编辑链接 (如果可编辑) */}
                    {canEdit && onEdit && (
                        <button
                            onClick={() => { onEdit(link); onClose(); }}
                            className="flex items-center justify-center w-full py-3 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                        >
                            <Edit className="w-5 h-5 mr-2" /> 编辑链接
                        </button>
                    )}
                    
                    {/* 3. 取消 */}
                    <button
                        onClick={onClose}
                        className="w-full py-3 border rounded hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white"
                    >
                        取消
                    </button>
                </div>
            </div>
        </div>
    );
};


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
        const { error } = await supabase.auth.signUp({ 
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
              <p className="text-sm text-gray-600 dark:text-gray-300">点击右下角的"我的导航"按钮来添加分类和链接</p>
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
// ====================================================================
// 主应用组件
// ====================================================================

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showUserPanel, setShowUserPanel] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('public'); 
  const [publicNav, setPublicNav] = useState([]);
  const [userNav, setUserNav] = useState([]);
  const [showWelcome, setShowWelcome] = useState(false);
  const [selectedLink, setSelectedLink] = useState(null); // 存储被点击的链接，用于浮动菜单
  
  // 新增：信息模态框状态
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showDisclaimerModal, setShowDisclaimerModal] = useState(false);
  
  // 网站运行天数计算的起始日期 (可以根据实际情况修改)
  const START_DATE = '2023-01-01'; 
  const runningDays = useRunningDays(START_DATE); 

  // 站外搜索配置
  const [searchMode, setSearchMode] = useState('internal'); 
  const searchEngines = useMemo(() => ([
    { id: 'internal', name: '站内搜索', url: '#' },
    { id: 'baidu', name: '百度', url: 'https://www.baidu.com/s?wd=' },
    { id: 'bing', name: '必应', url: 'https://www.bing.com/search?q=' },
    { id: 'google', name: '谷歌', url: 'https://www.google.com/search?q=' },
  ]), []);


  const debouncedSearch = useDebounce(searchTerm, 300);
  const isAdmin = user && user.email === ADMIN_EMAIL;
  
  // 网站信息内容 (来自用户要求)
  const ABOUT_CONTENT = `关于第一象限 极速导航网

【站点功能】

本站致力于提供一个简洁、快速、纯粹的网址导航服务。我们精心筛选了常用、高效和高质量的网站链接，并将它们按类别清晰展示，旨在成为您日常网络冲浪的起点站。
【创设初衷：拒绝广告】
在信息爆炸的时代，许多导航网站充斥着干扰性的广告和推广内容，严重影响了用户体验和访问速度。第一象限 创建本站的初衷正是为了提供一个零广告、零干扰的净土。我们承诺，本站将永久保持简洁干净，只专注于网址导航这一核心功能。
【作者】
由 第一象限 独立设计与开发。
联系邮箱:${ADMIN_EMAIL}`;

  const DISCLAIMER_CONTENT = `免责声明

1. 内容准确性

本网站（第一象限 极速导航网）所提供的所有链接信息均来源于互联网公开信息或用户提交。本站会尽力确保信息的准确性和时效性，但不对信息的完整性、准确性、时效性或可靠性作任何形式的明示或暗示的担保。
2. 外部链接责任
本站提供的所有外部网站链接（包括但不限于导航网站、资源链接等）仅为方便用户访问而设置。本站对任何链接到的第三方网站的内容、政策、产品或服务不承担任何法律责任。用户点击并访问外部链接时，即表示自行承担由此产生的一切风险。
3. 法律法规遵守
用户在使用本站服务时，须承诺遵守当地所有适用的法律法规。任何用户利用本站从事违反法律法规的行为，均与本站无关，本站不承担任何法律责任。
4. 图标与版权声明
本站网址图标有些因为网络原因、技术缺陷，可能导致图标显示不准确。如果涉及侵权，请联系作者删除。作者邮箱：${ADMIN_EMAIL}
使用本网站即表示您已阅读、理解并同意本声明的所有内容。`;
  
  // 认证和数据加载
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        const isNew = localStorage.getItem(`first_time_${session.user.id}`) === null;
        if (isNew) {
            setShowWelcome(true);
            localStorage.setItem(`first_time_${session.user.id}`, 'true');
        }
      } else {
        setUser(null);
        setViewMode('public');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchPublicNav();
        setPublicNav(data);
      } catch (e) {
        console.error('加载公共导航失败，使用默认数据:', e);
        setPublicNav(DEFAULT_PUBLIC_NAV);
      } finally {
        setLoading(false);
      }
    };
    
    if (loading) {
      loadData();
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setUserNav([]);
      return;
    }

    const loadData = async () => {
      try {
        const data = await fetchUserNav(user.id);
        if (data.length === 0) {
            setUserNav([{
                id: Date.now(), 
                user_id: user.id,
                category: '我的收藏',
                sort_order: 1,
                links: []
            }]);
        } else {
            setUserNav(data);
        }
        
      } catch (e) {
        console.error('加载用户导航失败:', e);
        setUserNav([]); 
      }
    };

    loadData();
  }, [user]);
  
  // 核心保存函数
  const handleSavePublicNav = async () => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      await savePublicNavToDB(publicNav);
      alert('✅ 公共导航保存成功！正在刷新数据...');
      const updatedNav = await fetchPublicNav();
      setPublicNav(updatedNav);
      setShowAdminPanel(false);
    } catch (e) {
      alert('❌ 保存公共导航失败。请检查 Supabase RPC 函数和管理员权限。');
      console.error('保存公共导航失败:', e);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const handleSaveUserNav = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await saveUserNavToDB(user.id, userNav);
      alert('✅ 我的导航保存成功！正在刷新数据...');
      const updatedNav = await fetchUserNav(user.id);
      setUserNav(updatedNav);
      setShowUserPanel(false);
    } catch (e) {
      alert('❌ 保存我的导航失败。请检查 Supabase RPC 函数和用户权限。');
      console.error('保存我的导航失败:', e);
      throw e; 
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setViewMode('public');
  };

  // 站外搜索提交函数
  const handleSearchSubmit = (e) => {
      e.preventDefault();
      if (!searchTerm.trim()) return;

      if (searchMode !== 'internal') {
          const engine = searchEngines.find(e => e.id === searchMode);
          if (engine) {
              window.open(engine.url + encodeURIComponent(searchTerm), '_blank');
          }
      }
      // 站内搜索由 debouncedSearch 状态自动触发 PublicNav 过滤
  };

  // 处理链接卡片点击，弹出操作菜单 (实现 App 悬浮功能)
  const handleLinkClick = useCallback((link) => {
    setSelectedLink(link);
  }, []);
  
  // 处理浮动菜单中的编辑操作
  const handleLinkEditFromModal = (link) => {
      setSelectedLink(null); // 关闭模态框
      // 这里的逻辑比较粗略，目的是通知用户去管理面板
      alert(`请前往 "${viewMode === 'user' ? '我的导航' : '公共导航'}" 的管理面板中，找到链接 "${link.name}" 并进行编辑。`);
      
      if (viewMode === 'user' && user) {
          setShowUserPanel(true);
      } else if (viewMode === 'public' && isAdmin) {
          setShowAdminPanel(true);
      }
  }

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowAuth(false);
        setShowAdminPanel(false);
        setShowUserPanel(false);
        setShowAboutModal(false); 
        setShowDisclaimerModal(false); 
        setSelectedLink(null); // 关闭链接操作模态框
      }
      if (e.metaKey || e.ctrlKey) {
        if (e.key === 'k') {
          e.preventDefault();
          const searchInput = document.getElementById('searchInput');
          if (searchInput) searchInput.focus();
        } else if (e.key === 'a' && isAdmin) {
          e.preventDefault();
          setShowAdminPanel(true);
        } else if (e.key === 'u' && user) {
          e.preventDefault();
          setShowUserPanel(true);
        }
      }
      if (e.key === '/' && !e.target.matches('input, textarea')) {
        e.preventDefault();
        document.getElementById('searchInput')?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAdmin, user]);
  
  // 渲染逻辑
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-[#0b1020] text-gray-900 dark:text-white">
      {/* 顶部导航栏 */}
      <header className="sticky top-0 z-40 bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 py-4">
          
          {/* 顶行：居中标题和用户操作 */}
          <div className="flex items-center justify-between">
            <div className="w-1/3"></div> 
            
            {/* 居中标题 */}
            <div className="text-center flex-1 min-w-0">
              <h1 className="text-3xl font-extrabold whitespace-nowrap" style={{ color: '#6A5ACD' }}>
                极速导航网
              </h1>
            </div>
            
            {/* 右侧：用户操作 */}
            <div className="flex items-center gap-3 w-1/3 justify-end">
              
              {!user ? (
                <button 
                  onClick={() => setShowAuth(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 whitespace-nowrap"
                >
                  登录/注册
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 dark:text-gray-300 hidden lg:inline truncate max-w-[100px]">
                    {user.email}
                  </span>
                  {/* 管理员和用户管理按钮已移至右下角悬浮 */}
                  <button
                    onClick={handleLogout}
                    className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700"
                    title="退出登录"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 第二行：全宽搜索框和选择器 */}
          <form onSubmit={handleSearchSubmit} className="mt-4 flex gap-2 w-full">
              
              {/* 模式选择器 */}
              <select
                  value={searchMode}
                  onChange={(e) => {
                      setSearchMode(e.target.value);
                      if (e.target.value !== 'internal') {
                          setSearchTerm(''); 
                      }
                  }}
                  className="p-2 border rounded-l-full dark:bg-gray-700 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500"
              >
                  {searchEngines.map(engine => (
                      <option key={engine.id} value={engine.id}>
                          {engine.name}
                      </option>
                  ))}
              </select>

              {/* 搜索输入框 - ✅ 搜索框背景色已加深 (bg-gray-200) */}
              <input
                  id="searchInput"
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={searchMode === 'internal' ? '搜索站内链接... (按 / 聚焦)' : `使用 ${searchEngines.find(e => e.id === searchMode)?.name || ''} 搜索...`}
                  className="flex-1 px-4 py-2 rounded-r-full border bg-gray-200 dark:bg-gray-700 dark:border-gray-600"
              />
              
              {/* 提交按钮（对站外搜索有效） */}
              {searchMode !== 'internal' && (
                  <button type="submit" className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 flex items-center justify-center">
                      <Search className="w-5 h-5" />
                  </button>
              )}
          </form>

        </div>
      </header>

      {/* 视图切换按钮（用户登录时显示） */}
      {user && (
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('public')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${viewMode === 'public' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 dark:text-gray-300'}`}
            >
              <Settings className="w-4 h-4 inline mr-2" /> 公共导航
            </button>
            <button
              onClick={() => setViewMode('user')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${viewMode === 'user' ? 'bg-green-600 text-white' : 'bg-gray-200 dark:bg-gray-700 dark:text-gray-300'}`}
            >
              <User className="w-4 h-4 inline mr-2" /> 我的导航
            </button>
          </div>
        </div>
      )}

      {/* 主内容区 */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center py-20 text-gray-500 dark:text-gray-400">
            <Search className="w-8 h-8 mx-auto animate-spin mb-2" /> 正在加载导航数据...
          </div>
        ) : (
          <PublicNav 
            navData={user && viewMode === 'user' ? userNav : publicNav} 
            searchTerm={searchMode === 'internal' ? debouncedSearch : ''} 
            user={user} 
            viewMode={viewMode}
            onLinkClick={handleLinkClick} // 传递链接点击处理函数
          />
        )}
      </main>

      {/* ✅ 右下角悬浮管理按钮 (Floating Action Buttons) */}
      <div className="fixed bottom-6 right-6 flex flex-col items-end space-y-3 z-50">
        
        {/* 1. 管理公共导航 (仅管理员可见) */}
        {isAdmin && (
          <button
            onClick={() => { setShowAdminPanel(true); setShowUserPanel(false); }}
            className="p-4 bg-purple-600 text-white rounded-full shadow-lg hover:bg-purple-700 transition transform hover:scale-105"
            title="管理公共导航 (Ctrl+A)"
          >
            <Settings className="w-6 h-6" />
          </button>
        )}

        {/* 2. 管理我的导航 (仅登录用户可见) */}
        {user && (
          <button
            onClick={() => { setShowUserPanel(true); setShowAdminPanel(false); }}
            className="p-4 bg-green-600 text-white rounded-full shadow-lg hover:bg-green-700 transition transform hover:scale-105"
            title="管理我的导航 (Ctrl+U)"
          >
            <User className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* 模态框 */}
      {showAuth && (<AuthModal onClose={() => setShowAuth(false)} onLogin={(u) => { setUser(u); setShowAuth(false); }}/>)}
      {showAdminPanel && isAdmin && (
        <AdminPanel 
          navData={publicNav} 
          setNavData={setPublicNav} 
          onSave={handleSavePublicNav} 
          onClose={() => setShowAdminPanel(false)} 
        />
      )}
      {showUserPanel && user && (
        <UserPanel 
          user={user} 
          userNav={userNav} 
          setUserNav={setUserNav} 
          onSave={handleSaveUserNav} 
          onClose={() => setShowUserPanel(false)} 
        />
      )}
      {showWelcome && (<WelcomeModal onClose={() => setShowWelcome(false)} />)}
      
      {/* 信息模态框 */}
      {showAboutModal && (
        <InfoModal
          title="关于本站"
          content={ABOUT_CONTENT}
          onClose={() => setShowAboutModal(false)}
        />
      )}
      {showDisclaimerModal && (
        <InfoModal
          title="免责声明"
          content={DISCLAIMER_CONTENT}
          onClose={() => setShowDisclaimerModal(false)}
        />
      )}

      {/* ✅ 链接操作浮动模态框 (实现手机 App 悬浮功能) */}
      {selectedLink && (
        <LinkActionModal
          link={selectedLink}
          user={user}
          isUserNav={viewMode === 'user'}
          onClose={() => setSelectedLink(null)}
          onEdit={handleLinkEditFromModal}
        />
      )}

      {/* 页尾 */}
      <footer className="mt-12 border-t border-gray-200 dark:border-gray-700 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center space-y-3">
          
          {/* 顶行：标题和版权 */}
          <h4 className="text-3xl font-extrabold" style={{ color: '#6A5ACD' }}>
            第一象限
          </h4>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            &copy; {new Date().getFullYear()} 极速导航网. 保留所有权利.
          </p>

          {/* 中行：运行天数 */}
          <p className="text-base text-gray-500 dark:text-gray-400 font-medium flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            本站已稳定运行 <span className="mx-1 font-bold text-blue-600 dark:text-blue-400">{runningDays}</span> 天
          </p>

          {/* 底行：链接和图标 */}
          <div className="flex items-center justify-center text-base text-gray-500 dark:text-gray-400 pt-2">
            {/* 链接改为按钮并打开模态框 */}
            <button onClick={() => setShowAboutModal(true)} className="hover:text-blue-500 mx-2">关于本站</button>
            <span className="text-gray-300 dark:text-gray-600">|</span>
            <button onClick={() => setShowDisclaimerModal(true)} className="hover:text-blue-500 mx-2">免责声明</button>
            <span className="text-gray-300 dark:text-gray-600 ml-4 mr-2">|</span>
            
            {/* GitHub Icon - 链接已更新 */}
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" title="GitHub 仓库" className="hover:text-blue-500 mx-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.8a4 4 0 0 0-.8-2.5c2.7-.4 5.5-1.4 5.5-6s-1.8-4-5.5-4a7.4 7.4 0 0 0-1.8.2.6.6 0 0 1-.3-.3c-.2-.5-.8-2.6-1-3.2-.3-1-.9-1-1.3-.8-.4 0-1 .2-1.3.8-.2.6-.8 2.7-1 3.2a.6.6 0 0 1-.3.3 7.4 7.4 0 0 0-1.8-.2c-3.7 0-5.5 1.5-5.5 4s1.8 5.6 5.5 6a4 4 0 0 0-.8 2.5V22"></path></svg>
            </a>
            
            {/* Globe Icon - 链接已更新 */}
            <a href="https://adcwwvux.eu-central-1.clawcloudrun.com/" target="_blank" rel="noopener noreferrer" title="其他站点" className="hover:text-blue-500 mx-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path><path d="M2 12h20"></path></svg>
            </a>
          </div>
        </div>
      </footer>

    </div>
  );
}