// src/App.jsx
// =========================================================================
// 🎯 步骤 A：替换顶部的所有导入语句（请用这个代码块替换您文件顶部所有的 import... 语句）
// =========================================================================
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { supabase } from './supabaseClient';

// 确保导入了所有新旧图标，解决了 Cloud, Database 等图标缺失的问题
import { 
    ExternalLink, X, Search, Settings, Edit, Trash2, Plus, LogOut, User, Mail, Lock, Key, LayoutGrid, 
    Github, Globe, Download, Cloud, Database, Bot, Play, Camera, Network, Server, ShoppingCart, Wand, Monitor, 
    Wrench, Code, Clock 
} from 'lucide-react'; 

import './index.css';

// ====================================================================
// 配置
// ====================================================================
const ADMIN_EMAIL = '115382613@qq.com';

// --------------------------------------------------------------------
// **图标 Base64 编码区域**
// --------------------------------------------------------------------
// **重要说明：请将以下占位符替换为您实际的 SVG 或 PNG Base64 字符串。**
// 
// 转换方法：将图标文件上传到在线 Base64 转换工具，将结果粘贴到下方。
// 格式应为：'data:image/svg+xml;base64,...' 或 'data:image/png;base64,...'
const GITHUB_ICON_BASE64 = 'data:image/svg+xml;base64,PHN2ZyB2ZXJzaW9uPSIxLjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHdpZHRoPSIxNzUiIGhlaWdodD0iMTc1IiB2aWV3Qm94PSIwLDAsMTc1LDE3NSI+PGcgaWQ9InN2Z18zIj48cGF0aCBmaWxsPSIjMjAyNjI3IiBkPSJNMzguNjY2NywzOC42NjY3aDEzNy42NjY2VjEzMi4zMzMzaC0xMzcuNjY2NlYzOC42NjY3WiIgY2xhc3M9ImdhdGUtaWNvbiByZWd1bGFyIi8+PC9nPg8vc3ZnPg=='; // **请替换为真实的 GitHub Base64**
const SUPABASE_ICON_BASE64 = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MTIgNTEyIj48cGF0aCBkPSJNMjU2IDBDMTE0LjYgMCAwIDExNC42IDAgMjU2czExNC42IDI1NiAyNTYgMjU2IDI1Ni0xMTQuNiAyNTYtMjU2UzM5Ny40IDAgMjU2IDB6TTI1NiA1MS4yYy01Ny4yIDAtMTA1LjcgMjcuMi0xMzUuOCAzOC4xTDM1My4zIDM2Ni41Yy0xMS41LTEwLjEtMjUuNi0xNy40LTQxLjUtMjEuNCAwLTIwLjYtMTYuOS0zNy41LTM3LjUtMzcuNS0yMC42IDAtMzcuNSAxNi45LTM3LjUgMzcuNSAwIDIwLjYgMTYuOSA0MS4yIDQxLjUgMzcuNUw4MC43IDQyMy41Yy01LjYgMy4xLTEwLjQgNy4zLTE0LjkgMTIuNi02LjQgNy44LTEwLjEgMTcuMS0xMC4xIDI4LjIgMCAxNC45IDcuMyAyOC41IDE5LjMgMzcuNSAyLjQgMTkuMyAxOS4zIDM0LjMgMzkuNSAzMS42IDExLjItMS40IDIyLjItNC42IDMyLjYtOS42bDEzNi43LTE1MS44YzIxLjQgNS4xIDQxLjIgMTkuMyA1MS4yIDM5LjYgMjcuMiA1Ny4yLTM2LjYgMTA1LjctOTMuOCAxMzUuOC0zMC43IDMxLjQtNjkuOSAyOS41LTk5LjcgMzcuNWwtODQuMy04NC4zYy0zLTIuNC01LjYtNS42LTUuNi05LjMgMy44LTE4LjQgMTkuMy0zMS40IDM3LjUtMzEuNCAyMy4zIDAgMzcuNSA5LjggMzkuNSA5LjggNDcuOS01NC42IDUxLjItMTI2LjYgOS44LTE2MS4yTDQyMy41IDUwMy43YzYuOCAzLjggMTMuNSAyLjQgMTcuMi0zLjUgMzYuNy00Mi42IDMyLjUtMTE1LjYtOS44LTE2NS41QzQyMy41IDEzNy4xIDMyMy43IDUyLjEgMjU2IDUxLjJ6IiBmaWxsPSIjMUMyMzJGOCIvPjwvc3ZnPg=='; // **请替换为真实的 Supabase Base64**
const VERCEL_ICON_BASE64 = 'data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgMzYgMzYiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZmlsbD0iIzAwMDAwMCIgZD0iTTMwLjM4IDEuNTdMMTYuMTMgMjUuMjNMMS44OCA1LjgxYTIuNjkgMi42OSAwIDAgMSAxLjkzLTMuMTFsMjYuNzgtLjk5YTIuNjggMi42OCAwIDAgMSAuNjUgLjgyeiIvPjwvc3ZnPg=='; // **请替换为真实的 Vercel Base64**
const FIGMA_ICON_BASE64 = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjUuMDAwMDAwMDAwMDAwMDA0IiBoZWlnaHQ9IjM3LjQ5OTk5OTk5OTk5OTk5NSIgdmlld0JveD0iMCAwIDI1IDM3LjUiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTE2LjY2NjcgMzcuNUgyNS4wVjI1LjAwMDJDMjUuMDAwMiAzNC4yNzM4IDE4LjY3MjcgMzcuNSAxNi42NjY3IDM3LjVaTTI1LjAwMDEgMTIuNDk5OUgyNS4wMDEyVjI1LjAwMDJDMTguNjcyNyAyNS4wMDAzIDE4LjY3MTMgMjUuMDAwMSAxNi42NjY3IDI1LjAwMDJWMTEuNzA0OEwyNS4wMDEyIDExLjcxMjIgMjUuMDAwMSAxMi40OTk5WiIgZmlsbD0iIzAwQzE5RSIvPjxwYXRoIGQ9Ik0xNi42NjY3IDBIMjUuMDAwMVYxMi41MDAxSDE2LjY2NjdWMFoiIGZpbGw9IiNGRDBRQUYiLz48cGF0aCBkPSJNMCAwSDE2LjY2NjZWMTEuNzA0OEgwVjBaIiBmaWxsPSIjRjkyRjI0Ii8+PHBhdGggZD0iTTE2LjY2NjcgMTEuNzA0OEgwVjI1LjAwMDJIMS45MDE0N0MxLjkwMTQ3IDI1LjAwMDMgMTAuNjUxNCAyNS4wMDYxIDE2LjY2NjcgMjUuMDAwMlYxMS43MDQ4WiIgZmlsbD0iIzEwOTRGMyIvPjxwYXRoIGQ9Ik0xNi42NjY2IDI1LjAwMDJWMzcuNDk5OUgxLjkxNDYxQzEuOTE0NjEgMzQuMjk1IDcuNzI5OTIgMzQuMzM0MyAxNi42NjY2IDI1LjAwMDJaIiBmaWxsPSIjQUUzRTZCIi8+PC9zdmc+'; // **请替换为真实的 Figma Base64**
const UNSPLASH_ICON_BASE64 = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmVyU2lvbj0iMS4xIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMuorgvMjAwMC9zdmciPgogPGcgdHJhbnNmb3JtPSJtYXRyaXgoMS4wNzMgMCAwIDEuMDczIC0zLjY2OSAtMy42NjkpIj4KICA8ZyB0cmFuc2Zvcm09Im1hdHJpeCg1LjIzMjUgMCAwIDUuMjMyNSAtMjQwLjgxIC0yNDAuODEpIj4KICAgPHBhdGggZD0ibTQ4LjczNiA1MC42MTMgNS4xOTY3LTUuMi0yLjU5ODgtMi41OTY3LTUuMTk2NyA1LjIgMi41OTg4IDIuNTk2N3oiLz4KICAgPHBhdGggZD0ibTM3LjU3NyA1MC42MTMgNS4xOTY3LTUuMi0yLjU5ODgtMi41OTY3LTUuMTk2NyA1LjIgMi41OTg4IDIuNTk2N3oiLz4KICAgPHBhdGggZD0ibTI2LjQxOCA1MC42MTMgNS4xOTY3LTUuMi0yLjU5ODgtMi41OTY3LTUuMTk2NyA1LjIgMi41OTg4IDIuNTk2N3oiLz4KICA8L2c+CiA8L2c+CiA8L3N2Zz4K'; // **请替换为真实的 Unsplash Base64**

