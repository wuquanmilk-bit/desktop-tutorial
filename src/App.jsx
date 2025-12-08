// src/App.jsx
import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from './supabaseClient';
import { ExternalLink, X, Search, Settings, Edit, Trash2, Plus, LogOut, User } from 'lucide-react';
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

function safeIconUrl(url) {
  if (!url) return null;
  try {
    const u = new URL(url);
    return `https://icons.duckduckgo.com/ip3/${u.hostname}.ico`;
  } catch {
    return null;
  }
}

// ----------------- 组件 -----------------
const LinkIcon = ({ link }) => {
  const [err, setErr] = useState(false);
  const src = link.icon || safeIconUrl(link.url);
  return (
    <div className="w-10 h-10 rounded-lg border bg-gray-50 dark:bg-gray-700 flex items-center justify-center">
      {!src || err ? (
        <ExternalLink className="w-5 h-5 text-blue-500" />
      ) : (
        <img src={src} alt={link.name} className="w-6 h-6 object-contain" onError={() => setErr(true)} />
      )}
    </div>
  );
};

const LinkCard = ({ link }) => (
  <a href={link.url} target="_blank" rel="noopener noreferrer" className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl border hover:shadow-lg transition flex gap-3">
    <LinkIcon link={link} />
    <div className="min-w-0 flex-1">
      <h3 className="text-lg font-semibold truncate dark:text-white">{link.name}</h3>
      {link.description && <p className="text-sm text-gray-500 dark:text-gray-300 truncate">{link.description}</p>}
    </div>
    <ExternalLink className="w-4 h-4 text-gray-400" />
  </a>
);

