// src/App.jsx
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { supabase } from './supabaseClient';
import { ExternalLink, X, Search, Settings, Edit, Trash2 } from 'lucide-react';
import './index.css';

// ----------------- 配置 -----------------
const ADMIN_EMAIL = '115382613@qq.com'; // 请替换为你的管理员邮箱
const CACHE_KEY = 'nav-cache-v1';
const DEFAULT_NAV_DATA = [
  {
    id: 'cat-1',
    category: '常用开发',
    sort_order: 0,
    links: [
      { id: 'link-1-1', name: 'GitHub', url: 'https://github.com', description: '代码托管', icon: 'https://github.githubassets.com/favicons/favicon.png' },
      { id: 'link-1-2', name: 'Supabase', url: 'https://supabase.com', description: '后端即服务', icon: 'https://supabase.com/favicon.ico' },
    ],
  }
];

// ----------------- helpers / hooks -----------------
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

function isValidUrl(v) {
  try { new URL(v); return true; } catch { return false; }
}

// ----------------- small components -----------------
const LinkIcon = React.memo(({ link }) => {
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
});

const LinkCard = React.memo(({ link }) => (
  <a href={link.url} target="_blank" rel="noopener noreferrer" className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl border hover:shadow-lg transition flex gap-3">
    <LinkIcon link={link} />
    <div className="min-w-0 flex-1">
      <h3 className="text-lg font-semibold truncate dark:text-white">{link.name}</h3>
      {link.description && <p className="text-sm text-gray-500 dark:text-gray-300 truncate">{link.description}</p>}
    </div>
    <ExternalLink className="w-4 h-4 text-gray-400" />
  </a>
));

const LinkForm = ({ links = [], setLinks }) => {
  const add = () => setLinks([...links, { id: `l-${Date.now()}`, name: '', url: '', description: '' }]);
  const update = (i, k, v) => { const arr = [...links]; arr[i] = { ...arr[i], [k]: v }; setLinks(arr); };
  const remove = (i) => setLinks(links.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-2">
      {links.map((l, i) => (
        <div key={l.id} className="flex gap-2 items-center">
          <input value={l.name} onChange={e => update(i, 'name', e.target.value)} placeholder="名称" className="border p-2 rounded w-28 dark:bg-gray-600" />
          <input value={l.url} onChange={e => update(i, 'url', e.target.value)} placeholder="链接" className="border p-2 rounded flex-1 dark:bg-gray-600" />
          <input value={l.description} onChange={e => update(i, 'description', e.target.value)} placeholder="描述" className="border p-2 rounded w-40 dark:bg-gray-600" />
          <button onClick={() => remove(i)} className="px-2 py-1 bg-red-600 text-white rounded">删</button>
        </div>
      ))}
      <button onClick={add} className="px-3 py-1 bg-blue-600 text-white rounded">+ 新增链接</button>
    </div>
  );
};

const PublicNav = ({ navData = [], searchTerm = '' }) => {
  const filtered = useMemo(() => {
    if (!searchTerm) return navData;
    const t = searchTerm.toLowerCase();
    return navData
      .map(cat => ({ ...cat, links: (cat.links || []).filter(l => (l.name || '').toLowerCase().includes(t) || (l.url || '').toLowerCase().includes(t) || (l.description || '').toLowerCase().includes(t)) }))
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
            {(cat.links || []).map(link => <LinkCard key={link.id || link.url} link={link} />)}
          </div>
        </section>
      ))}
    </div>
  );
};

