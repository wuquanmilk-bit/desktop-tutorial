// src/App.jsx
import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { supabase } from './supabaseClient';
import {
  ExternalLink, X, Search, Settings, Edit, Trash2, RefreshCw
} from 'lucide-react';
import './index.css';

// ---------- 配置 ----------
const ADMIN_EMAIL = '115382613@qq.com';
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

// ---------- 工具 Hook / 函数 ----------
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
  try {
    /* eslint-disable no-new */
    new URL(v);
    return true;
  } catch (e) {
    return false;
  }
}

// ---------- 小组件（优化性能：memo） ----------
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

// LinkForm 用于 Admin 中编辑链接
const LinkForm = ({ links = [], setLinks }) => {
  const add = () => setLinks([...links, { id: `l-${Date.now()}`, name: '', url: '', description: '' }]);
  const update = (i, k, v) => {
    const arr = [...links];
    arr[i] = { ...arr[i], [k]: v };
    setLinks(arr);
  };
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

// 公共导航列表（带搜索过滤）
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
            {(cat.links || []).map(link => <LinkCard key={link.id || link.url} link={link} />)}
          </div>
        </section>
      ))}
    </div>
  );
};

// 管理面板（CRUD 基础）
const AdminPanel = ({ navData = [], setNavData }) => {
  const [newCategory, setNewCategory] = useState({ category: '', sort_order: 0, links: [] });
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(null); // 编辑对象

  const handleAdd = async () => {
    if (!newCategory.category.trim()) { alert('请输入分类名'); return; }
    setLoading(true);
    try {
      const payload = { category: newCategory.category, sort_order: newCategory.sort_order || 0, links: newCategory.links || [] };
      const { data, error } = await supabase.from('nav_categories').insert([payload]).select().single();
      if (error) throw error;
      setNavData(prev => [...prev, data]);
      setNewCategory({ category: '', sort_order: 0, links: [] });
      // 更新本地缓存
      localStorage.setItem(CACHE_KEY, JSON.stringify([...navData, data]));
    } catch (e) {
      alert('新增失败: ' + (e?.message || e));
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (cat) => {
    setEditing({ ...cat });
  };

  const cancelEdit = () => setEditing(null);

  const saveEdit = async () => {
    if (!editing) return;
    try {
      const { data, error } = await supabase.from('nav_categories').update({ category: editing.category, sort_order: editing.sort_order, links: editing.links }).eq('id', editing.id).select().single();
      if (error) throw error;
      setNavData(prev => prev.map(p => p.id === data.id ? data : p));
      localStorage.setItem(CACHE_KEY, JSON.stringify(navData.map(p => p.id === data.id ? data : p)));
      setEditing(null);
    } catch (e) {
      alert('保存失败: ' + (e?.message || e));
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('确定删除此分类？此操作不可恢复')) return;
    try {
      const { error } = await supabase.from('nav_categories').delete().eq('id', id);
      if (error) throw error;
      setNavData(prev => prev.filter(c => c.id !== id));
      localStorage.setItem(CACHE_KEY, JSON.stringify(navData.filter(c => c.id !== id)));
    } catch (e) {
      alert('删除失败: ' + (e?.message || e));
    }
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

// 登录 Modal（支持回车提交）
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
          <input autoFocus type="email" className="w-full p-3 border rounded dark:bg-gray-600" placeholder="邮箱" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input type="password" className="w-full p-3 border rounded dark:bg-gray-600" placeholder="密码" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') submit(e); }} />
          <button type="submit" className="w-full py-2 bg-blue-600 text-white rounded">{loading ? '登录中...' : '登录'}</button>
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

// 外部搜索按钮组件
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
        <a key={e.name} href={e.url} target="_blank" rel="noopener noreferrer" className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition">
          使用 {e.name} 搜索 “{keyword}”
        </a>
      ))}
    </div>
  );
};