// 工具函数
function useDebounce(value, delay = 200) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

// 辅助函数: 计算运行天数 (保持不变)
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


// 默认数据 (数据库加载失败时的回退) - 已硬编码 Base64
const DEFAULT_PUBLIC_NAV = [
  {
    id: 1,
    category: '常用开发',
    sort_order: 1,
    links: [
      // GitHub: 使用 Base64 硬编码
      { id: 'link-1', name: 'GitHub', url: 'https://github.com', description: '代码托管平台', icon: GITHUB_ICON_BASE64 },
      // Supabase: 使用 Base64 硬编码 (注意：原代码中 Supabase 缺失 icon 字段，现已添加)
      { id: 'link-2', name: 'Supabase', url: 'https://supabase.com', description: '后端即服务', icon: SUPABASE_ICON_BASE64 },
      // Vercel: 使用 Base64 硬编码
      { id: 'link-3', name: 'Vercel', url: 'https://vercel.com', description: '部署平台', icon: VERCEL_ICON_BASE64 }
    ]
  },
  {
    id: 2,
    category: '设计资源',
    sort_order: 2,
    links: [
      // Figma: 使用 Base64 硬编码
      { id: 'link-4', name: 'Figma', url: 'https://figma.com', description: '设计工具', icon: FIGMA_ICON_BASE64 },
      // Unsplash: 使用 Base64 硬编码
      { id: 'link-5', name: 'Unsplash', url: 'https://unsplash.com', description: '免费图片', icon: UNSPLASH_ICON_BASE64 }
    ]
  }
];

