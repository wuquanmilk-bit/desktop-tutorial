// src/App.jsx
import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from './supabaseClient';
import {
  ExternalLink, X, Search, Settings
} from 'lucide-react';
import './index.css';

const ADMIN_EMAIL = '115382613@qq.com';

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

function safeIconUrl(url) {
  if (!url) return null;
  try {
    const u = new URL(url);
    return `https://icons.duckduckgo.com/ip3/${u.hostname}.ico`;
  } catch {
    return null;
  }
}

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
          <h2 className="text-2xl font-bold mb-4">{cat.category}</h2>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {(cat.links || []).map(link => <LinkCard key={link.id || link.url} link={link} />)}
          </div>
        </section>
      ))}
    </div>
  );
};
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
          <h3 className="text-2xl font-bold text-gray-800 dark:text-white"><Settings className="mr-2" /> 管理员面板</h3>
        </div>

        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded mb-4">
          <input className="w-full p-3 rounded border mb-3 dark:bg-gray-600" placeholder="分类名称" value={newCategory.category} onChange={(e) => setNewCategory({ ...newCategory, category: e.target.value })} />
          <input type="number" className="w-32 p-3 rounded border mb-3 dark:bg-gray-600" value={newCategory.sort_order} onChange={(e) => setNewCategory({ ...newCategory, sort_order: parseInt(e.target.value || '0') })} />
          <div className="mb-3">
            <h4 className="font-medium mb-2">链接</h4>
            <LinkForm links={newCategory.links} setLinks={(links) => setNewCategory({ ...newCategory, links })} />
          </div>
          <button onClick={handleAdd} className="px-4 py-2 bg-blue-600 text-white rounded">{loading ? '保存中...' : '保存分类'}</button>
        </div>
      </div>
    </div>
  );
};

const LoginModal = ({ onClose, onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
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

export default function App() {
  const [navData, setNavData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState('home');
  const [showLogin, setShowLogin] = useState(false);
  const [user, setUser] = useState(null);
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  useEffect(() => {
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

  useEffect(() => {
    const load = async () => {
      try {
        const { data, error } = await supabase.from('nav_categories').select().order('sort_order', { ascending: true });
        if (error) throw error;
        setNavData(data || DEFAULT_NAV_DATA);
      } catch (e) {
        console.error('加载数据失败，使用默认数据', e);
        setNavData(DEFAULT_NAV_DATA);
      }
    };
    load();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

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
        <PublicNav navData={navData} searchTerm={searchTerm} />
        {isAdmin && showAdminPanel && <AdminPanel navData={navData} setNavData={setNavData} />}
      </>
    );
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
            <div className="hidden md:block w-[420px]">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="搜索链接、描述或网址..."
                className="w-full px-3 py-2 rounded-full border bg-white dark:bg-gray-700 dark:border-gray-600"
              />
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
