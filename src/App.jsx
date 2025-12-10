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

// 链接图标组件 (已修改：使用 Favicon API 和名称首字母回退)
const LinkIcon = ({ link }) => {
  const [err, setErr] = useState(false);
  
  // 使用 Favicon API 获取图标
  const domain = useMemo(() => {
        try {
            return new URL(link.url).hostname;
        } catch (e) {
            return '';
        }
    }, [link.url]);

    // 使用 Google Favicon API 获取图标
    const faviconUrl = domain 
        ? `https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${encodeURIComponent(link.url)}&size=32`
        : null;
    
  // 逻辑: 尝试加载 FaviconUrl，失败则显示名称首字母或默认图标
  
  if (!faviconUrl || err) {
       // 默认文字图标 (回退)
      return (
          <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-lg font-bold text-gray-600 dark:text-gray-300 flex-shrink-0">
              {link.name ? link.name.substring(0, 1).toUpperCase() : <ExternalLink className="w-5 h-5 text-blue-500" />}
          </div>
      );
  }
  
  return (
    <div className="w-10 h-10 rounded-lg border bg-gray-50 dark:bg-gray-700 flex items-center justify-center flex-shrink-0 overflow-hidden">
        <img 
          src={faviconUrl} 
          alt={`${link.name} icon`} 
          className="w-6 h-6 object-contain" 
          onError={() => setErr(true)} // 加载失败时触发回退逻辑
        />
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
// UserPanel (用户面板组件) - 已添加退出登录
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
          await onSave(); 
      } catch (e) {
          console.error("保存失败:", e);
      } finally {
          setLoading(false);
      }
  };

  // ========== 退出登录处理函数 ==========
  const handleLogout = async () => {
      if (confirm('确定要退出登录吗？')) {
          setLoading(true);
          try {
              const { error } = await supabase.auth.signOut();
              if (error) throw error;
              onClose(); // 关闭面板
          } catch (e) {
              alert('退出登录失败: ' + e.message);
              setLoading(false);
          }
      }
  };
  // ======================================


  return (
    <div className="fixed inset-0 bg-black/60 flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-6xl my-8">
        {/* 标题 - 添加了保存按钮 */}
        {/* 修复: 增加 pt-8 填充以避免状态栏遮挡 */}
        <div className="p-6 border-b flex justify-between items-center pt-8"> 
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
          {/* 用户信息 */}
          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg mb-6 border border-blue-200 dark:border-blue-800">
            <h4 className="font-semibold mb-1">当前用户：{user.email}</h4>
            <p className="text-sm text-blue-600 dark:text-blue-300">
                用户 ID: {user.id.substring(0, 8)}...
            </p>
          </div>
          
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
          
          {/* ========== 退出登录按钮 ========== */}
          <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                  onClick={handleLogout}
                  className={`w-full py-3 flex items-center justify-center bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors ${loading ? 'opacity-50' : ''}`}
                  disabled={loading}
              >
                  <LogOut className="w-5 h-5 mr-2 transform rotate-180" />
                  {loading ? '退出中...' : '退出登录'}
              </button>
          </div>
          {/* ================================== */}
          
        </div>
      </div>
    </div>
  );
};

// ====================================================================
// AuthModal, WelcomeModal, InfoModal, LinkActionModal (认证、欢迎、信息和链接操作组件)
// ====================================================================