// ====================================================================
// 核心数据同步函数 (保持不变)
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
        id: `link-${link.id}`, // 将数据库ID转换为前端ID格式
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

// 链接图标组件 (已优化，Base64 硬编码的图标会直接加载，外部网络失败后不再尝试 Favicon API)
// =========================================================================
// 🎯 代码块 2: 完整的图标逻辑代码块 (替换旧的 LinkIcon 组件和它之前的所有图标辅助函数)
// =========================================================================

// ===================================
// 1. 图标映射和获取函数 (Lucide 回退逻辑)
// ===================================

// 定义 Lucide 图标的名称映射表
const ICON_MAP = {
    // 基础和常用
    'GITHUB': Github,
    'GIT': Github,
    'CLOUD': Cloud,
    'SUPABASE': Database,
    'DB': Database,
    'NETWORK': Network,
    'SERVER': Server,
    'SHOPPING': ShoppingCart,
    'MONITOR': Monitor,

    // AI/工具
    'BOT': Bot,
    'AI': Bot,
    'GPT': Bot,
    'WAND': Wand,
    'WRITER': Wrench,

    // 内容和媒体
    'PLAY': Play,
    'YOUTUBE': Play,
    'CAMERA': Camera,
    
    // 开发/技术
    'CODE': Code,
    
    // 账户和时间
    'TIME': Clock,
    'MAIL': Mail,
    'LOGIN': User,
    'PASSWORD': Lock
};

// 工具函数：根据链接名称获取匹配的 Lucide 图标组件
const getLucideIcon = (name) => {
    // 如果名称为空，回退到地球图标
    if (!name) return Globe; 
    
    const upperName = name.toUpperCase();
    
    // 尝试匹配链接名称
    for (const key in ICON_MAP) {
        if (upperName.includes(key)) {
            return ICON_MAP[key];
        }
    }
    
    // 最终回退：如果没有任何匹配，使用 Globe
    return Globe; 
};

// ===================================
// 2. LinkIcon 核心组件 (三层图标逻辑)
// ===================================

/**
 * 负责显示链接图标的组件。
 * 优先级: link.icon (自定义/Base64) -> 外部 Favicon API (DuckDuckGo) -> Lucide 图标回退。
 */