// ---------- App 主组件（整合以上所有优化） ----------
export default function App() {
  const [navData, setNavData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 180);
  const [currentPage, setCurrentPage] = useState('home');
  const [showLogin, setShowLogin] = useState(false);
  const [user, setUser] = useState(null);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const searchInputRef = useRef(null);

  useEffect(() => {
    // 获取 session 并监听变更
    supabase.auth.getSession().then(({ data }) => {
      setUser(data?.session?.user || null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });
    return () => {
      try { sub?.subscription?.unsubscribe && sub.subscription.unsubscribe(); } catch(e) {}
    };
  }, []);

  const isAdmin = user?.email === ADMIN_EMAIL;

  // 加载数据（支持 localStorage 缓存 + 后台刷新）
  useEffect(() => {
    const load = async () => {
      setLoadingData(true);
      const cache = localStorage.getItem(CACHE_KEY);
      if (cache) {
        try {
          setNavData(JSON.parse(cache));
        } catch (e) {
          setNavData(DEFAULT_NAV_DATA);
        }
      }

      try {
        const { data, error } = await supabase.from('nav_categories').select().order('sort_order', { ascending: true });
        if (error) throw error;
        setNavData(data || DEFAULT_NAV_DATA);
        localStorage.setItem(CACHE_KEY, JSON.stringify(data || DEFAULT_NAV_DATA));
      } catch (e) {
        console.error('加载数据失败，使用缓存或默认数据', e);
        if (!cache) setNavData(DEFAULT_NAV_DATA);
      } finally {
        setLoadingData(false);
      }
    };
    load();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  // 顶部快捷键 / 聚焦搜索
  useEffect(() => {
    const fn = (e) => {
      if (e.key === '/') {
        const el = document.querySelector('#searchInput');
        if (el) {
          e.preventDefault();
          el.focus();
        }
      }
    };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, []);

  const renderContent = () => {
    if (currentPage === 'about') {
      return (
        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-3">关于本站</h2>
          <p className="text-gray-600 dark:text-gray-300">极速导航 — 简洁、无广告的网址导航站。</p>
        </div>
      );
    }
    if (currentPage === 'disclaimer') {
      return (
        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-3">免责声明</h2>
          <p className="text-gray-600 dark:text-gray-300">本站不对外部链接内容负责。</p>
        </div>
      );
    }

    return (
      <>
        {loadingData && (
          <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900 rounded">正在加载数据...</div>
        )}
        <PublicNav navData={navData} searchTerm={debouncedSearch} />
        {isAdmin && showAdminPanel && <AdminPanel navData={navData} setNavData={setNavData} />}
      </>
    );
  };

  // 站外搜索快捷：shift+enter 打开默认引擎（可扩展）
  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        // shift+enter -> 用谷歌打开
        const url = `https://www.google.com/search?q=${encodeURIComponent(searchTerm)}`;
        window.open(url, '_blank', 'noopener');
      } else {
        // 站内按回车，聚焦到结果 (无额外操作，因为输入会过滤)
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-[#0b1020]">
      {/* 固定顶部栏 */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white cursor-pointer" onClick={() => setCurrentPage('home')}>极速导航网</h1>
            <span className="text-sm text-gray-500 dark:text-gray-300 hidden sm:inline">你的快速入口</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:block w-[420px] relative">
              <input
                id="searchInput"
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="搜索链接、描述或网址... (按 / 聚焦，Shift+Enter 站外Google)"
                className="w-full px-3 py-2 rounded-full border bg-white dark:bg-gray-700 dark:border-gray-600"
              />
              <ExternalSearchBar keyword={searchTerm} />
            </div>

            {!user ? (
              <>
                <button onClick={() => setShowLogin(true)} className="px-3 py-2 bg-blue-600 text-white rounded">登录</button>
                <button onClick={() => alert('请使用注册流程')} className="px-3 py-2 border rounded">注册</button>
              </>
            ) : (
              <>
                {isAdmin && <button onClick={() => setShowAdminPanel(!showAdminPanel)} className="px-3 py-2 bg-purple-600 text-white rounded">管理员</button>}
                <button onClick={() => { setCurrentPage('user'); }} className="px-3 py-2 border rounded">个人中心</button>
                <button onClick={handleLogout} className="px-3 py-2 bg-red-500 text-white rounded">退出</button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 顶部占位 */}
      <div className="h-20" />

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* 小屏搜索 */}
        <div className="md:hidden mb-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="搜索链接..."
            className="w-full px-3 py-2 rounded-full border bg-white dark:bg-gray-700 dark:border-gray-600"
          />

          <ExternalSearchBar keyword={searchTerm} />
        </div>

        <div className="space-y-6">
          {renderContent()}
        </div>

        <Footer setCurrentPage={setCurrentPage} />
      </main>

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} onLogin={(u) => { setUser(u); setShowLogin(false); }} />}
    </div>
  );
}

// End of file