const AuthModal = ({ onClose, onLogin }) => {
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        setIsSuccess(false);

        try {
            if (isSignUp) {
                const { data, error } = await supabase.auth.signUp({ email, password });
                if (error) throw error;
                setMessage('注册成功！请检查您的邮箱进行确认。');
                setIsSuccess(true);
            } else {
                const { data: { user }, error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
                onLogin(user); // 登录成功
            }
        } catch (error) {
            console.error(error);
            setMessage(error.message || '操作失败，请重试。');
            setIsSuccess(false);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm my-8">
                <div className="p-6 border-b flex justify-between items-center">
                    <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
                        {isSignUp ? '注册' : '登录'}
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="email"
                            placeholder="邮箱"
                            className="w-full p-3 pl-10 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white outline-none focus:ring-blue-500 focus:border-blue-500"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="password"
                            placeholder="密码"
                            className="w-full p-3 pl-10 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white outline-none focus:ring-blue-500 focus:border-blue-500"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    {message && (
                        <p className={`text-sm ${isSuccess ? 'text-green-500' : 'text-red-500'}`}>{message}</p>
                    )}

                    <button
                        type="submit"
                        className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                        disabled={loading}
                    >
                        {loading ? '加载中...' : isSignUp ? '注册' : '登录'}
                    </button>

                    <button
                        type="button"
                        onClick={() => setIsSignUp(!isSignUp)}
                        className="w-full text-sm text-blue-500 hover:text-blue-600 mt-3"
                    >
                        {isSignUp ? '已有账户？去登录' : '没有账户？去注册'}
                    </button>
                </form>
            </div>
        </div>
    );
};


const WelcomeModal = ({ onClose }) => {
    const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md my-8">
                <div className="p-6 border-b flex justify-between items-center">
                    <h3 className="text-2xl font-bold text-gray-800 dark:text-white">欢迎使用极速导航网！</h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="p-6 space-y-4 text-gray-700 dark:text-gray-300">
                    <p>这是一个极简、高效的导航站点。</p>
                    <p className="font-semibold">功能亮点：</p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                        <li><span className="font-medium">公共导航</span>：精选常用链接，无需登录即可使用。</li>
                        <li><span className="font-medium">我的导航</span>：<User className="inline w-4 h-4 mr-1"/> 登录后可自定义您的专属导航链接。</li>
                        <li><span className="font-medium">搜索增强</span>：支持站内链接搜索，也可快速切换到百度、Google 等站外搜索。</li>
                        <li><span className="font-medium">管理员模式</span>：管理员邮箱 ({ADMIN_EMAIL}) 登录后可编辑公共导航。</li>
                        <li><span className="font-medium">适配手机端</span>：针对移动设备优化了显示和操作体验。</li>
                    </ul>
                    <p>感谢您的使用！</p>
                </div>
                <div className="p-4 border-t flex justify-end">
                    <button onClick={onClose} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">立即体验</button>
                </div>
            </div>
        </div>
    );
};

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
                        className="flex items-center justify-center w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                    >
                        <ExternalLink className="w-5 h-5 mr-2" /> 立即访问
                    </a>

                    {/* 2. 编辑操作 (如果可编辑) */}
                    {canEdit && (
                        <button
                            onClick={() => {
                                onClose();
                                onEdit(link); // 触发编辑
                            }}
                            className="flex items-center justify-center w-full py-3 bg-yellow-500 text-white rounded-lg font-semibold hover:bg-yellow-600 transition-colors"
                        >
                            <Edit className="w-5 h-5 mr-2" /> 编辑链接
                        </button>
                    )}

                    {/* 3. 取消 */}
                    <button
                        onClick={onClose}
                        className="flex items-center justify-center w-full py-3 border rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                        取消
                    </button>
                </div>
            </div>
        </div>
    );
};