const LinkIcon = ({ link }) => {
    // 状态：用于跟踪图片加载是否发生错误 (确保只尝试一次)
    const [hasError, setHasError] = useState(false);

    // 效应：当链接或图标源改变时，重置错误状态，重新尝试加载
    useEffect(() => {
        setHasError(false);
    }, [link.url, link.icon]);

    // 确定图标 URL 的核心逻辑
    const imageUrl = useMemo(() => {
        // 优先级 1: 如果 link.icon 字段有值，直接使用它 (自定义 URL 或 Base64)
        if (link.icon) {
            return link.icon;
        }

        // 优先级 2: 如果 link.icon 为空，使用外部 Favicon API 自动抓取
        try {
            const urlObj = new URL(link.url);
            // 使用 DuckDuckGo 的公共代理服务，稳定且比 Google Favicon 响应快
            return `https://icons.duckduckgo.com/ip3/${urlObj.hostname}.ico`;
        } catch {
            // URL 无效，返回空字符串，进入 Lucide 回退模式
            return ''; 
        }
    }, [link.icon, link.url]);

    // 获取 Lucide 回退图标组件
    const FallbackIconComponent = getLucideIcon(link.name); 
    
    return (
        // 样式容器：使用您文件中 LinkIcon 容器原本的样式
        <div className="flex-shrink-0 w-10 h-10 rounded-lg overflow-hidden border bg-gray-50 dark:bg-gray-700 flex items-center justify-center">
            {/* 检查条件：如果加载失败 (hasError) 或没有生成 URL (!imageUrl)，则显示回退图标 */}
            {hasError || !imageUrl ? (
                // 优先级 3: 显示 Lucide 回退图标 (使用 link.name 匹配)
                <FallbackIconComponent className="w-6 h-6 text-blue-500 dark:text-blue-400"/>
            ) : (
                // 优先级 1/2: 显示远程图片 (Base64 或 Favicon)
                <img 
                    src={imageUrl} 
                    alt={`${link.name} icon`} 
                    className="w-6 h-6 object-contain" 
                    onError={() => setHasError(true)} // ❗ 关键：图片加载失败时，触发 hasError=true 进入 Lucide 回退
                    loading="lazy"
                />
            )}
        </div>
    );
};

