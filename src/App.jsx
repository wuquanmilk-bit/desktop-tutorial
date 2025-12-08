// src/App.jsx
import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from './supabaseClient';
import { ExternalLink, X, Search, Settings } from 'lucide-react';
import './index.css';

const ADMIN_EMAIL = '115382613@qq.com';
const CACHE_KEY = 'nav-cache-v1';
const DEFAULT_NAV_DATA = [];
const SITE_START_DATE = new Date('2023-04-10'); // 上线日期

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
      {!src || err ? <ExternalLink className="w-5 h-5 text-blue-500" /> : <img src={src} alt={link.name} className="w-6 h-6 object-contain" onError={() => setErr(true)} />}
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

  if (!filtered.length) {
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

const Panel = ({ navData, setNavData, user, isAdmin }) => {
  const [newCategory, setNewCategory] = useState({ category: '', sort_order: 0, links: [] });
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    if (!newCategory.category.trim()) { alert('请输入分类名'); return; }
    setLoading(true);
    try {
      const payload = {
        category: newCategory.category,
        sort_order: newCategory.sort_order || 0,
        links: newCategory.links || [],
        user_id: isAdmin ? null : user.id
      };
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

  const updateCategory = async (idx, updatedCat) => {
    try {
      const { data, error } = await supabase.from('nav_categories').update(updatedCat).eq('id', updatedCat.id).select().single();
      if (error) throw error;
      const arr = [...navData];
      arr[idx] = data;
      setNavData(arr);
    } catch (e) {
      alert('更新失败: ' + (e?.message || e));
    }
  };

  const deleteCategory = async (idx, cat) => {
    if (!window.confirm('确定删除该分类吗？')) return;
    try {
      const { error } = await supabase.from('nav_categories').delete().eq('id', cat.id);
      if (error) throw error;
      setNavData(navData.filter((_, i) => i !== idx));
    } catch (e) {
      alert('删除失败: ' + (e?.message || e));
    }
  };

  return (
    <div className="mt-8">
      <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-2xl font-bold text-gray-800 dark:text-white"><Settings className="mr-2" /> {isAdmin ? '管理员面板' : '用户面板'}</h3>
        </div>

        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded mb-4">
          <input className="w-full p-3 rounded border mb-3 dark:bg-gray-600" placeholder="分类名称" value={newCategory.category} onChange={e => setNewCategory({ ...newCategory, category: e.target.value })} />
          <input type="number" className="w-32 p-3 rounded border mb-3 dark:bg-gray-600" value={newCategory.sort_order} onChange={e => setNewCategory({ ...newCategory, sort_order: parseInt(e.target.value || '0') })} />
          <div className="mb-3">
            <h4 className="font-medium mb-2">链接</h4>
            <LinkForm links={newCategory.links} setLinks={links => setNewCategory({ ...newCategory, links })} />
          </div>
          <button onClick={handleAdd} className="px-4 py-2 bg-blue-600 text-white rounded">{loading ? '保存中...' : '保存分类'}</button>
        </div>

        {navData.map((cat, idx) => (
          <div key={cat.id} className="mb-4 p-4 bg-white dark:bg-gray-700 rounded border">
            <div className="flex justify-between items-center mb-2">
              <input value={cat.category} onChange={e => updateCategory(idx, { ...cat, category: e.target.value })} className="border p-2 rounded w-60 dark:bg-gray-600" />
              <button onClick={() => deleteCategory(idx, cat)} className="px-2 py-1 bg-red-600 text-white rounded">删</button>
            </div>
            <LinkForm links={cat.links} setLinks={links => updateCategory(idx, { ...cat, links })} />
          </div>
        ))}
      </div>
    </div>
  );
};

const Footer = ({ setCurrentPage }) => {
  const year = new Date().getFullYear();
  const runningDays = Math.floor((new Date() - SITE_START_DATE) / (1000 * 60 * 60 * 24));
  return (
    <footer className="mt-12 py-8">
      <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-500">
        <div>© {year} 极速导航网 · 由 第一象限 制作 · 已运行 {runningDays} 天</div>
        <div className="mt-2">
          <button className="mr-4 hover:text-blue-600" onClick={() => setCurrentPage('about')}>关于本站</button>
          <button className="hover:text-blue-600" onClick={() => setCurrentPage('disclaimer')}>免责声明</button>
        </div>
      </div>
    </footer>
  );
};

const LoginModal = ({ onClose, onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      onLogin(data.user);
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
          <input type="email" placeholder="邮箱" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-3 border rounded dark:bg-gray-600" />
          <input type="password" placeholder="密码" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-3 border rounded dark:bg-gray-600" />
          <button type="submit" className="w-full py-2 bg-blue-600 text-white rounded">{loading ? '登录中...' : '登录'}</button>
        </form>
      </div>
    </div>
  );
};

const AboutPage = () => (
  <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg max-w-4xl mx-auto">
    <h2 className="text-2xl font-bold mb-3">关于第一象限 极速导航网</h2>
    <p className="text-gray-600 dark:text-gray-300 mb-2"><strong>【站点功能】</strong> 本站致力于提供一个<b>简洁、快速、纯粹</b>的网址导航服务。精心筛选常用、高效、高质量网站，按类别清晰展示。</p>
    <p className="text-gray-600 dark:text-gray-300 mb-2"><strong>【创设初衷：拒绝广告】</strong> 提供<b>零广告、零干扰</b>的净土。本站只专注于网址导航核心功能。</p>
    <p className="text-gray-600 dark:text-gray-300 mb-2"><strong>【作者】</strong> 第一象限独立开发，联系邮箱:115382613@qq.com</p>
  </div>
);

const DisclaimerPage = () => (
  <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg max-w-4xl mx-auto">
    <h2 className="text-2xl font-bold mb-3">免责声明</h2>
    <p className="text-gray-600 dark:text-gray-300 mb-2"><strong>1. 内容准确性</strong> 本站提供的链接均来源于公开信息或用户提交，尽力保证准确性，但不作保证。</p>
    <p className="text-gray-600 dark:text-gray-300 mb-2"><strong>2. 外部链接责任</strong> 本站不对第三方网站内容负责，用户访问风险自负。</p>
    <p className="text-gray-600 dark:text-gray-300 mb-2"><strong>3. 法律法规遵守</strong> 用户须遵守当地法律法规，本站不承担任何法律责任。</p>
    <p className="text-gray-600 dark:text-gray-300 mb-2"><strong>4. 图标与版权声明</strong> 图标可能显示不准确，如涉及侵权，请联系作者删除。邮箱：115382613@qq.com</p>
  </div>
);

export default function App() {
  const [navData, setNavData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState('home');
  const [showLogin, setShowLogin] = useState(false);
  const [user, setUser] = useState(null);
  const [showPanel, setShowPanel] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUser(data?.session?.user || null));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user || null));
    return () => sub?.subscription?.unsubscribe?.();
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const { data, error } = await supabase.from('nav_categories').select().order('sort_order', { ascending: true });
        if (error) throw error;
        setNavData(data || DEFAULT_NAV_DATA);
      } catch {
        setNavData(DEFAULT_NAV_DATA);
      }
    };
    load();
  }, []);

  const isAdmin = user?.email === ADMIN_EMAIL;
  const handleLogout = async () => { await supabase.auth.signOut(); setUser(null); setShowPanel(false); };

  const renderContent = () => {
    if (currentPage === 'about') return <AboutPage />;
    if (currentPage === 'disclaimer') return <DisclaimerPage />;
    return <>
      <PublicNav navData={navData} searchTerm={searchTerm} />
      {user && showPanel && <Panel navData={navData} setNavData={setNavData} user={user} isAdmin={isAdmin} />}
    </>;
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-[#0b1020]">
      <header className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 shadow p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white cursor-pointer" onClick={() => setCurrentPage('home')}>极速导航网</h1>
        <div className="flex gap-2">
          <input type="text" placeholder="搜索..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="p-2 border rounded dark:bg-gray-600" />
          {user ? (
            <>
              <button onClick={() => setShowPanel(!showPanel)} className="px-3 py-1 bg-green-600 text-white rounded">{showPanel ? '关闭面板' : '打开面板'}</button>
              <button onClick={handleLogout} className="px-3 py-1 bg-red-600 text-white rounded">退出</button>
            </>
          ) : (
            <button onClick={() => setShowLogin(true)} className="px-3 py-1 bg-blue-600 text-white rounded">登录</button>
          )}
        </div>
      </header>

      <main className="pt-24 px-4">{renderContent()}</main>
      <Footer setCurrentPage={setCurrentPage} />
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} onLogin={setUser} />}
    </div>
  );
}