// Admin panel (global categories)
const AdminPanel = ({ navData = [], setNavData }) => {
  const [newCategory, setNewCategory] = useState({ category: '', sort_order: 0, links: [] });
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(null);

  const handleAdd = async () => {
    if (!newCategory.category.trim()) { alert('请输入分类名'); return; }
    setLoading(true);
    try {
      const payload = { category: newCategory.category, sort_order: newCategory.sort_order || 0, links: newCategory.links || [] };
      const { data, error } = await supabase.from('nav_categories').insert([payload]).select().single();
      if (error) throw error;
      setNavData(prev => [...prev, data]);
      setNewCategory({ category: '', sort_order: 0, links: [] });
      localStorage.setItem(CACHE_KEY, JSON.stringify([...navData, data]));
    } catch (e) { alert('新增失败: ' + (e?.message || e)); } finally { setLoading(false); }
  };

  const startEdit = (cat) => setEditing({ ...cat });
  const cancelEdit = () => setEditing(null);
  const saveEdit = async () => {
    if (!editing) return;
    try {
      const { data, error } = await supabase.from('nav_categories').update({ category: editing.category, sort_order: editing.sort_order, links: editing.links }).eq('id', editing.id).select().single();
      if (error) throw error;
      setNavData(prev => prev.map(p => p.id === data.id ? data : p));
      localStorage.setItem(CACHE_KEY, JSON.stringify(navData.map(p => p.id === data.id ? data : p)));
      setEditing(null);
    } catch (e) { alert('保存失败: ' + (e?.message || e)); }
  };

  const handleDelete = async (id) => {
    if (!confirm('确定删除此分类？此操作不可恢复')) return;
    try {
      const { error } = await supabase.from('nav_categories').delete().eq('id', id);
      if (error) throw error;
      setNavData(prev => prev.filter(c => c.id !== id));
      localStorage.setItem(CACHE_KEY, JSON.stringify(navData.filter(c => c.id !== id)));
    } catch (e) { alert('删除失败: ' + (e?.message || e)); }
  };

  return (
    <div className="mt-8">
      <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-2xl font-bold text-gray-800 dark:text-white"><Settings className="mr-2 inline" /> 管理员面板</h3>
          <div className="text-sm text-gray-500">支持新增 / 编辑 / 删除分类</div>
        </div>

        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded mb-4">
          <input className="w-full p-3 rounded border mb-3 dark:bg-gray-600" placeholder="分类名称" value={newCategory.category} onChange={(e) => setNewCategory({ ...newCategory, category: e.target.value })} />
          <input type="number" className="w-32 p-3 rounded border mb-3 dark:bg-gray-600" value={newCategory.sort_order} onChange={(e) => setNewCategory({ ...newCategory, sort_order: parseInt(e.target.value || '0') })} />
          <div className="mb-3">
            <h4 className="font-medium mb-2">链接</h4>
            <LinkForm links={newCategory.links} setLinks={(links) => setNewCategory({ ...newCategory, links })} />
          </div>
          <button onClick={handleAdd} className="px-4 py-2 bg-blue-600 text-white rounded mr-2">{loading ? '保存中...' : '保存分类'}</button>
        </div>

        <div className="space-y-4">
          {navData.map(cat => (
            <div key={cat.id} className="p-3 bg-white dark:bg-gray-800 rounded border flex items-center justify-between">
              <div>
                <div className="font-medium">{cat.category}</div>
                <div className="text-sm text-gray-400">{(cat.links || []).length} 个链接 · 排序 {cat.sort_order}</div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => startEdit(cat)} className="px-3 py-1 bg-yellow-500 text-white rounded flex items-center gap-2"><Edit className="w-4 h-4" /> 编辑</button>
                <button onClick={() => handleDelete(cat.id)} className="px-3 py-1 bg-red-600 text-white rounded flex items-center gap-2"><Trash2 className="w-4 h-4" /> 删除</button>
              </div>
            </div>
          ))}
        </div>

        {editing && (
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded">
            <h4 className="font-semibold mb-2">编辑分类</h4>
            <input className="w-full p-3 rounded border mb-3 dark:bg-gray-600" value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })} />
            <input type="number" className="w-32 p-3 rounded border mb-3 dark:bg-gray-600" value={editing.sort_order} onChange={(e) => setEditing({ ...editing, sort_order: parseInt(e.target.value || '0') })} />
            <div className="mb-3">
              <h4 className="font-medium mb-2">链接</h4>
              <LinkForm links={editing.links || []} setLinks={(links) => setEditing({ ...editing, links })} />
            </div>
            <div className="flex gap-2">
              <button onClick={saveEdit} className="px-3 py-1 bg-green-600 text-white rounded">保存</button>
              <button onClick={cancelEdit} className="px-3 py-1 border rounded">取消</button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