const PublicNav = ({ navData = [], searchTerm = '' }) => {
  const filtered = useMemo(() => {
    if (!searchTerm) return navData;
    const t = searchTerm.toLowerCase();
    return navData
      .map(cat => ({ 
        ...cat, 
        links: (cat.links || []).filter(l => 
          (l.name || '').toLowerCase().includes(t) || 
          (l.url || '').toLowerCase().includes(t) || 
          (l.description || '').toLowerCase().includes(t)
        ) 
      }))
      .filter(cat => (cat.links || []).length > 0);
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
    <div className="space-y-10">
      {filtered.map(cat => (
        <section key={cat.id} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">{cat.category}</h2>
            <div className="text-sm text-gray-400">{(cat.links || []).length} 个链接</div>
          </div>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {(cat.links || []).map(link => (
              <LinkCard key={link.id || link.url} link={link} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};

// 管理员面板组件
const AdminPanel = ({ navData = [], setNavData, onClose }) => {
  const [newCategory, setNewCategory] = useState({ category: '', sort_order: 0, links: [] });
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    if (!newCategory.category.trim()) { alert('请输入分类名'); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('nav_categories')
        .insert([{ 
          category: newCategory.category, 
          sort_order: newCategory.sort_order || 0, 
          links: newCategory.links || [] 
        }])
        .select()
        .single();
        
      if (error) throw error;
      setNavData(prev => [...prev, data]);
      setNewCategory({ category: '', sort_order: 0, links: [] });
    } catch (e) { 
      alert('新增失败: ' + (e?.message || e)); 
    } finally { 
      setLoading(false); 
    }
  };

  const startEdit = (cat) => setEditing({ ...cat });
  const cancelEdit = () => setEditing(null);
  
  const saveEdit = async () => {
    if (!editing) return;
    try {
      const { data, error } = await supabase
        .from('nav_categories')
        .update({ 
          category: editing.category, 
          sort_order: editing.sort_order, 
          links: editing.links 
        })
        .eq('id', editing.id)
        .select()
        .single();
        
      if (error) throw error;
      setNavData(prev => prev.map(p => p.id === data.id ? data : p));
      setEditing(null);
    } catch (e) { 
      alert('保存失败: ' + (e?.message || e)); 
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('确定删除此分类？此操作不可恢复')) return;
    try {
      const { error } = await supabase
        .from('nav_categories')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      setNavData(prev => prev.filter(c => c.id !== id));
    } catch (e) { 
      alert('删除失败: ' + (e?.message || e)); 
    }
  };

  const handleAddLink = async (categoryId, link) => {
    if (!link.name || !link.url) { alert('请输入链接名称和地址'); return; }
    
    try {
      const category = navData.find(c => c.id === categoryId);
      if (!category) return;
      
      const newLink = {
        id: `link-${Date.now()}`,
        name: link.name,
        url: link.url,
        description: link.description || '',
        icon: null
      };
      
      const updatedLinks = [...(category.links || []), newLink];
      
      const { data, error } = await supabase
        .from('nav_categories')
        .update({ links: updatedLinks })
        .eq('id', categoryId)
        .select()
        .single();
        
      if (error) throw error;
      setNavData(prev => prev.map(c => c.id === categoryId ? data : c));
    } catch (e) { 
      alert('添加链接失败: ' + (e?.message || e)); 
    }
  };

  const handleDeleteLink = async (categoryId, linkId) => {
    if (!confirm('确定删除此链接？')) return;
    
    try {
      const category = navData.find(c => c.id === categoryId);
      if (!category) return;
      
      const updatedLinks = (category.links || []).filter(l => l.id !== linkId);
      
      const { data, error } = await supabase
        .from('nav_categories')
        .update({ links: updatedLinks })
        .eq('id', categoryId)
        .select()
        .single();
        
      if (error) throw error;
      setNavData(prev => prev.map(c => c.id === categoryId ? data : c));
    } catch (e) { 
      alert('删除链接失败: ' + (e?.message || e)); 
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-6xl my-8">
        <div className="p-6 border-b flex justify-between items-center">
          <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
            <Settings className="inline mr-2" /> 管理公共导航
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {/* 新增分类表单 */}
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-6">
            <h4 className="font-semibold mb-3">新增分类</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
              <input
                className="p-2 border rounded dark:bg-gray-600"
                placeholder="分类名称"
                value={newCategory.category}
                onChange={(e) => setNewCategory({...newCategory, category: e.target.value})}
              />
              <input
                type="number"
                className="p-2 border rounded dark:bg-gray-600"
                placeholder="排序"
                value={newCategory.sort_order}
                onChange={(e) => setNewCategory({...newCategory, sort_order: parseInt(e.target.value) || 0})}
              />
              <button onClick={handleAdd} className="p-2 bg-blue-600 text-white rounded" disabled={loading}>
                {loading ? '添加中...' : '添加分类'}
              </button>
            </div>
          </div>

          {/* 分类列表 */}
          <div className="space-y-4">
            {navData.map(cat => (
              <div key={cat.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <h4 className="font-semibold text-lg">{cat.category}</h4>
                    <p className="text-sm text-gray-500">排序: {cat.sort_order} | 链接数: {(cat.links || []).length}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => startEdit(cat)} className="px-3 py-1 bg-yellow-500 text-white rounded">编辑</button>
                    <button onClick={() => handleDelete(cat.id)} className="px-3 py-1 bg-red-600 text-white rounded">删除</button>
                  </div>
                </div>

                {/* 链接列表 */}
                <div className="mb-3">
                  {(cat.links || []).map(link => (
                    <div key={link.id} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded mb-1">
                      <div className="flex items-center gap-3">
                        <LinkIcon link={link} />
                        <div>
                          <div className="font-medium">{link.name}</div>
                          <div className="text-sm text-gray-500 truncate max-w-md">{link.url}</div>
                        </div>
                      </div>
                      <button onClick={() => handleDeleteLink(cat.id, link.id)} className="px-2 py-1 bg-red-500 text-white rounded text-sm">删除</button>
                    </div>
                  ))}
                </div>

                {/* 添加链接 */}
                <AddLinkForm onAdd={(link) => handleAddLink(cat.id, link)} />
              </div>
            ))}
          </div>

          {/* 编辑分类模态框 */}
          {editing && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
                <h4 className="text-xl font-bold mb-4">编辑分类</h4>
                <input
                  className="w-full p-2 border rounded mb-3 dark:bg-gray-600"
                  value={editing.category}
                  onChange={(e) => setEditing({...editing, category: e.target.value})}
                />
                <input
                  type="number"
                  className="w-full p-2 border rounded mb-3 dark:bg-gray-600"
                  value={editing.sort_order}
                  onChange={(e) => setEditing({...editing, sort_order: parseInt(e.target.value) || 0})}
                />
                <div className="flex gap-2">
                  <button onClick={saveEdit} className="flex-1 py-2 bg-green-600 text-white rounded">保存</button>
                  <button onClick={cancelEdit} className="flex-1 py-2 border rounded">取消</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// 用户面板组件
const UserPanel = ({ user, userNav, setUserNav, onClose }) => {
  const [newCategory, setNewCategory] = useState({ category: '', sort_order: 0, links: [] });
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    if (!newCategory.category.trim()) { alert('请输入分类名'); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('nav_user_categories')
        .insert([{ 
          user_id: user.id,
          category: newCategory.category, 
          sort_order: newCategory.sort_order || 0, 
          links: newCategory.links || [] 
        }])
        .select()
        .single();
        
      if (error) throw error;
      setUserNav(prev => [...prev, data]);
      setNewCategory({ category: '', sort_order: 0, links: [] });
    } catch (e) { 
      alert('新增失败: ' + (e?.message || e)); 
    } finally { 
      setLoading(false); 
    }
  };

  const startEdit = (cat) => setEditing({ ...cat });
  const cancelEdit = () => setEditing(null);
  
  const saveEdit = async () => {
    if (!editing) return;
    try {
      const { data, error } = await supabase
        .from('nav_user_categories')
        .update({ 
          category: editing.category, 
          sort_order: editing.sort_order, 
          links: editing.links 
        })
        .eq('id', editing.id)
        .eq('user_id', user.id)
        .select()
        .single();
        
      if (error) throw error;
      setUserNav(prev => prev.map(p => p.id === data.id ? data : p));
      setEditing(null);
    } catch (e) { 
      alert('保存失败: ' + (e?.message || e)); 
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('确定删除此分类？此操作不可恢复')) return;
    try {
      const { error } = await supabase
        .from('nav_user_categories')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
        
      if (error) throw error;
      setUserNav(prev => prev.filter(c => c.id !== id));
    } catch (e) { 
      alert('删除失败: ' + (e?.message || e)); 
    }
  };

  const handleAddLink = async (categoryId, link) => {
    if (!link.name || !link.url) { alert('请输入链接名称和地址'); return; }
    
    try {
      const category = userNav.find(c => c.id === categoryId);
      if (!category) return;
      
      const newLink = {
        id: `link-${Date.now()}`,
        name: link.name,
        url: link.url,
        description: link.description || '',
        icon: null
      };
      
      const updatedLinks = [...(category.links || []), newLink];
      
      const { data, error } = await supabase
        .from('nav_user_categories')
        .update({ links: updatedLinks })
        .eq('id', categoryId)
        .eq('user_id', user.id)
        .select()
        .single();
        
      if (error) throw error;
      setUserNav(prev => prev.map(c => c.id === categoryId ? data : c));
    } catch (e) { 
      alert('添加链接失败: ' + (e?.message || e)); 
    }
  };

  const handleDeleteLink = async (categoryId, linkId) => {
    if (!confirm('确定删除此链接？')) return;
    
    try {
      const category = userNav.find(c => c.id === categoryId);
      if (!category) return;
      
      const updatedLinks = (category.links || []).filter(l => l.id !== linkId);
      
      const { data, error } = await supabase
        .from('nav_user_categories')
        .update({ links: updatedLinks })
        .eq('id', categoryId)
        .eq('user_id', user.id)
        .select()
        .single();
        
      if (error) throw error;
      setUserNav(prev => prev.map(c => c.id === categoryId ? data : c));
    } catch (e) { 
      alert('删除链接失败: ' + (e?.message || e)); 
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-6xl my-8">
        <div className="p-6 border-b flex justify-between items-center">
          <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
            <User className="inline mr-2" /> 我的导航管理
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {/* 新增分类表单 */}
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-6">
            <h4 className="font-semibold mb-3">新增分类</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
              <input
                className="p-2 border rounded dark:bg-gray-600"
                placeholder="分类名称"
                value={newCategory.category}
                onChange={(e) => setNewCategory({...newCategory, category: e.target.value})}
              />
              <input
                type="number"
                className="p-2 border rounded dark:bg-gray-600"
                placeholder="排序"
                value={newCategory.sort_order}
                onChange={(e) => setNewCategory({...newCategory, sort_order: parseInt(e.target.value) || 0})}
              />
              <button onClick={handleAdd} className="p-2 bg-blue-600 text-white rounded" disabled={loading}>
                {loading ? '添加中...' : '添加分类'}
              </button>
            </div>
          </div>

          {/* 分类列表 */}
          <div className="space-y-4">
            {userNav.map(cat => (
              <div key={cat.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <h4 className="font-semibold text-lg">{cat.category}</h4>
                    <p className="text-sm text-gray-500">排序: {cat.sort_order} | 链接数: {(cat.links || []).length}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => startEdit(cat)} className="px-3 py-1 bg-yellow-500 text-white rounded">编辑</button>
                    <button onClick={() => handleDelete(cat.id)} className="px-3 py-1 bg-red-600 text-white rounded">删除</button>
                  </div>
                </div>

                {/* 链接列表 */}
                <div className="mb-3">
                  {(cat.links || []).map(link => (
                    <div key={link.id} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded mb-1">
                      <div className="flex items-center gap-3">
                        <LinkIcon link={link} />
                        <div>
                          <div className="font-medium">{link.name}</div>
                          <div className="text-sm text-gray-500 truncate max-w-md">{link.url}</div>
                        </div>
                      </div>
                      <button onClick={() => handleDeleteLink(cat.id, link.id)} className="px-2 py-1 bg-red-500 text-white rounded text-sm">删除</button>
                    </div>
                  ))}
                </div>

                {/* 添加链接 */}
                <AddLinkForm onAdd={(link) => handleAddLink(cat.id, link)} />
              </div>
            ))}
          </div>

          {/* 编辑分类模态框 */}
          {editing && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
                <h4 className="text-xl font-bold mb-4">编辑分类</h4>
                <input
                  className="w-full p-2 border rounded mb-3 dark:bg-gray-600"
                  value={editing.category}
                  onChange={(e) => setEditing({...editing, category: e.target.value})}
                />
                <input
                  type="number"
                  className="w-full p-2 border rounded mb-3 dark:bg-gray-600"
                  value={editing.sort_order}
                  onChange={(e) => setEditing({...editing, sort_order: parseInt(e.target.value) || 0})}
                />
                <div className="flex gap-2">
                  <button onClick={saveEdit} className="flex-1 py-2 bg-green-600 text-white rounded">保存</button>
                  <button onClick={cancelEdit} className="flex-1 py-2 border rounded">取消</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// 添加链接表单组件
const AddLinkForm = ({ onAdd }) => {
  const [link, setLink] = useState({ name: '', url: '', description: '' });
  
  const handleSubmit = () => {
    if (!link.name || !link.url) {
      alert('请输入链接名称和地址');
      return;
    }
    onAdd(link);
    setLink({ name: '', url: '', description: '' });
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
      <h5 className="font-medium mb-2">添加新链接</h5>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
        <input
          className="p-2 border rounded dark:bg-gray-600"
          placeholder="链接名称"
          value={link.name}
          onChange={(e) => setLink({...link, name: e.target.value})}
        />
        <input
          className="p-2 border rounded dark:bg-gray-600"
          placeholder="链接地址"
          value={link.url}
          onChange={(e) => setLink({...link, url: e.target.value})}
        />
        <input
          className="p-2 border rounded dark:bg-gray-600"
          placeholder="描述（可选）"
          value={link.description}
          onChange={(e) => setLink({...link, description: e.target.value})}
        />
      </div>
      <button onClick={handleSubmit} className="px-3 py-1 bg-green-600 text-white rounded">添加链接</button>
    </div>
  );
};

// 登录/注册模态框
const LoginModal = ({ onClose, onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const submit = async (e) => {
    e && e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      onLogin && onLogin(data.user);
      onClose();
    } catch (err) { 
      alert('登录失败: ' + (err?.message || err)); 
    } finally { 
      setLoading(false); 
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <button onClick={onClose} className="float-right"><X /></button>
        <h3 className="text-xl font-bold mb-4">登录</h3>
        <form onSubmit={submit} className="space-y-3">
          <input type="email" className="w-full p-3 border rounded dark:bg-gray-600" placeholder="邮箱" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input type="password" className="w-full p-3 border rounded dark:bg-gray-600" placeholder="密码" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button type="submit" className="w-full py-2 bg-blue-600 text-white rounded">{loading ? '登录中...' : '登录'}</button>
        </form>
      </div>
    </div>
  );
};

const RegisterModal = ({ onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      alert('注册成功，请查收邮件并登录');
      onClose();
    } catch (err) { 
      alert('注册失败: ' + (err?.message || err)); 
    } finally { 
      setLoading(false); 
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <button onClick={onClose} className="float-right"><X /></button>
        <h3 className="text-xl font-bold mb-4">注册</h3>
        <form onSubmit={submit} className="space-y-3">
          <input type="email" className="w-full p-3 border rounded dark:bg-gray-600" placeholder="邮箱" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input type="password" className="w-full p-3 border rounded dark:bg-gray-600" placeholder="密码" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button type="submit" className="w-full py-2 bg-green-600 text-white rounded">{loading ? '注册中...' : '注册'}</button>
        </form>
      </div>
    </div>
  );
};

// ----------------- 主应用组件 -----------------
export default function App() {
  const [publicNav, setPublicNav] = useState([]);
  const [userNav, setUserNav] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 180);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [user, setUser] = useState(null);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showUserPanel, setShowUserPanel] = useState(false);
  const [loading, setLoading] = useState(false);

  const isAdmin = user?.email === ADMIN_EMAIL;

  // 初始化认证
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUser(data?.session?.user || null));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user || null));
    return () => { 
      try { 
        sub?.subscription?.unsubscribe && sub.subscription.unsubscribe(); 
      } catch (e) {} 
    };
  }, []);

  // 加载公共导航
  useEffect(() => {
    const loadPublicNav = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('nav_categories')
          .select('*')
          .order('sort_order', { ascending: true });
          
        if (error) throw error;
        setPublicNav(data || []);
      } catch (e) {
        console.error('加载公共导航失败', e);
      } finally {
        setLoading(false);
      }
    };
    loadPublicNav();
  }, []);

  // 加载用户导航
  useEffect(() => {
    if (!user) {
      setUserNav([]);
      return;
    }
    
    const loadUserNav = async () => {
      try {
        const { data, error } = await supabase
          .from('nav_user_categories')
          .select('*')
          .eq('user_id', user.id)
          .order('sort_order', { ascending: true });
          
        if (error) throw error;
        setUserNav(data || []);
      } catch (e) {
        console.error('加载用户导航失败', e);
      }
    };
    loadUserNav();
  }, [user]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setShowAdminPanel(false);
    setShowUserPanel(false);
  };

  // 键盘快捷键
  useEffect(() => {
    const fn = (e) => { 
      if (e.key === '/' && !e.target.matches('input, textarea')) { 
        e.preventDefault(); 
        document.getElementById('searchInput')?.focus(); 
      } 
    };
    window.addEventListener('keydown', fn); 
    return () => window.removeEventListener('keydown', fn);
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-[#0b1020]">
      {/* 顶部导航栏 */}
      <header className="sticky top-0 z-50 bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
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
                placeholder="搜索链接..."
                className="w-full px-3 py-2 rounded-full border bg-white dark:bg-gray-700 dark:border-gray-600"
              />
            </div>

            {/* 用户操作 */}
            {!user ? (
              <>
                <button onClick={() => setShowLogin(true)} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                  登录
                </button>
                <button onClick={() => setShowRegister(true)} className="px-4 py-2 border rounded hover:bg-gray-50 dark:hover:bg-gray-700">
                  注册
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-300 hidden sm:inline">
                  {user.email}
                </span>
                {isAdmin && (
                  <button
                    onClick={() => setShowAdminPanel(true)}
                    className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                  >
                    管理公共导航
                  </button>
                )}
                <button
                  onClick={() => setShowUserPanel(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  管理我的导航
                </button>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  <LogOut className="w-4 h-4 inline" /> 退出
                </button>
              </div>
            )}
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

      {/* 主内容区 */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">加载中...</p>
          </div>
        ) : (
          <PublicNav 
            navData={user ? (isAdmin ? publicNav : userNav) : publicNav} 
            searchTerm={debouncedSearch} 
          />
        )}
      </main>

      {/* 模态框 */}
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} onLogin={(u) => setUser(u)} />}
      {showRegister && <RegisterModal onClose={() => setShowRegister(false)} />}
      {showAdminPanel && <AdminPanel navData={publicNav} setNavData={setPublicNav} onClose={() => setShowAdminPanel(false)} />}
      {showUserPanel && <UserPanel user={user} userNav={userNav} setUserNav={setUserNav} onClose={() => setShowUserPanel(false)} />}
    </div>
  );
}