// 链接卡片 (保持不变)
const LinkCard = ({ link, onOpen }) => (
  <div 
    onClick={() => onOpen(link)} 
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

// 公共导航显示组件 (保持不变)
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
                onOpen={onLinkClick} 
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
      {/* Icon 输入框 */}
      <input
        type="url"
        className="w-full p-2 border rounded dark:bg-gray-600 dark:border-gray-500"
        placeholder="指定图标 URL 或 Base64 字符串 (可选，优先使用)"
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
      icon: linkData.icon || null, // 接收 icon
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
const UserPanel = ({ user, userNav, setUserNav, onClose, onSave, onLogoutSuccess }) => {
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
      icon: linkData.icon || null, // 接收 icon
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

  // 退出登录处理函数 
  const handleLogout = async () => {
      if (confirm('确定要退出登录吗？')) {
          setLoading(true);
          try {
              const { error } = await supabase.auth.signOut();
              
              if (error) {
                  console.error("Supabase 登出 API 报错:", error.message);
              }
              
              onLogoutSuccess(); 
              onClose(); 
          } catch (e) {
              alert('退出登录失败: ' + e.message);
          } finally {
              setLoading(false);
          }
      }
  };


  return (
    <div className="fixed inset-0 bg-black/60 flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-6xl my-8">
        {/* 标题 - 添加了保存按钮 */}
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

          {/* 分类列表 (内容不变) */}
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
                    {/* 用户面板中添加链接按钮 (保留) */}
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
          
          {/* 退出登录按钮 */}
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
          
        </div>
      </div>
    </div>
  );
};


// AuthModal, WelcomeModal, InfoModal, LinkActionModal (保持不变)
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

// 链接操作模态框 (保持不变)
const LinkActionModal = ({ link, user, onClose, onEdit, isUserNav }) => {
    const canEdit = (user && isUserNav) || (user && user.email === ADMIN_EMAIL && !isUserNav);

    return (
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
  const [showLinkAction, setShowLinkAction] = useState(false); 
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
  const loadNavData = useCallback(async (userId) => {
    try {
      const publicData = await fetchPublicNav();
      setPublicNav(publicData);
    } catch (e) {
      console.error("加载公共导航失败:", e);
      setPublicNav(DEFAULT_PUBLIC_NAV);
    }
    
    if (userId) {
      try {
        const userData = await fetchUserNav(userId);
        setUserNav(userData);
      } catch (e) {
        console.error("加载用户导航失败:", e);
        setUserNav([]);
      }
    }
  }, []);

  // 登出成功后的清理函数 (解决手机端退出问题)
  const handleLogoutSuccess = useCallback(() => {
    setUser(null);
    setSession(null);
    setUserNav([]);
    setViewMode('public');
    loadNavData(null); 
  }, [loadNavData]);


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
        setViewMode('user');
        loadNavData(session.user.id);
      } else {
        loadNavData(null);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        const newUser = session?.user ?? null;
        setUser(newUser);
        
        if (event === 'SIGNED_IN' && newUser) {
          setViewMode('user');
          loadNavData(newUser.id);
        } else if (event === 'SIGNED_OUT') {
          handleLogoutSuccess(); // 登出后调用清理
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
  }, [handleLogoutSuccess, loadNavData]);


  // 3. 动作函数

  // 用户/登录按钮 (人头) 点击事件
  const handleUserLoginClick = () => {
      if (user) {
          setShowUserPanel(true); // 已登录，进入用户面板
      } else {
          setShowAuth(true); // 未登录，进入登录/注册
      }
  };
  
  // 管理/设置按钮 (齿轮) 点击事件 - 仅管理员入口
  const handleAdminSettingsClick = () => {
      if (isAdmin) {
          setShowAdminPanel(true);
      } else {
          alert('此入口仅供管理员使用，请使用下方人头图标登录/管理您的个人导航。');
      }
  };


  // 模式切换按钮 (当前/我的导航) 点击事件
  const handleViewModeToggle = () => {
    // 只有在登录状态下才能切换到 'user' 模式
    if (user) {
        setViewMode(prev => prev === 'public' ? 'user' : 'public');
    } else {
        // 如果未登录但点击了模式切换，提示登录
        setShowAuth(true);
    }
  };
  
  const handleLinkClick = (link) => {
    setSelectedLink(link);
    setShowLinkAction(true);
  };
  
  const handleEditLink = (link) => {
      if (viewMode === 'public' && isAdmin) {
          setShowAdminPanel(true);
      } 
      else if (viewMode === 'user' && user) {
          setShowUserPanel(true);
      }
  }

  const handleSavePublicNav = async () => {
      try {
          await savePublicNavToDB(publicNav);
          // 重新加载以获取新的数据库ID
          await loadNavData(user?.id); 
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
          // 重新加载以获取新的数据库ID
          await loadNavData(user.id); 
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
        setSearchTerm(''); 
    }
  };

  // **更新后的免责声明**
  const handleShowDisclaimer = () => {
      setInfoContent({ 
          title: "免责声明", 
          content: `1. 内容准确性

本网站（第一象限 极速导航网）所提供的所有链接信息均来源于互联网公开信息或用户提交。本站会尽力确保信息的准确性和时效性，但不对信息的完整性、准确性、时效性或可靠性作任何形式的明示或暗示的担保。
2. 外部链接责任
本站提供的所有外部网站链接（包括但不限于导航网站、资源链接等）仅为方便用户访问而设置。本站对任何链接到的第三方网站的内容、政策、产品或服务不承担任何法律责任。用户点击并访问外部链接时，即表示自行承担由此产生的一切风险。
3. 法律法规遵守
用户在使用本站服务时，须承诺遵守当地所有适用的法律法规。任何用户利用本站从事违反法律法规的行为，均与本站无关，本站不承担任何法律责任。
4. 图标与版权声明
本站网址图标有些因为网络原因、技术缺陷，可能导致图标显示不准确。如果涉及侵权，请联系作者删除。作者邮箱: ${ADMIN_EMAIL}
使用本网站即表示您已阅读、理解并同意本声明的所有内容。`
      });
      setShowInfo(true);
  };
  
  // **更新后的关于本站**
  const handleShowAbout = () => {
      setInfoContent({
          title: "关于第一象限 极速导航网",
          content: `【站点功能】
本站致力于提供一个**简洁、快速、纯粹**的网址导航服务。我们精心筛选了常用、高效和高质量的网站链接，并将它们按类别清晰展示，旨在成为您日常网络冲浪的起点站。

【创设初衷：拒绝广告】
在信息爆炸的时代，许多导航网站充斥着干扰性的广告和推广内容，严重影响了用户体验和访问速度。**第一象限** 创建本站的初衷正是为了提供一个**零广告、零干扰**的净土。我们承诺，本站将永久保持简洁干净，只专注于网址导航这一核心功能。

【作者】
由 第一象限 独立设计与开发。
联系邮箱: ${ADMIN_EMAIL}

- 技术栈: React, Tailwind CSS, Supabase` // 运行天数已移除到页脚
      });
      setShowInfo(true);
  };


  // 5. 渲染部分
  
  const currentViewText = viewMode === 'public' ? '公共导航' : '我的导航';

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark bg-gray-900 text-white' : 'bg-white text-gray-800'}`}>
        
        {/* 顶部固定 Header */}
        <header className="fixed top-0 left-0 right-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 z-10 shadow-md">
            <div className="max-w-7xl mx-auto px-4 py-3">
                
                {/* 第一行：标题 + 模式切换（文本形式） */}
                <div className="flex items-center w-full relative justify-center"> 
                    {/* 标题 - 居中并改成紫蓝色 */}
                    <h1 
                        className="text-3xl font-bold cursor-pointer" 
                        // 文字颜色改为紫蓝色 (#6A5ACD)
                        style={{ color: '#6A5ACD' }} 
                        onClick={() => {
                            if (viewMode !== 'public') setViewMode('public');
                        }}
                    >
                        极速导航网
                    </h1>
                    
                    {/* 当前视图模式文字提示 */}
                    <div className="absolute right-0 text-sm text-gray-500 dark:text-gray-400">
                        在: <span className="font-semibold text-blue-600 dark:text-blue-400">{currentViewText}</span>
                    </div>
                </div>

                {/* 第二行：搜索框和选择器 - 保持 max-w-xl 宽度并居中 */}
                <div className="max-w-xl mx-auto"> 
                    <form onSubmit={handleSearchSubmit} className="mt-4 flex gap-4">
                        
                        {/* 搜索输入框及其图标容器 - 关键修改区域 */}
                        <div className="relative flex-1"> 
                            {/* 放大镜图标：颜色从 text-gray-400 修改为 text-blue-400 (亮蓝色) */}
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-400" />
                            
                            <input
                                id="searchInput"
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder={searchMode === 'internal' ? '请输入搜索内容' : `使用 ${searchEngines.find(e => e.id === searchMode)?.name || ''} 搜索...`}
                                // 关键修改：添加 pl-10 (左侧填充) 为图标留出空间
                                // 输入框使用 rounded-full (全圆角)
                                className="w-full px-4 py-3 pl-10 rounded-full border border-gray-700 bg-gray-700 text-white placeholder-gray-400 outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        
                        {/* 提交按钮（对站外搜索有效） */}
                        {searchMode !== 'internal' && (
                            <button 
                                type="submit" 
                                // 按钮使用 rounded-full (全圆角)
                                // 外部搜索图标颜色为 text-cyan-400 (亮蓝色)
                                className="p-3 bg-blue-600 text-cyan-400 rounded-full hover:bg-blue-700 flex items-center justify-center flex-shrink-0"
                            >
                                <Search className="w-5 h-5" />
                            </button>
                        )}
                    </form>
                    
                    {/* 第三行：搜索模式按钮组 - 水平排列在搜索框下方 */}
                    <div className="flex justify-center gap-3 mt-3">
                        {searchEngines.map(engine => (
                            <button
                                key={engine.id}
                                type="button" 
                                onClick={() => {
                                    setSearchMode(engine.id);
                                    if (engine.id !== 'internal' && searchTerm) { 
                                        setSearchTerm(''); 
                                    }
                                }}
                                className={`
                                    px-4 py-2 text-sm rounded-full font-medium transition-colors 
                                    ${
                                        searchMode === engine.id
                                            ? 'bg-blue-600 text-white shadow-md' 
                                            : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600' 
                                    }
                                `}
                            >
                                {engine.name}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </header>

        {/* ========================================================= */}
        {/* 右下方悬浮按钮组 - 移除添加链接按钮 (+) */}
        {/* ========================================================= */}
        <div className="fixed bottom-6 right-6 flex flex-col items-end space-y-3 z-50">
            
            {/* 1. 管理员/设置按钮 (仅管理员可见) */}
            {isAdmin && (
                 <button
                    onClick={handleAdminSettingsClick}
                    title="管理公共导航 (管理员)"
                    className="p-4 rounded-full bg-red-600 text-white shadow-xl hover:bg-red-700 transition-transform transform hover:scale-105"
                >
                    {/* 齿轮图标作为管理员专用入口 */}
                    <Settings className="w-6 h-6" /> 
                </button>
            )}
            
            {/* 2. 模式切换按钮 (仅登录用户可见) */}
            {user && (
                <button
                    onClick={handleViewModeToggle}
                    title={viewMode === 'public' ? '切换到我的导航' : '切换到公共导航'}
                    className={`p-4 rounded-full text-white shadow-xl transition-all duration-300 transform hover:scale-105 ${
                        viewMode === 'public' 
                            ? 'bg-purple-600 hover:bg-purple-700' 
                            : 'bg-indigo-600 hover:bg-indigo-700' 
                    }`}
                >
                    {viewMode === 'public' 
                        ? <LayoutGrid className="w-6 h-6" /> 
                        : <Key className="w-6 h-6" /> 
                    }
                </button>
            )}
            
            {/* 3. 用户/登录入口 (常驻显示) */}
            <button
                onClick={handleUserLoginClick}
                title={user ? '我的账户/设置' : '登录/注册'}
                className="p-4 rounded-full bg-blue-600 text-white shadow-xl hover:bg-blue-700 transition-transform transform hover:scale-105"
            >
                {/* 人头图标作为最主要的设置/登录入口 */}
                <User className="w-6 h-6" /> 
            </button>
            
        </div>
        {/* ========================================================= */}

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
          onLogoutSuccess={handleLogoutSuccess} 
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
      
      {/* 页尾 - 包含运行天数和 APK 下载按钮 */}
      <footer className="mt-12 border-t border-gray-200 dark:border-gray-700 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>
            &copy; {new Date().getFullYear()} 极速导航网. All rights reserved. | Powered by Supabase
            {/* **显示运行天数** */}
            <span className="ml-4 font-semibold text-blue-600 dark:text-blue-400">
                运行: {runningDays} 天
            </span>
          </p>
          <div className="flex justify-center items-center mt-2">
            {/* 关于本站按钮 */}
            <button onClick={handleShowAbout} className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 mx-2">关于本站</button>
            <span className="text-gray-300 dark:text-gray-600 ml-4 mr-2">|</span>
            
            {/* 免责声明按钮 */}
            <button onClick={handleShowDisclaimer} className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 mx-2">免责声明</button>
            <span className="text-gray-300 dark:text-gray-600 ml-4 mr-2">|</span>
            
            {/* **GitHub Icon** */}
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" title="GitHub 仓库" className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 mx-1">
                <Github className="w-5 h-5" /> 
            </a>
            
            {/* **地球 Icon 按钮 (已恢复正确链接)** */}
            <a 
                href="https://adcwwvux.eu-central-1.clawcloudrun.com/" 
                target="_blank" 
                rel="noopener noreferrer" 
                title="网站主页/其他链接" 
                className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 mx-1"
            >
                <Globe className="w-5 h-5" />
            </a>
            
            {/* **APK 下载按钮 (使用 Download 图标)** */}
            <a 
                href="https://zuplqpojcjwbmmjpacqx.supabase.co/storage/v1/object/sign/apk-downloads/jisudaohang.apk?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9lYjY4NTU2ZS03N2ExLTRiZjItOWQ0Yi0xMGM5NGMyZWRmOTkiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJhcGstZG93bmxvYWRzL2ppc3VkYW9oYW5nLmFwayIsImlhdCI6MTc2NTQyNzQ4MCwiZXhwIjoxNzk2OTYzNDgwfQ.jXJKv6R2qhpyEgX7LIo-dvh--Ng2y9Gv8AUr_tAHV7w" 
                target="_blank" 
                rel="noopener noreferrer" 
                title="安卓 APK 下载 (注意: 链接包含限时 token)" 
                className="ml-2 px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1"
            >
                <Download className="w-5 h-5" />
                <span className="hidden sm:inline">APK 下载</span> 
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;