// ----------------- UserPanel (与管理员面板功能一致) -----------------
const UserPanel = ({ user, userNav, setUserNav }) => {
  const [newCategory, setNewCategory] = useState({ category: '', sort_order: 0, links: [] });
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadUserNav = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('nav_user_categories')
        .select('id, category, sort_order, nav_user_links(*)')
        .eq('user_id', user.id)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      const normalized = (data || []).map(c => ({ id: c.id, category: c.category, sort_order: c.sort_order, links: c.nav_user_links || [] }));
      setUserNav(normalized);
    } catch (e) { console.error('加载用户导航失败', e); }
  };

  useEffect(() => { loadUserNav(); }, [user]);

  const handleAddCategory = async () => {
    if (!newCategory.category.trim()) { alert('请输入分类名'); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase.from('nav_user_categories')
        .insert([{ user_id: user.id, category: newCategory.category, sort_order: newCategory.sort_order }])
        .select().single();
      if (error) throw error;
      setUserNav(prev => [...prev, { ...data, links: newCategory.links || [] }]);
      setNewCategory({ category: '', sort_order: 0, links: [] });
    } catch (e) { alert('新增失败: ' + (e?.message || e)); } finally { setLoading(false); }
  };

  const startEdit = (cat) => setEditing({ ...cat });
  const cancelEdit = () => setEditing(null);
  const saveEdit = async () => {
    if (!editing) return;
    try {
      const { data, error } = await supabase.from('nav_user_categories')
        .update({ category: editing.category, sort_order: editing.sort_order, links: editing.links })
        .eq('id', editing.id).eq('user_id', user.id).select().single();
      if (error) throw error;
      setUserNav(prev => prev.map(p => p.id === data.id ? data : p));
      setEditing(null);
    } catch (e) { alert('保存失败: ' + (e?.message || e)); }
  };

  const deleteCategory = async (id) => {
    if (!confirm('确定删除此分类？此操作不可恢复')) return;
    try {
      const { error } = await supabase.from('nav_user_categories').delete().eq('id', id).eq('user_id', user.id);
      if (error) throw error;
      setUserNav(prev => prev.filter(c => c.id !== id));
    } catch (e) { alert('删除失败: ' + (e?.message || e)); }
  };

  const addLink = async (categoryId, link) => {
    if (!link.name || !link.url) { alert('名称和链接为必填'); return; }
    if (!isValidUrl(link.url)) { if (!confirm('链接格式看起来不对，仍要保存？')) return; }
    try {
      const { data, error } = await supabase.from('nav_user_links')
        .insert([{ category_id: categoryId, user_id: user.id, name: link.name, url: link.url, description: link.description || '', icon: link.icon || null }])
        .select().single();
      if (error) throw error;
      setUserNav(prev => prev.map(c => c.id === categoryId ? { ...c, links: [...(c.links||[]), data] } : c));
    } catch (e) { alert('新增链接失败: ' + (e?.message || e)); }
  };

  const deleteLink = async (linkId) => {
    if (!confirm('确定删除此链接？')) return;
    try {
      const { error } = await supabase.from('nav_user_links').delete().eq('id', linkId).eq('user_id', user.id);
      if (error) throw error;
      setUserNav(prev => prev.map(c => ({ ...c, links: (c.links || []).filter(l => l.id !== linkId) })));
    } catch (e) { alert('删除链接失败: ' + (e?.message || e)); }
  };

  const updateLink = async (linkId, updates) => {
    try {
      const { data, error } = await supabase.from('nav_user_links').update(updates).eq('id', linkId).eq('user_id', user.id).select().single();
      if (error) throw error;
      setUserNav(prev => prev.map(c => ({ ...c, links: (c.links || []).map(l => l.id === data.id ? data : l) })));
    } catch (e) { alert('更新链接失败: ' + (e?.message || e)); }
  };

  return (
    <div className="mt-8">
      <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border">
        <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">我的导航管理</h3>

        {/* 新增分类 */}
        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded mb-4">
          <input className="w-full p-3 rounded border mb-2 dark:bg-gray-600" placeholder="分类名称" value={newCategory.category} onChange={e => setNewCategory({ ...newCategory, category: e.target.value })} />
          <input type="number" className="w-32 p-2 rounded border mb-2 dark:bg-gray-600" value={newCategory.sort_order} onChange={e => setNewCategory({ ...newCategory, sort_order: parseInt(e.target.value||0) })} />
          <LinkForm links={newCategory.links} setLinks={(links) => setNewCategory({ ...newCategory, links })} />
          <button onClick={handleAddCategory} className="px-4 py-2 bg-blue-600 text-white rounded">{loading ? '保存中...' : '新增分类'}</button>
        </div>

        {/* 分类列表 */}
        {userNav.map(cat => (
          <div key={cat.id} className="p-3 bg-white dark:bg-gray-800 rounded border mb-4">
            <div className="flex justify-between mb-2">
              <div>
                <div className="font-medium">{cat.category}</div>
                <div className="text-sm text-gray-400">{(cat.links||[]).length} 个链接 · 排序 {cat.sort_order}</div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => startEdit(cat)} className="px-3 py-1 bg-yellow-500 text-white rounded flex items-center gap-2"><Edit className="w-4 h-4" /> 编辑</button>
                <button onClick={() => deleteCategory(cat.id)} className="px-3 py-1 bg-red-600 text-white rounded flex items-center gap-2"><Trash2 className="w-4 h-4" /> 删除</button>
              </div>
            </div>

            {/* 链接列表 */}
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {cat.links.map(link => (
                <div key={link.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <LinkIcon link={link} />
                    <div>
                      <input value={link.name} onChange={e => updateLink(link.id, { name: e.target.value })} className="font-medium w-28 p-1 rounded border dark:bg-gray-600" />
                      <input value={link.url} onChange={e => updateLink(link.id, { url: e.target.value })} className="text-sm text-gray-400 w-52 p-1 rounded border dark:bg-gray-600" />
                      <input value={link.description} onChange={e => updateLink(link.id, { description: e.target.value })} className="text-sm text-gray-400 w-52 p-1 rounded border dark:bg-gray-600" />
                    </div>
                  </div>
                  <button onClick={() => deleteLink(link.id)} className="px-2 py-1 bg-red-500 text-white rounded">删除</button>
                </div>
              ))}
            </div>

            {/* 编辑分类 */}
            {editing?.id === cat.id && (
              <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded">
                <input className="w-full p-2 rounded border mb-2 dark:bg-gray-600" value={editing.category} onChange={e => setEditing({ ...editing, category: e.target.value })} />
                <input type="number" className="w-32 p-2 rounded border mb-2 dark:bg-gray-600" value={editing.sort_order} onChange={e => setEditing({ ...editing, sort_order: parseInt(e.target.value||0) })} />
                <LinkForm links={editing.links || []} setLinks={(links) => setEditing({ ...editing, links })} />
                <div className="flex gap-2">
                  <button onClick={saveEdit} className="px-3 py-1 bg-green-600 text-white rounded">保存</button>
                  <button onClick={cancelEdit} className="px-3 py-1 border rounded">取消</button>
                </div>
              </div>
            )}

          </div>
        ))}

      </div>
    </div>
  );
};