// ====================================================================
// App (主应用组件)
// ====================================================================
function App() {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [publicNav, setPublicNav] = useState(DEFAULT_PUBLIC_NAV);
  const [userNav, setUserNav] = useState([]);
  const [viewMode, setViewMode] = useState('public'); // 'public' | 'user'
  const [isDarkMode, setIsDarkMode] = useState(window.matchMedia('(prefers-color-scheme: dark)').matches);
  
  // 模态框和面板状态
  const [showAuth, setShowAuth] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showUserPanel, setShowUserPanel] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [infoContent, setInfoContent] = useState({ title: '', content: '' });
  const [showLinkAction, setShowLinkAction] = useState(false); // 手机端链接操作模态框
  const [selectedLink, setSelectedLink] = useState(null);

  // 搜索状态
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [searchMode, setSearchMode] = useState('internal'); // 'internal' | 'google' | 'baidu' | 'bing'

  const appStartDate = '2024-01-01'; // 应用启动日期
  const runningDays = useRunningDays(appStartDate);
  
  const isAdmin = user && user.email === ADMIN_EMAIL;
  
  const searchEngines = useMemo(() => [
    { id: 'internal', name: '站内' },
    { id: 'google', name: 'Google' },
    { id: 'baidu', name: '百度' },
    { id: 'bing', name: 'Bing' },
  ], []);

  // 1. 初始化和会话监听
  useEffect(() => {
    // 监听主题变化
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => setIsDarkMode(e.matches);
    mediaQuery.addEventListener('change', handler);

    // 监听 Supabase 会话
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        // 自动切换到我的导航
        setViewMode('user');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (event === 'SIGNED_IN' && session?.user) {
          // 登录后自动切换到我的导航
          setViewMode('user');
        } else if (event === 'SIGNED_OUT') {
          // 登出后切换回公共导航
          setViewMode('public');
        }
      }
    );

    // 检查是否首次访问
    const hasVisited = localStorage.getItem('hasVisited');
    if (!hasVisited) {
        setShowWelcome(true);
        localStorage.setItem('hasVisited', 'true');
    }

    return () => {
        subscription.unsubscribe();
        mediaQuery.removeEventListener('change', handler);
    };
  }, []);

  // 2. 数据加载
  const loadNavData = useCallback(async () => {
    try {
      const publicData = await fetchPublicNav();
      setPublicNav(publicData);
    } catch (e) {
      console.error("加载公共导航失败:", e);
      setPublicNav(DEFAULT_PUBLIC_NAV);
    }
    
    if (user?.id) {
      try {
        const userData = await fetchUserNav(user.id);
        setUserNav(userData);
      } catch (e) {
        console.error("加载用户导航失败:", e);
        setUserNav([]);
      }
    }
  }, [user]);

  useEffect(() => {
    loadNavData();
  }, [loadNavData, user]);

  // 3. 动作函数

  const handleOpenPanel = () => {
      if (isAdmin) {
          setShowAdminPanel(true);
      } else if (user) {
          setShowUserPanel(true);
      } else {
          setShowAuth(true); // 未登录则显示登录/注册
      }
  };

  const handleViewModeToggle = () => {
    setViewMode(prev => prev === 'public' ? 'user' : 'public');
  };

  const handleLinkClick = (link) => {
    setSelectedLink(link);
    setShowLinkAction(true);
  };
  
  const handleEditLink = (link) => {
      // 公共导航编辑逻辑 (仅管理员可见)
      if (viewMode === 'public' && isAdmin) {
          // 由于 AdminPanel 不支持直接编辑，这里仅展示逻辑，实际操作在 AdminPanel 中进行
          // 为简化，我们直接打开 AdminPanel，并在面板中寻找和编辑
          setShowAdminPanel(true);
      } 
      // 用户导航编辑逻辑
      else if (viewMode === 'user' && user) {
          // 由于 UserPanel 不支持直接编辑，这里仅展示逻辑，实际操作在 UserPanel 中进行
          setShowUserPanel(true);
      }
      // 这里的逻辑可以根据实际需求，弹出一个 LinkForm，但需要知道它属于哪个分类
  }

  const handleSavePublicNav = async () => {
      try {
          await savePublicNavToDB(publicNav);
          alert('公共导航保存成功！');
          setShowAdminPanel(false);
      } catch (e) {
          alert('公共导航保存失败: ' + e.message);
      }
  };

  const handleSaveUserNav = async () => {
      if (!user) return;
      try {
          await saveUserNavToDB(user.id, userNav);
          alert('我的导航保存成功！');
          setShowUserPanel(false);
      } catch (e) {
          alert('我的导航保存失败: ' + e.message);
      }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchMode !== 'internal' && searchTerm) {
        let url = '';
        switch (searchMode) {
            case 'google':
                url = `https://www.google.com/search?q=${encodeURIComponent(searchTerm)}`;
                break;
            case 'baidu':
                url = `https://www.baidu.com/s?wd=${encodeURIComponent(searchTerm)}`;
                break;
            case 'bing':
                url = `https://www.bing.com/search?q=${encodeURIComponent(searchTerm)}`;
                break;
            default:
                return;
        }
        window.open(url, '_blank');
        setSearchTerm(''); // 清空搜索框
    }
    // 站内搜索会自动通过 debouncedSearch 触发过滤
  };

  const handleShowDisclaimer = () => {
      setInfoContent({ 
          title: "免责声明", 
          content: "本站提供的所有外部链接，旨在方便用户快速访问，其内容均由第三方网站提供。本站不对这些外部链接内容的准确性、完整性、合法性或可靠性承担任何责任。用户在访问这些外部链接时，应自行承担风险。任何通过本站链接所产生的法律责任和经济损失，均与本站无关。" 
      });
      setShowInfo(true);
  };
  
  const handleShowAbout = () => {
      setInfoContent({
          title: "关于本站",
          content: `极速导航网 (V${runningDays}.0) 是一个致力于提供极简、高效导航体验的个人项目。\n\n- 运行天数: ${runningDays} 天\n- 技术栈: React, Tailwind CSS, Supabase\n- 目标: 成为您的私人导航助手，实现一键直达，高效办公。\n\n感谢所有支持和使用本站的朋友！`
      });
      setShowInfo(true);
  };

  // 4. 键盘快捷键 (用于快速聚焦搜索框)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === '/' && searchMode === 'internal') {
        e.preventDefault();
        document.getElementById('searchInput')?.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [searchMode]);


  // 5. 渲染部分

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark bg-gray-900 text-white' : 'bg-white text-gray-800'}`}>
        
        {/* 顶部固定 Header */}
        <header className="fixed top-0 left-0 right-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 z-10 shadow-md">
            <div className="max-w-7xl mx-auto px-4 py-3">
                
                {/* 第一行：标题、设置和 VIEWMODE 选择器 */}
                <div className="flex justify-between items-center w-full">
                    {/* 标题 - 居左，确保不被登录按钮遮挡 */}
                    <h1 
                        className="text-2xl font-bold text-gray-900 dark:text-white cursor-pointer"
                        onClick={() => {
                            if (viewMode !== 'public') setViewMode('public');
                        }}
                    >
                        极速导航网
                    </h1>
                    
                    {/* 右侧设置和视图模式切换 */}
                    <div className="flex items-center space-x-3">
                        {/* 视图模式切换 (仅登录用户可见) */}
                        {user && (
                            <button 
                                onClick={handleViewModeToggle}
                                title={viewMode === 'public' ? '切换到我的导航' : '切换到公共导航'}
                                className="p-2 rounded-full text-sm bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
                            >
                                {viewMode === 'public' ? '公共' : '我的'}
                            </button>
                        )}

                        {/* 设置按钮 */}
                        <button 
                            onClick={handleOpenPanel}
                            title={isAdmin ? '管理公共导航' : user ? '我的导航设置' : '登录/注册'}
                            className="p-2 rounded-full text-gray-600 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-500 transition-colors"
                        >
                            <Settings className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* 第二行：搜索框和选择器 */}
                {/* 新增容器以限制搜索框最大宽度并居中 (max-w-4xl) */}
                <div className="max-w-4xl mx-auto"> 
                    {/* 移除 w-full 属性，增大 gap 间距 (gap-4) */}
                    <form onSubmit={handleSearchSubmit} className="mt-4 flex gap-4">
                        
                        {/* 模式选择器 */}
                        <select
                            value={searchMode}
                            onChange={(e) => {
                                setSearchMode(e.target.value);
                                if (e.target.value !== 'internal') {
                                    setSearchTerm(''); // 切换到站外搜索时，清空站内搜索的过滤结果
                                }
                            }}
                            // 样式调整：圆形，深邃靛蓝/星空色
                            className="p-3 border rounded-full bg-gray-100 dark:bg-indigo-900 dark:border-indigo-800 focus:ring-blue-500 focus:border-blue-500 text-black dark:text-white appearance-none outline-none"
                        >
                            {searchEngines.map(engine => (
                                <option key={engine.id} value={engine.id}>
                                    {engine.name}
                                </option>
                            ))}
                        </select>

                        {/* 搜索输入框 */}
                        <input
                            id="searchInput"
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder={searchMode === 'internal' ? '搜索站内链接... (按 / 聚焦)' : `使用 ${searchEngines.find(e => e.id === searchMode)?.name || ''} 搜索...`}
                            // 样式调整：圆形，更深的星空色
                            className="flex-1 px-4 py-3 rounded-full border bg-gray-100 dark:bg-indigo-950 dark:border-indigo-800 dark:text-white outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                        
                        {/* 提交按钮（对站外搜索有效） */}
                        {searchMode !== 'internal' && (
                            <button 
                                type="submit" 
                                // 样式调整：保持圆形独立按钮
                                className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 flex items-center justify-center flex-shrink-0"
                            >
                                <Search className="w-5 h-5" />
                            </button>
                        )}
                    </form>
                </div>
            </div>
        </header>

        {/* ============================================== */}
        {/* 右下方悬浮登录/用户按钮 (FIXED) */}
        {/* ============================================== */}
        <button
            onClick={() => user ? setShowUserPanel(true) : setShowAuth(true)}
            title={user ? '我的账户/设置' : '登录/注册'}
            // 固定定位，右下角悬浮
            className="fixed bottom-6 right-6 p-4 rounded-full bg-blue-600 text-white shadow-xl hover:bg-blue-700 z-50 transition-transform transform hover:scale-105"
        >
            {/* LogOut 旋转 180 度作为登录图标 */}
            {user ? <User className="w-6 h-6" /> : <LogOut className="w-6 h-6 transform rotate-180" />}
        </button>

        {/* 内容区，需要为固定头部留出空间 */}
        <main className="max-w-7xl mx-auto pt-40 px-4 pb-12"> 

        {searchMode === 'internal' && (
          <PublicNav 
            navData={user && viewMode === 'user' ? userNav : publicNav} 
            searchTerm={searchMode === 'internal' ? debouncedSearch : ''} 
            user={user}
            viewMode={viewMode}
            onLinkClick={handleLinkClick}
          />
        )}
      </main>

      {/* 模态框 */}
      {showAuth && (<AuthModal onClose={() => setShowAuth(false)} onLogin={(u) => { setUser(u); setShowAuth(false); }}/>)}
      {showAdminPanel && isAdmin && (
        <AdminPanel 
          navData={publicNav} 
          setNavData={setPublicNav} 
          onSave={handleSavePublicNav} // 传递公共导航保存函数
          onClose={() => setShowAdminPanel(false)} 
        />
      )}
      {showUserPanel && user && (
        <UserPanel 
          user={user} 
          userNav={userNav} 
          setUserNav={setUserNav} 
          onSave={handleSaveUserNav} // 传递用户导航保存函数
          onClose={() => setShowUserPanel(false)} 
        />
      )}
      {showWelcome && (<WelcomeModal onClose={() => setShowWelcome(false)} />)}
      {showInfo && (<InfoModal title={infoContent.title} content={infoContent.content} onClose={() => setShowInfo(false)} />)}
      {showLinkAction && selectedLink && (
        <LinkActionModal 
            link={selectedLink} 
            user={user} 
            onClose={() => setShowLinkAction(false)} 
            onEdit={handleEditLink}
            isUserNav={viewMode === 'user'}
        />
      )}
      
      {/* 页尾 */}
      <footer className="mt-12 border-t border-gray-200 dark:border-gray-700 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>&copy; {new Date().getFullYear()} 极速导航网. All rights reserved. | Powered by Supabase</p>
          <div className="flex justify-center items-center mt-2">
            <button onClick={handleShowAbout} className="hover:text-blue-500 mx-2">关于本站</button>
            <span className="text-gray-300 dark:text-gray-600 ml-4 mr-2">|</span>
            <button onClick={handleShowDisclaimer} className="hover:text-blue-500 mx-2">免责声明</button>
            <span className="text-gray-300 dark:text-gray-600 ml-4 mr-2">|</span>
            
            {/* GitHub Icon - 链接已更新 */}
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" title="GitHub 仓库" className="hover:text-blue-500 mx-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.8a4 4 0 0 0-.8-2.5c2.7-.4 5.5-1.4 5.5-6s-1.8-4-5.5-4a7.4 7.4 0 0 0-1.8.2.6.6 0 0 1-.3-.3c-.2-.5-.8-2.6-1-3.2-.3-1-.9-1-1.3-.8-.4 0-1 .2-1.3.8-.2.6-.8 2.7-1 3.2a.6.6 0 0 1-.3.3 7.4 7.4 0 0 0-1.8-.2c-3.7 0-5.5 2-5.5 6s2.8 5.6 5.5 6a4 4 0 0 0 .8 2.5V22"/></svg>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;