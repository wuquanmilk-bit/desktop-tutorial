// src/App.jsx
import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from './supabaseClient';
import { ExternalLink, X, Search, Settings, Edit, Trash2, Plus, LogOut, User, Grid, Home } from 'lucide-react';
import './index.css';

// ----------------- 配置 -----------------
const ADMIN_EMAIL = '115382613@qq.com';

// ----------------- 工具函数 -----------------
function useDebounce(value, delay = 200) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

// ----------------- 默认公共导航数据 -----------------
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

// ----------------- 默认用户导航数据 -----------------
const DEFAULT_USER_NAV = [
  {
    id: 1,
    category: '我的收藏',
    sort_order: 1,
    links: [
      { id: 'user-link-1', name: '个人项目', url: 'https://github.com/your-projects', description: '我的GitHub项目' },
      { id: 'user-link-2', name: '学习笔记', url: 'https://notion.so', description: '学习笔记' }
    ]
  }
];

// ----------------- 组件 -----------------
// 链接图标组件
const LinkIcon = ({ link }) => {
  const [err, setErr] = useState(false);
  
  const getIconUrl = (url) => {
    if (!url) return null;
    try {
      const u = new URL(url);
      return `https://www.google.com/s2/favicons?domain=${u.hostname}&sz=32`;
    } catch {
      return null;
    }
  };
  
  const src = getIconUrl(link.url);
  
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

// 链接卡片组件
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
    
    const term = searchTerm.toLowerCase();
    return navData
      .map(category => ({
        ...category,
        links: (category.links || []).filter(link =>
          (link.name || '').toLowerCase().includes(term) ||
          (link.url || '').toLowerCase().includes(term) ||
          (link.description || '').toLowerCase().includes(term)
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
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{category.category}</h2>
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

// 链接表单组件（添加/编辑链接）
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
        <button 
          type="button" 
          onClick={onCancel}
          className="px-4 py-2 border rounded hover:bg-gray-100 dark:hover:bg-gray-600"
        >
          取消
        </button>
      </div>
    </form>
  );
};

// 通用导航管理面板（管理员和用户共用）
const NavManagerPanel = ({ 
  title, 
  icon: Icon, 
  navData = [], 
  setNavData, 
  onClose,
  isAdmin = false
}) => {
  const [newCategory, setNewCategory] = useState({ category: '', sort_order: 0 });
  const [editingCategory, setEditingCategory] = useState(null);
  const [addingLinkTo, setAddingLinkTo] = useState(null);
  const [editingLink, setEditingLink] = useState(null);
  const [loading, setLoading] = useState(false);

  // 添加分类
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

  // 编辑分类
  const startEditCategory = (category) => setEditingCategory({ ...category });
  const cancelEditCategory = () => setEditingCategory(null);
  
  const saveEditCategory = async () => {
    if (!editingCategory) return;
    
    try {
      setNavData(prev => 
        prev.map(cat => 
          cat.id === editingCategory.id ? editingCategory : cat
        )
      );
      setEditingCategory(null);
    } catch (e) {
      alert('保存失败: ' + e.message);
    }
  };

  // 删除分类
  const handleDeleteCategory = async (categoryId) => {
    if (!confirm('确定删除此分类？分类下的所有链接也将被删除')) return;
    
    try {
      setNavData(prev => prev.filter(cat => cat.id !== categoryId));
    } catch (e) {
      alert('删除失败: ' + e.message);
    }
  };

  // 添加链接
  const handleAddLink = async (categoryId, linkData) => {
    try {
      const newLink = {
        id: `link-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        ...linkData
      };

      setNavData(prev => 
        prev.map(category => 
          category.id === categoryId 
            ? { 
                ...category, 
                links: [...(category.links || []), newLink] 
              }
            : category
        )
      );
      setAddingLinkTo(null);
    } catch (e) {
      alert('添加链接失败: ' + e.message);
    }
  };

  // 编辑链接
  const startEditLink = (categoryId, link) => setEditingLink({ categoryId, ...link });
  const cancelEditLink = () => setEditingLink(null);
  
  const saveEditLink = async (linkData) => {
    if (!editingLink) return;
    
    try {
      setNavData(prev => 
        prev.map(category => 
          category.id === editingLink.categoryId
            ? {
                ...category,
                links: (category.links || []).map(link =>
                  link.id === editingLink.id ? { ...link, ...linkData } : link
                )
              }
            : category
        )
      );
      setEditingLink(null);
    } catch (e) {
      alert('保存链接失败: ' + e.message);
    }
  };

  // 删除链接
  const handleDeleteLink = async (categoryId, linkId) => {
    if (!confirm('确定删除此链接？')) return;
    
    try {
      setNavData(prev => 
        prev.map(category => 
          category.id === categoryId
            ? {
                ...category,
                links: (category.links || []).filter(link => link.id !== linkId)
              }
            : category
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
            <Icon className="inline mr-2" /> {title}
          </h3>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
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
          <div className="space-y-6">
            {navData.map(category => (
              <div key={category.id} className="border rounded-lg p-4">
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
                      className="px-3 py-1 bg-green-600 text-white rounded flex items-center gap-1 hover:bg-green-700"
                    >
                      <Plus className="w-4 h-4" /> 添加链接
                    </button>
                    <button 
                      onClick={() => startEditCategory(category)}
                      className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                    >
                      编辑分类
                    </button>
                    <button 
                      onClick={() => handleDeleteCategory(category.id)}
                      className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      删除分类
                    </button>
                  </div>
                </div>

                {/* 添加链接表单 */}
                {addingLinkTo === category.id && (
                  <LinkForm
                    onSave={(linkData) => handleAddLink(category.id, linkData)}
                    onCancel={() => setAddingLinkTo(null)}
                    mode="add"
                  />
                )}

                {/* 链接列表 */}
                <div className="space-y-2">
                  {(category.links || []).map(link => (
                    <div key={link.id}>
                      {editingLink && editingLink.id === link.id ? (
                        // 编辑链接模式
                        <LinkForm
                          initialData={editingLink}
                          onSave={saveEditLink}
                          onCancel={cancelEditLink}
                          mode="edit"
                        />
                      ) : (
                        // 显示链接模式
                        <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded flex justify-between items-center">
                          <div className="flex items-center gap-3 flex-1">
                            <LinkIcon link={link} />
                            <div className="flex-1">
                              <div className="font-medium">{link.name}</div>
                              <div className="text-sm text-gray-500 truncate max-w-md">{link.url}</div>
                              {link.description && (
                                <div className="text-sm text-gray-400">{link.description}</div>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => startEditLink(category.id, link)}
                              className="px-2 py-1 bg-yellow-500 text-white rounded text-sm hover:bg-yellow-600"
                            >
                              编辑
                            </button>
                            <button 
                              onClick={() => handleDeleteLink(category.id, link.id)}
                              className="px-2 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                            >
                              删除
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* 空状态 */}
                {(category.links || []).length === 0 && !addingLinkTo && (
                  <div className="text-center py-4 text-gray-500">
                    此分类暂无链接，点击"添加链接"按钮开始添加
                  </div>
                )}
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
                <button 
                  onClick={saveEditCategory}
                  className="flex-1 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  保存
                </button>
                <button 
                  onClick={cancelEditCategory}
                  className="flex-1 py-2 border rounded hover:bg-gray-100 dark:hover:bg-gray-600"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// 登录模态框
const LoginModal = ({ onClose, onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });
      
      if (error) throw error;
      onLogin(data.user);
      onClose();
    } catch (err) {
      alert('登录失败: ' + (err.message || err));
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
        
        <h3 className="text-xl font-bold mb-4">登录</h3>
        
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            className="w-full p-3 border rounded dark:bg-gray-600"
            placeholder="邮箱"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            className="w-full p-3 border rounded dark:bg-gray-600"
            placeholder="密码"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="submit"
            className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            {loading ? '登录中...' : '登录'}
          </button>
        </form>
      </div>
    </div>
  );
};

// ----------------- 主应用组件 -----------------
export default function App() {
  const [publicNav, setPublicNav] = useState(DEFAULT_PUBLIC_NAV);
  const [userNav, setUserNav] = useState(DEFAULT_USER_NAV);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 200);
  const [showLogin, setShowLogin] = useState(false);
  const [user, setUser] = useState(null);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showUserPanel, setShowUserPanel] = useState(false);
  const [viewMode, setViewMode] = useState('public'); // 'public' 或 'user'

  const isAdmin = user?.email === ADMIN_EMAIL;

  // 初始化认证状态
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data?.session?.user || null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 处理退出登录
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

  // 当前显示的导航数据
  const currentNavData = useMemo(() => {
    if (!user) return publicNav;
    if (viewMode === 'public') return publicNav;
    if (viewMode === 'user') return userNav;
    return publicNav;
  }, [user, viewMode, publicNav, userNav]);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-[#0b1020]">
      {/* 顶部导航栏 */}
      <header className="sticky top-0 z-40 bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  setViewMode('public');
                  setShowAdminPanel(false);
                  setShowUserPanel(false);
                }}
                className="flex items-center gap-2"
              >
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                  极速导航
                </h1>
              </button>
              <span className="text-sm text-gray-500 dark:text-gray-300 hidden sm:inline">
                你的快速入口
              </span>
            </div>

            <div className="flex items-center gap-3">
              {/* 搜索框 */}
              <div className="hidden md:block w-80">
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
                <button 
                  onClick={() => setShowLogin(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  登录
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  {/* 视图切换按钮 */}
                  <div className="flex border rounded overflow-hidden">
                    <button
                      onClick={() => setViewMode('public')}
                      className={`px-3 py-1 flex items-center gap-1 ${viewMode === 'public' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700'}`}
                    >
                      <Home className="w-4 h-4" />
                      <span className="hidden sm:inline">公共</span>
                    </button>
                    <button
                      onClick={() => setViewMode('user')}
                      className={`px-3 py-1 flex items-center gap-1 ${viewMode === 'user' ? 'bg-green-600 text-white' : 'bg-gray-100 dark:bg-gray-700'}`}
                    >
                      <User className="w-4 h-4" />
                      <span className="hidden sm:inline">我的</span>
                    </button>
                  </div>

                  {/* 管理按钮 */}
                  {viewMode === 'public' && isAdmin && (
                    <button
                      onClick={() => {
                        setShowAdminPanel(true);
                        setShowUserPanel(false);
                      }}
                      className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                    >
                      <Settings className="w-4 h-4 inline mr-1" />
                      管理公共
                    </button>
                  )}
                  
                  {viewMode === 'user' && (
                    <button
                      onClick={() => {
                        setShowUserPanel(true);
                        setShowAdminPanel(false);
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      <Edit className="w-4 h-4 inline mr-1" />
                      管理我的
                    </button>
                  )}

                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    {user.email}
                  </span>
                  
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

      {/* 移动端搜索框和视图切换 */}
      <div className="md:hidden p-4">
        <div className="mb-3 flex border rounded overflow-hidden">
          {user && (
            <>
              <button
                onClick={() => setViewMode('public')}
                className={`flex-1 py-2 flex items-center justify-center gap-1 ${viewMode === 'public' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700'}`}
              >
                <Home className="w-4 h-4" />
                <span>公共</span>
              </button>
              <button
                onClick={() => setViewMode('user')}
                className={`flex-1 py-2 flex items-center justify-center gap-1 ${viewMode === 'user' ? 'bg-green-600 text-white' : 'bg-gray-100 dark:bg-gray-700'}`}
              >
                <User className="w-4 h-4" />
                <span>我的</span>
              </button>
            </>
          )}
        </div>
        
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="搜索链接..."
          className="w-full px-3 py-2 rounded-full border bg-white dark:bg-gray-700 dark:border-gray-600"
        />
      </div>

      {/* 主内容区 */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {!user && viewMode === 'user' ? (
          <div className="text-center py-12">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-8">
              <User className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">请先登录</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">登录后可以管理个人导航</p>
              <button
                onClick={() => setShowLogin(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                立即登录
              </button>
            </div>
          </div>
        ) : (
          <PublicNav 
            navData={currentNavData} 
            searchTerm={debouncedSearch} 
          />
        )}
      </main>

      {/* 模态框 */}
      {showLogin && (
        <LoginModal 
          onClose={() => setShowLogin(false)} 
          onLogin={(user) => {
            setUser(user);
            setViewMode('user');
          }}
        />
      )}
      
      {/* 管理员面板 */}
      {showAdminPanel && isAdmin && (
        <NavManagerPanel
          title="管理公共导航"
          icon={Settings}
          navData={publicNav}
          setNavData={setPublicNav}
          onClose={() => setShowAdminPanel(false)}
          isAdmin={true}
        />
      )}

      {/* 用户面板 */}
      {showUserPanel && user && (
        <NavManagerPanel
          title="管理我的导航"
          icon={User}
          navData={userNav}
          setNavData={setUserNav}
          onClose={() => setShowUserPanel(false)}
          isAdmin={false}
        />
      )}
    </div>
  );
}