// AddLinkForm 内置组件
const AddLinkForm = ({ onAdd }) => {
  const [link, setLink] = useState({ name: '', url: '', description: '' });
  return (
    <div className="space-y-2">
      <input value={link.name} onChange={e => setLink({ ...link, name: e.target.value })} placeholder="名称" className="w-full p-2 rounded border dark:bg-gray-600" />
      <input value={link.url} onChange={e => setLink({ ...link, url: e.target.value })} placeholder="链接" className="w-full p-2 rounded border dark:bg-gray-600" />
      <input value={link.description} onChange={e => setLink({ ...link, description: e.target.value })} placeholder="描述" className="w-full p-2 rounded border dark:bg-gray-600" />
      <div className="flex gap-2">
        <button onClick={() => { onAdd(link); setLink({ name: '', url: '', description: '' }); }} className="px-3 py-1 bg-blue-600 text-white rounded">新增</button>
      </div>
    </div>
  );
};

// Login / Register Modals
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
    } catch (err) { alert('登录失败: ' + (err?.message || err)); } finally { setLoading(false); }
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
    } catch (err) { alert('注册失败: ' + (err?.message || err)); } finally { setLoading(false); }
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

const Footer = ({ setCurrentPage }) => {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-12 py-8">
      <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-500">
        <div>© {year} 极速导航网 · 由 第一象限 制作</div>
        <div className="mt-2">
          <button className="mr-4 hover:text-blue-600" onClick={() => setCurrentPage('about')}>关于</button>
          <button className="hover:text-blue-600" onClick={() => setCurrentPage('disclaimer')}>免责声明</button>
        </div>
      </div>
    </footer>
  );
};

