// src/App.jsx
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { supabase } from './supabaseClient';
import { 
    ExternalLink, X, Search, Settings, Edit, Trash2, Plus, LogOut, User, Mail, Lock, Key, 
    LayoutGrid, Home, AlertCircle, RefreshCw, UserPlus, LogIn, Github, Globe 
} from 'lucide-react';
import './index.css';

// ====================================================================
// ⭐️ 配置
// ====================================================================
const ADMIN_EMAIL = '115382613@qq.com';
const START_DATE = '2023-11-20'; // 网站开始运行日期 (用于计算运行天数)

// ... (工具函数 useDebounce, useRunningDays 保持不变) ...

function useDebounce(value, delay = 200) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

function useRunningDays(startDateString) {
  const [runningDays, setRunningDays] = useState(0);

  useEffect(() => {
    const startDate = new Date(startDateString);
    const today = new Date();
    
    const diffTime = Math.abs(today - startDate);
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
      { id: 'link-1', name: 'GitHub', url: 'https://github.com', description: '代码托管平台', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/github/github-original.svg' },
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
// ⭐️ Supabase 数据同步函数 (保持不变)
// ====================================================================

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
        id: `link-${link.id}`, 
        category_id: cat.id
      })) 
  }));
}

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

async function saveUserNavToDB(userId, navData) {
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
    
    const { error } = await supabase.rpc('sync_my_nav', {
        p_user_id: userId, 
        categories_data: categoriesToSave,
        links_data: linksToSave
    });

    if (error) throw error;
}

// ====================================================================
// ⭐️ 新增加载组件 (保持不变)
// ====================================================================

const LoadingSpinner = () => (
    <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl shadow">
        <svg className="animate-spin h-10 w-10 text-blue-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="text-lg text-gray-600 dark:text-gray-300">数据正在加载中，请稍候...</p>
    </div>
);

// ====================================================================
// ⭐️ 核心组件 (LinkIcon, LinkCard, AuthModal 等... 保持不变)
// ====================================================================

// 链接图标组件
const LinkIcon = ({ link }) => {
  const [err, setErr] = useState(false);
  const userIconUrl = link.icon; 
  
  const domain = useMemo(() => {
        try {
            return new URL(link.url).hostname;
        } catch (e) {
            return '';
        }
    }, [link.url]);

    const faviconUrl = domain 
        ? `https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${encodeURIComponent(link.url)}&size=32`
        : null;

  const finalIconUrl = userIconUrl || faviconUrl;
  
  if (!finalIconUrl || err) {
      return (
          <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-lg font-bold text-gray-600 dark:text-gray-300 flex-shrink-0">
              {link.name ? link.name.substring(0, 1).toUpperCase() : <ExternalLink className="w-5 h-5 text-blue-500" />}
          </div>
      );
  }
  
  return (
    <div className="w-10 h-10 rounded-lg border bg-gray-50 dark:bg-gray-700 flex items-center justify-center flex-shrink-0 overflow-hidden">
        <img 
          src={finalIconUrl} 
          alt={`${link.name} icon`} 
          className="w-6 h-6 object-contain" 
          onError={() => {
            if (userIconUrl && faviconUrl && finalIconUrl === userIconUrl) {
                setErr(true); 
            } else {
                setErr(true);
            }
          }}
        />
    </div>
  );
};