const ExternalSearchBar = ({ keyword }) => {
  if (!keyword || !keyword.trim()) return null;
  const engines = [
    { name: 'Google', url: `https://www.google.com/search?q=${encodeURIComponent(keyword)}` },
    { name: 'Bing', url: `https://www.bing.com/search?q=${encodeURIComponent(keyword)}` },
    { name: '百度', url: `https://www.baidu.com/s?wd=${encodeURIComponent(keyword)}` },
  ];
  return (
    <div className="mt-2 flex gap-2 flex-wrap">
      {engines.map((e) => (
        <a key={e.name} href={e.url} target="_blank" rel="noopener noreferrer" className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition">使用 {e.name} 搜索 “{keyword}”</a>
      ))}
    </div>
  );
};

// ----------------- App -----------------
export default function App() {
  const [publicNav, setPublicNav] = useState([]);
  const [userNav, setUserNav] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 180);
  const [currentPage, setCurrentPage] = useState('home');
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [user, setUser] = useState(null);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showUserPanel, setShowUserPanel] = useState(false);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUser(data?.session?.user || null));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user || null));
    return () => { try { sub?.subscription?.unsubscribe && sub.subscription.unsubscribe(); } catch (e) {} };
  }, []);

  const isAdmin = user?.email === ADMIN_EMAIL;

  useEffect(() => {
    // load public nav (cached)
    const load = async () => {
      setLoadingData(true);
      const cache = localStorage.getItem(CACHE_KEY);
      if (cache) {
        try { setPublicNav(JSON.parse(cache)); } catch { setPublicNav(DEFAULT_NAV_DATA); }
      }
      try {
        const { data, error } = await supabase.from('nav_categories').select().order('sort_order', { ascending: true });
        if (error) throw error;
        setPublicNav(data || DEFAULT_NAV_DATA);
        localStorage.setItem(CACHE_KEY, JSON.stringify(data || DEFAULT_NAV_DATA));
      } catch (e) {
        console.error('加载公共导航失败', e);
        if (!cache) setPublicNav(DEFAULT_NAV_DATA);
      } finally { setLoadingData(false); }
    };
    load();
  }, []);

  const handleLogout = async () => { await supabase.auth.signOut(); setUser(null); setShowUserPanel(false); };

  // keyboard: '/' focus search
  useEffect(() => {
    const fn = (e) => { if (e.key === '/') { e.preventDefault(); document.querySelector('#searchInput')?.focus(); } };
    window.addEventListener('keydown', fn); return () => window.removeEventListener('keydown', fn);
  }, []);

  const renderContent = () => {
    if (currentPage === 'about') return (
      <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold mb-3">关于本站</h2>
        <p className="text-gray-600 dark:text-gray-300">极速导航 — 简洁、无广告的网址导航站。</p>
      </div>
    );
    if (currentPage === 'disclaimer') return (
      <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold mb-3">免责声明</h2>
        <p className="text-gray-600 dark:text-gray-300">本站不对外部链接内容负责。</p>
      </div>
    );

    // 未登录显示公共导航；登录显示用户导航（如用户无数据则提示）
    if (user) {
      return (
        <>
          {!userNav || userNav.length === 0 ? (
            <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow">你的导航为空，点击“我的导航”进行添加。</div>
          ) : (
            <PublicNav navData={userNav} searchTerm={debouncedSearch} />
          )}
          {showUserPanel && <UserPanel user={user} userNav={userNav} setUserNav={setUserNav} />}
        </>
      );
    }

    return (
      <>
        {loadingData && (<div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900 rounded">正在加载数据...</div>)}
        <PublicNav navData={publicNav} searchTerm={debouncedSearch} />
        {isAdmin && showAdminPanel && <AdminPanel navData={publicNav} setNavData={setPublicNav} />}
      </>
    );
  };

  // when user logs in, load their nav
  useEffect(() => {
    if (!user) { setUserNav([]); return; }
    const loadUser = async () => {
      try {
        const { data, error } = await supabase
          .from('nav_user_categories')
          .select('id, category, sort_order, nav_user_links(*)')
          .eq('user_id', user.id)
          .order('sort_order', { ascending: true });
        if (error) throw error;
        const normalized = (data || []).map(c => ({ id: c.id, category: c.category, sort_order: c.sort_order, links: c.nav_user_links || [] }));
        setUserNav(normalized);
      } catch (e) { console.error('加载用户导航失败', e); }
    };
    loadUser();
  }, [user]);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-[#0b1020]">
      <header className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white cursor-pointer" onClick={() => { setCurrentPage('home'); setShowUserPanel(false); }}>{'极速导航网'}</h1>
            <span className="text-sm text-gray-500 dark:text-gray-300 hidden sm:inline">你的快速入口</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:block w-[420px] relative">
              <input id="searchInput" type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="搜索链接、描述或网址... (按 / 聚焦)" className="w-full px-3 py-2 rounded-full border bg-white dark:bg-gray-700 dark:border-gray-600" />
              <ExternalSearchBar keyword={searchTerm} />
            </div>

            {!user ? (
              <>
                <button onClick={() => setShowLogin(true)} className="px-3 py-2 bg-blue-600 text-white rounded">登录</button>
                <button onClick={() => setShowRegister(true)} className="px-3 py-2 border rounded">注册</button>
              </>
            ) : (
              <>
                <button onClick={() => setShowUserPanel(!showUserPanel)} className="px-3 py-2 border rounded">我的导航</button>
                {isAdmin && <button onClick={() => setShowAdminPanel(!showAdminPanel)} className="px-3 py-2 bg-purple-600 text-white rounded">管理员</button>}
                <button onClick={handleLogout} className="px-3 py-2 bg-red-500 text-white rounded">退出</button>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="h-20" />

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="md:hidden mb-4">
          <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="搜索链接..." className="w-full px-3 py-2 rounded-full border bg-white dark:bg-gray-700 dark:border-gray-600" />
          <ExternalSearchBar keyword={searchTerm} />
        </div>

        <div className="space-y-6">{renderContent()}</div>

        <Footer setCurrentPage={setCurrentPage} />
      </main>

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} onLogin={(u) => { setUser(u); setShowLogin(false); }} />}
      {showRegister && <RegisterModal onClose={() => setShowRegister(false)} />}
    </div>
  );
}

// End