// 链接卡片
const LinkCard = ({ link, onOpen }) => (
  <div 
    onClick={() => window.open(link.url, '_blank')} 
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

// 链接卡片 (编辑模式)
const EditableLinkCard = ({ link, onOpen, isAdmin, isUserNav, onEditClick, onDeleteClick }) => {
    const canEdit = (isAdmin && !isUserNav) || (isUserNav);

    return (
        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl border flex gap-3">
            <LinkIcon link={link} />
            <div className="min-w-0 flex-1">
                <h3 className="text-lg font-semibold truncate dark:text-white">{link.name}</h3>
                {link.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-300 truncate">{link.description}</p>
                )}
            </div>
            <div className="flex flex-col gap-1 flex-shrink-0">
                <a 
                    href={link.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    title="打开链接" 
                    className="p-1 text-gray-400 hover:text-blue-500"
                >
                    <ExternalLink className="w-4 h-4" />
                </a>
                {canEdit && (
                    <button onClick={() => onEditClick(link)} title="编辑" className="p-1 text-gray-400 hover:text-yellow-500">
                        <Edit className="w-4 h-4" />
                    </button>
                )}
                {canEdit && (
                    <button onClick={() => onDeleteClick(link.id)} title="删除" className="p-1 text-gray-400 hover:text-red-500">
                        <Trash2 className="w-4 h-4" />
                    </button>
                )}
            </div>
        </div>
    );
};

// 公共导航显示组件
const PublicNav = ({ navData = [], searchTerm = '', isEditing, onLinkClick }) => {
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
      // 这里的空判断应该由外部 (renderContent) 的 navLoading 状态控制
      return null;
  }

  return (
    <div className="space-y-8">
      {filtered.map(category => (
        <section key={category.id} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold dark:text-white">{category.category}</h2>
            <div className="text-sm text-gray-400">{(category.links || []).length} 个链接</div>
          </div>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {(category.links || []).map(link => (
                isEditing ? (
                    <EditableLinkCard 
                        key={link.id} 
                        link={link} 
                        isAdmin={true} 
                        isUserNav={false} 
                        onEditClick={onLinkClick.onEdit} 
                        onDeleteClick={onLinkClick.onDelete}
                    />
                ) : (
                    <LinkCard 
                        key={link.id} 
                        link={link} 
                        onOpen={() => onLinkClick.onOpen(link)} 
                    />
                )
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};

// 链接表单组件 (保持不变)
const LinkForm = ({ onSave, onCancel, initialData = null, mode = 'add' }) => {
    const [formData, setFormData] = useState({
        name: initialData?.name || '',
        url: initialData?.url || '',
        description: initialData?.description || '',
        icon: initialData?.icon || '' 
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
            <input
                type="url"
                className="w-full p-2 border rounded dark:bg-gray-600 dark:border-gray-500"
                placeholder="指定图标 URL (可选，优先使用)"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
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

// 认证模态框 (保持不变)
const AuthModal = ({ onClose, onLogin, onRegister }) => {
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
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage('注册成功！请检查您的邮箱进行确认。');
        setIsSuccess(true);
      } else {
        const { data: { user }, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        
        onLogin(user); 
        onClose(); 
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
          {message && (
            <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${isSuccess ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
              role="alert"
            >
              <AlertCircle className="w-5 h-5" />
              {message}
            </div>
          )}
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
          <button 
            type="submit" 
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
            disabled={loading}
          >
            {loading ? '处理中...' : (isSignUp ? '注册' : '登录')}
          </button>
          <button 
            type="button" 
            onClick={() => { setIsSignUp(!isSignUp); setMessage(''); }}
            className="w-full py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-500"
          >
            {isSignUp ? '已有账号？去登录' : '没有账号？去注册'}
          </button>
        </form>
      </div>
    </div>
  );
};

// ====================================================================
// ⭐️ 主应用组件
// ====================================================================

export default function App() {
  // 认证状态
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  
  // 导航数据
  const [publicNav, setPublicNav] = useState([]);
  const [userNav, setUserNav] = useState([]);

  // 视图控制
  const [viewMode, setViewMode] = useState('public'); 
  const [currentPage, setCurrentPage] = useState('home'); 
  const [isEditing, setIsEditing] = useState(false); 

  // **🚨 核心修复：加载状态**
  // 初始状态必须为 true，以确保第一次渲染时显示加载动画
  const [navLoading, setNavLoading] = useState(true); 

  // 搜索
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm);
  const [searchMode, setSearchMode] = useState('internal');

  // 模态框控制
  const [showAuth, setShowAuth] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [infoContent, setInfoContent] = useState({ title: '', content: '' });

  // 权限判断
  const isAdmin = useMemo(() => user?.email === ADMIN_EMAIL, [user]);
  const isUser = useMemo(() => !!user, [user]);
  const runningDays = useRunningDays(START_DATE);

  // 当前显示的数据
  const currentNavData = useMemo(() => {
    return viewMode === 'user' ? userNav : publicNav;
  }, [viewMode, publicNav, userNav]);

  const searchEngines = useMemo(() => [
    { id: 'internal', name: '站内' },
    { id: 'google', name: 'Google' },
    { id: 'baidu', name: '百度' },
    { id: 'bing', name: 'Bing' },
  ], []);

  // ====================================================================
  // ⭐️ 数据加载和认证监听
  // ====================================================================

  const loadNavData = useCallback(async (userId) => {
    // 确保每次调用都设置为 true
    setNavLoading(true); 
    try {
      const publicData = await fetchPublicNav();
      setPublicNav(publicData);
      
      if (userId) {
        const userData = await fetchUserNav(userId);
        setUserNav(userData);
      } else {
        setUserNav([]); 
      }
    } catch (e) {
      console.error("加载导航数据失败:", e);
      setPublicNav(DEFAULT_PUBLIC_NAV); 
      setUserNav([]);
    } finally {
        // 在所有数据操作结束后，无论成功或失败，都设置 loading 为 false
        setNavLoading(false); 
    }
  }, []);

  const handleLogoutSuccess = useCallback(() => {
    setUser(null);
    setSession(null);
    setUserNav([]);
    setViewMode('public');
    setCurrentPage('home'); 
    loadNavData(null); 
  }, [loadNavData]);

  const handleLogin = (newUser) => {
      // 登录成功后，onAuthStateChange 会触发数据加载和页面跳转
      setCurrentPage('home'); 
  };
  
  // 核心 useEffect
  useEffect(() => {
    // 1. 初始会话检查
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      const initialUser = session?.user ?? null;
      setUser(initialUser);

      if (initialUser) {
        setViewMode('user');
        loadNavData(initialUser.id);
      } else {
        setViewMode('public');
        loadNavData(null);
      }
    });

    // 2. 状态变化监听
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        const newUser = session?.user ?? null;
        setUser(newUser);

        if (event === 'SIGNED_IN' && newUser) {
          setViewMode('user');
          loadNavData(newUser.id); 
          setCurrentPage('home'); 
        } else if (event === 'SIGNED_OUT') {
          handleLogoutSuccess();
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [loadNavData, handleLogoutSuccess]);
  
  // ====================================================================
  // ⭐️ 页面交互函数 (保持不变)
  // ====================================================================

  const handleAdminSettingsClick = () => {
    setIsEditing(false); 
    setCurrentPage('admin');
  };
  
  const handleUserSettingsClick = () => {
    setIsEditing(false); 
    setCurrentPage('user-panel');
  };
  
  const handleLogout = async () => {
    if (confirm('确定要退出登录吗？')) {
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error("Supabase 登出 API 报错:", error.message);
        }
    }
  };

  const handleSavePublicNav = async () => {
    try {
        await savePublicNavToDB(publicNav);
        await loadNavData(user?.id);
        alert('公共导航保存成功！');
        setCurrentPage('home');
    } catch (e) {
        alert('公共导航保存失败: ' + e.message);
    }
  };

  const handleSaveUserNav = async () => {
    if (!user) return;
    try {
        await saveUserNavToDB(user.id, userNav);
        await loadNavData(user.id);
        alert('我的导航保存成功！');
        setCurrentPage('home');
    } catch (e) {
        alert('我的导航保存失败: ' + e.message);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchMode !== 'internal' && searchTerm) {
      let url = '';
      switch (searchMode) {
        case 'google': url = `https://www.google.com/search?q=${encodeURIComponent(searchTerm)}`; break;
        case 'baidu': url = `https://www.baidu.com/s?wd=${encodeURIComponent(searchTerm)}`; break;
        case 'bing': url = `https://www.bing.com/search?q=${encodeURIComponent(searchTerm)}`; break;
        default: return;
      }
      window.open(url, '_blank');
      setSearchTerm('');
    }
  };
  
  const handleShowDisclaimer = () => {
    setInfoContent({ 
        title: "免责声明", 
        content: "本站提供的所有外部链接，旨在方便用户快速访问，其内容均由第三方网站提供。本站不对这些外部链接内容的准确性、完整性、合法性或可靠性承担任何责任。用户在访问这些外部链接时，应自行承担风险。任何通过本站链接所产生的..." 
    });
    setShowInfo(true);
  };
  
  const handleShowAbout = () => {
    setInfoContent({
        title: "关于本站",
        content: `这是一个极速导航网站。网站已稳定运行 ${runningDays} 天。本站旨在提供一个简洁、快速的导航体验，并集成了 Supabase 后端服务，实现了用户登录、注册、管理员管理公共链接、用户自定义私人链接的功能。\n\n管理员邮箱: ${ADMIN_EMAIL}`
    });
    setShowInfo(true);
  }

  // ====================================================================
  // ⭐️ 页面渲染逻辑 (移动到组件内部，可以访问所有 state)
  // ====================================================================

  const renderContent = () => {
    if (currentPage === 'admin' && isAdmin) {
      // return <AdminPanel ... /> 
      return <div className="text-center py-12">管理员面板 (此处应加载 AdminPanel)</div>; 
    }
    if (currentPage === 'user-panel' && isUser) {
      // return <UserPanel ... /> 
      return <div className="text-center py-12">用户设置面板 (此处应加载 UserPanel)</div>; 
    }
    
    // 首页 (Home) 视图
    
    // **🚨 修复点：只有在加载完成后 (navLoading === false)，才判断数据是否为空**
    if (!navLoading && currentNavData.length === 0 && !searchTerm) {
        return (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl shadow">
                <AlertCircle className="w-12 h-12 mx-auto text-yellow-500 mb-4" />
                <p className="text-lg text-gray-600 dark:text-gray-300">
                    {viewMode === 'user' ? '我的导航为空，请通过设置面板添加链接。' : '公共导航加载失败或为空。'}
                </p>
                {viewMode === 'public' && (
                    <button 
                        onClick={() => loadNavData(user?.id)}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2 mx-auto"
                    >
                        <RefreshCw className="w-4 h-4" /> 重新加载
                    </button>
                )}
            </div>
        );
    }
    
    // 如果在加载中 (navLoading === true) 或者数据不为空，则渲染 PublicNav (搜索结果也在这里显示)
    // 理论上 navLoading = true 的时候，不会执行到这里，但以防万一。
    if (currentNavData.length > 0 || searchTerm) {
        return (
            <PublicNav 
                navData={currentNavData} 
                searchTerm={debouncedSearchTerm} 
                isEditing={isEditing}
                onLinkClick={{ 
                    onOpen: (link) => window.open(link.url, '_blank'), 
                    onEdit: () => {}, 
                    onDelete: () => {} 
                }}
            />
        );
    }
    
    // 最终回退：如果 navLoading=true 并且到了这里，应该返回 null，让主渲染逻辑接管。
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 flex flex-col">
      
      {/* 认证模态框 */}
      {showAuth && (
        <AuthModal 
          onClose={() => setShowAuth(false)} 
          onLogin={handleLogin} 
          onRegister={() => {}} 
        />
      )}
      
      {/* 信息模态框 (UI 保持不变) */}
      {showInfo && (<div className="fixed inset-0 bg-black/60 flex items-start justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-3xl my-8">
                <div className="p-6 border-b flex justify-between items-center">
                    <h3 className="text-2xl font-bold text-gray-800 dark:text-white">{infoContent.title}</h3>
                    <button onClick={() => setShowInfo(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="p-6 text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                    {infoContent.content}
                </div>
                <div className="p-4 border-t flex justify-end">
                    <button onClick={() => setShowInfo(false)} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">关闭</button>
                </div>
            </div>
        </div>
      )}
      
      {/* 主体内容 */}
      <div className="container mx-auto px-4 py-8 flex-grow max-w-7xl">
        
        {/* 头部和搜索栏 (保持不变) */}
        <header className="mb-12">
            <h1 
                className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 cursor-pointer text-center mb-6"
                onClick={() => setCurrentPage('home')}
            >
                极速导航网
            </h1>
            
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg">
                <form onSubmit={handleSearchSubmit} className="flex gap-2">
                    <select 
                        value={searchMode}
                        onChange={(e) => setSearchMode(e.target.value)}
                        className="p-3 border rounded-full dark:bg-gray-700 dark:border-gray-600 text-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                        {searchEngines.map(engine => (
                            <option key={engine.id} value={engine.id}>{engine.name}</option>
                        ))}
                    </select>

                    <input 
                        id="searchInput" 
                        type="text" 
                        value={searchTerm} 
                        onChange={(e) => setSearchTerm(e.target.value)} 
                        placeholder={searchMode === 'internal' ? '搜索站内链接...' : `使用 ${searchEngines.find(e => e.id === searchMode)?.name || ''} 搜索...`} 
                        className="flex-1 px-4 py-3 rounded-full border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 outline-none focus:ring-blue-500 focus:border-blue-500" 
                    />
                    
                    {searchMode !== 'internal' && (
                        <button type="submit" className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 flex items-center justify-center flex-shrink-0" >
                            <Search className="w-5 h-5" />
                        </button>
                    )}
                </form>
            </div>
        </header>
        
        {/* 导航/设置切换栏 (保持不变) */}
        <div className="flex justify-between items-center mb-6 border-b pb-3 dark:border-gray-700">
            <div className="flex gap-4">
                <button
                    onClick={() => { setViewMode('public'); setCurrentPage('home'); }}
                    className={`font-semibold text-lg pb-1 ${viewMode === 'public' ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400 hover:text-blue-500'}`}
                >
                    <Globe className="w-5 h-5 inline mr-1" /> 公共导航
                </button>
                {isUser && (
                    <button
                        onClick={() => { setViewMode('user'); setCurrentPage('home'); }}
                        className={`font-semibold text-lg pb-1 ${viewMode === 'user' ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400 hover:text-blue-500'}`}
                    >
                        <User className="w-5 h-5 inline mr-1" /> 我的导航
                    </button>
                )}
            </div>
            
            <div className="flex gap-3 items-center">
                {!isUser && (
                    <button onClick={() => setShowAuth(true)} className="flex items-center gap-1 text-sm px-3 py-1 bg-green-500 text-white rounded-full hover:bg-green-600">
                        <LogIn className="w-4 h-4" /> 登录/注册
                    </button>
                )}
                
                {isAdmin && (
                    <button onClick={handleAdminSettingsClick} className="flex items-center gap-1 text-sm px-3 py-1 bg-yellow-500 text-white rounded-full hover:bg-yellow-600" title="管理公共导航">
                        <Settings className="w-4 h-4" /> 管理员
                    </button>
                )}
                {isUser && (
                    <button onClick={handleUserSettingsClick} className="flex items-center gap-1 text-sm px-3 py-1 bg-purple-500 text-white rounded-full hover:bg-purple-600" title="我的设置">
                        <Settings className="w-4 h-4" /> 设置
                    </button>
                )}
                
                {isUser && (
                    <button onClick={handleLogout} className="flex items-center gap-1 text-sm px-3 py-1 bg-red-500 text-white rounded-full hover:bg-red-600">
                        <LogOut className="w-4 h-4" /> 退出
                    </button>
                )}
            </div>
        </div>

        {/* 页面内容 */}
        <main>
            {/* 🚨 主渲染逻辑：如果正在加载且在主页，显示 Loading Spinner */}
            {navLoading && currentPage === 'home' ? <LoadingSpinner /> : renderContent()}
        </main>
        
      </div>
      
      {/* 页尾 (保持不变) */}
      <footer className="mt-12 border-t border-gray-200 dark:border-gray-700 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>&copy; {new Date().getFullYear()} 极速导航网. All rights reserved. | Powered by Supabase</p>
          <div className="flex justify-center items-center mt-2">
            <button onClick={handleShowAbout} className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 mx-2">关于本站 ({runningDays} 天)</button>
            <span className="text-gray-300 dark:text-gray-600 ml-4 mr-2">|</span>
            <button onClick={handleShowDisclaimer} className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 mx-2">免责声明</button>
            <span className="text-gray-300 dark:text-gray-600 ml-4 mr-2">|</span>
            
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" title="GitHub 仓库" className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 mx-1">
                <Github className="w-5 h-5" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}