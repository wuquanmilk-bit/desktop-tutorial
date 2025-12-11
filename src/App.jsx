// src/App.jsx
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { supabase } from './supabaseClient';
import { ExternalLink, X, Search, Settings, Edit, Trash2, Plus, LogOut, User, Mail, Lock, Key, LayoutGrid, Github, Globe, Download } from 'lucide-react'; 
import './index.css';

// ====================================================================
// 配置
// ====================================================================
const ADMIN_EMAIL = '115382613@qq.com';

// --------------------------------------------------------------------
// **图标 Base64 编码区域**
// --------------------------------------------------------------------
const GITHUB_ICON_BASE64 = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iOTgiIGhlaWdodD0iOTgiIHZpZXdCb3g9IjAgMCA5OCA5OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTQ4Ljg1NCAwQzIxLjgxOSAwIDAgMjIgMCA0OS4wMjJjMCAyMS42NTUgMTMuOTk0IDQwLjEwMSAzMy4zMDYgNDYuNTcgMi40MjcuNDkyIDMuMzE2LTEuMDYxIDMuMzE2LTIuMzYgMC0xLjE0MS0uMDgtNS4wNTItLjA4LTkuMTI3LTEzLjU5IDIuOTM0LTE2LjQyLTEzLjA4LTE2LjQyLTEzLjA4LTIuMzA2LTUuODI1LTUuNjMtNy4zODctNS42My03LjM4Ny00LjU1Mi0zLjExNS4zNDQtMy4xMTUuMzQ0LTMuMTE1IDQuOTc1LjM0NCA3LjU2NiA1LjExIDcuNTY2IDUuMTEwIDQuNjEyIDcuOTI3IDMuODc3IDEwLjIzIDMuODc3IDEwLjIzIDIuNzkyIDQuODc0IDEwLjE1IDMuNDI4IDEyLjYxIDIuNjEuMzgtMi4yMzYuODk1LTMuNDI3IDEuNjI3LTUuMzA1LTE0LjA4Ni0xLjU5OC0yOC44NTUtNy4wOC0yOC44NTUtMzEuNDYgMC02Ljg1IDIuNDM5LTEyLjQ3IDYuNTAzLTE2Ljg0LTIuNTctNi4xNjctMS4xMjItMTIuNjUgMS4xMjItMTIuNjUgNS43MDYgMCAxMi4wNDQgNS41MjMgMTIuNTYgNS44MjMgMy40OS0xLjE3IDcuMjk3LTEuNzUgMTEuMDctMS43NSAzLjc3MyAwIDcuNTguNTggMTEuMDcgMS43NS41MzctLjMgNS44NzItNS44MjMgMTIuNTYtNS44MjMgMi4yNDQgMCAzLjY5MiA2LjQ4MyAxLjEyMiAxMi42NSAzLjA2NCA0LjM3IDYuNTAzIDkuOTkgNi41MDMgMTYuODQgMCAyNC40MTItMTQuODU1IDI5LjQwMi0yOS4wMiAzMS40NjIuODk1Ljc3IDEuNjg3IDIuMjc3IDEuNjg3IDQuNjA3IDAgMy4zMjgtLjAzIDYuMDI4LS4wMyA2Ljg1IDAgMS4zMDMuODkgMi44NTIgMS42ODcgMy43MzVDODIuOTYgODkuMDIzIDk2IDcwLjY3NyA5NiA0OS4wMjIgOTYgMjIgNzQuMTgxIDAgNDguODU0IDB6IiBmaWxsPSIjMTgxNzE3Ii8+Cjwvc3ZnPgo=';

const SUPABASE_ICON_BASE64 = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAyNCIgaGVpZ2h0PSIxMDI0IiB2aWV3Qm94PSIwIDAgMTAyNCAxMDI0IiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cGF0aCBkPSJNNTI1LjUzMiA2OThWNjI2LjYyOUwzNTIuODA2IDU0MS42MjlWNDQwLjU0M0w1MjUuNTMyIDUzNC43NTVWNDczLjM3NEwyNjUuMzA2IDM0MC4yMjlWNTQxLjYyOUwwIDYyNi42MjlWMzQwLjIyOUwyNjUuMzA2IDIwNy4wODRINTI1LjUzMkw3ODUuNzU4IDM0MC4yMjlWNTQxLjYyOUw1MjUuNTMyIDY5OFoiIGZpbGw9IiMzRUM3RjYiLz4KPHBhdGggZD0iTTc4NS43NTggNzQ2Ljg1N1Y2ODUuNDg2TDUyNS41MzIgODE4LjYzMVY2MTcuMjMxTDc4NS43NTggNzQ2Ljg1N1oiIGZpbGw9IiMzRUM3RjYiLz4KPC9zdmc+Cg==';

const VERCEL_ICON_BASE64 = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAyNCIgaGVpZ2h0PSIxMDI0IiB2aWV3Qm94PSIwIDAgMTAyNCAxMDI0IiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cGF0aCBkPSJNNTc2IDcwNEg5NDRMMTkyIDMyMEg1MTJMNzA0IDUxMkw1NzYgNzA0WiIgZmlsbD0iIzAwMDAwMCIvPgo8L3N2Zz4K';

const FIGMA_ICON_BASE64 = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDIwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0xMDAgMTUwQzEwMCAxMzQuMzEgMTEyLjMxIDEyMiAxMjggMTIyQzE0My42OSAxMjIgMTU2IDEzNC4zMSAxNTYgMTUwQzE1NiAxNjUuNjkgMTQzLjY5IDE3OCAxMjggMTc4QzExMi4zMSAxNzggMTAwIDE2NS42OSAxMDAgMTUwWiIgZmlsbD0iIzFBCDU0QiIvPgo8cGF0aCBkPSJNNjIgMjIyQzYyIDIwNi4zMSA3NC4zMSAxOTQgOTAgMTk0SDEwMFYyMjJDMTAwIDIzNy42OSA4Ny42OSAyNTAgNzIgMjUwQzU2LjMxIDI1MCA0NCAyMzcuNjkgNDQgMjIyQzQ0IDIwNi4zMSA1Ni4zMSAxOTQgNzIgMTk0Qzc0LjMxIDE5NCA3Ni41OCAxOTQuMjMgNzguNzggMTk0LjY3Qzc4LjI5IDE5Ni4wOSA3OCAxOTcuNTkgNzggMTk5LjEyQzc4IDIxNS4zMSA5MC4zMSAyMjcuNSAxMDYuNSAyMjcuNUMxMDguMDIgMjI3LjUgMTA5LjUzIDIyNy4yMiAxMTAuOTUgMjI2LjczQzExMC40IDIyOC45MiAxMTAuMTcgMjMxLjE5IDExMC4xNyAyMzMuNDdDMTEwLjE3IDI0OS42NiAxMjIuNDggMjYxLjgzIDEzOC42NyAyNjEuODNDMTU0Ljg2IDI2MS44MyAxNjcuMTcgMjQ9LjY2IDE2Ny4xNyAyMzMuNDdDMTY3LjE3IDIzMS4xOSAxNjYuOTQgMjI4LjkyIDE2Ni4zOSAyMjYuNzNDMTY3LjgxIDIyNy4yMiAxNjkuMzIgMjI3LjUgMTcwLjgzIDIyNy41QzE4Ni4xOCAyMjcuNSAxOTguNSAyMTUuMTggMTk4LjUgMTk5LjgzQzE5OC41IDE4NC40OCAxODYuMTggMTcyLjE2IDE3MC44MyAxNzIuMTZDMTY5LjMyIDE3Mi4xNiAxNjcuODEgMTcyLjQ0IDE2Ni4zOSAxNzIuOTNDMTY2Ljk0IDE3MC43NCAxNjcuMTcgMTY4LjQ3IDE2Ny4xNyAxNjYuMTlDMTY3LjE3IDE1MCAxNTQuODYgMTM3LjgzIDEzOC42NyAxMzcuODNDMTIyLjQ4IDEzNy44MyAxMTAuMTcgMTUwIDExMC4xNyAxNjYuMTlDMTEwLjE3IDE2OC40NyAxMTAuNCAxNzAuNzQgMTEwLjk1IDE3Mi45M0MxMDkuNTMgMTcyLjQ0IDEwOC4wMiAxNzIuMTYgMTA2LjUgMTcyLjE2QzkwLjMxIDE3Mi4xNiA3OCAxODQuMzMgNzggMjAwLjUyQzc4IDIwMi4wNCA3OC4yOSAyMDMuNTQgNzguNzggMjA0Ljk2Qzc2LjU4IDIwNS40IDc0LjMxIDIwNS42MyA3MiAyMDUuNjNDNTYuMzEgMjA1LjYzIDQ0IDE5My41IDQ0IDE3Ny4zMUM0NCAxNjEuMTIgNTYuMzEgMTQ4Ljk1IDcyIDE0OC45NUM3NC4zMSAxNDguOTUgNzYuNTggMTQ5LjE4IDc4Ljc4IDE0OS42MkM3OC4yOSAxNTEuMDQgNzggMTUyLjU0IDc4IDE1NC4wNkM3OCAxNjkuNzUgOTAuMzEgMTgyIDEwNiAxODJIMTEwVjE1MEMxMTAgMTM0LjMxIDk3LjY5IDEyMiA4MiAxMjJDNjYuMzEgMTIyIDU0IDEzNC4zMSA1NCAxNTBDNTQgMTY1LjY5IDY2LjMxIDE3OCA4MiAxNzhDODMuNTIgMTc4IDg1LjAyIDE3Ny43MiA4Ni40NCAxNzcuMjNDODUuODkgMTc5LjQyIDg1LjY3IDE4MS42OSA4NS42NyAxODMuOTdDODUuNjcgMjAwLjE2IDk3Ljk4IDIxMi4zMyAxMTQuMTcgMjEyLjMzQzEzMC4zNiAyMTIuMzMgMTQyLjY3IDIwMC4xNiAxNDIuNjcgMTgzLjk3QzE0Mi42NyAxODEuNjkgMTQyLjQ0IDE3OS40MiAxNDEuODkgMTc3LjIzQzE0My4zMSAxNzcuNzIgMTQ0LjgyIDE3OCAxNDYuMzMgMTc4QzE2MS45OCAxNzggMTc0LjMzIDE2NS42NSAxNzQuMzMgMTUwQzE3NC4zMyAxMzQuMzUgMTYxLjk4IDEyMiAxNDYuMzMgMTIyQzEzMC42OCAxMjIgMTE4LjMzIDEzNC4zNSAxMTguMzMgMTUwVjE4MkgxMjJDMTM3LjY5IDE4MiAxNTAgMTY5LjY5IDE1MCAxNTRDMTUwIDEzOC4zMSAxMzcuNjkgMTI2IDEyMiAxMjZDMTA2LjMxIDEyNiA5NCAxMzguMzEgOTQgMTU0Qzk0IDE1NS41MiA5NC4yOCAxNTcuMDIgOTQuNzcgMTU4LjQ0QzkyLjU3IDE1OC44OCA5MC4zMSAxNTkuMTEgODggMTU5LjExQzcyLjMxIDE1OS4xMSA2MCAxNDYuOSA2MCAxMzEuMjFDNjAgMTE1LjUyIDcyLjMxIDEwMy4zMSA4OCAxMDMuMzFDOTAuMzEgMTAzLjMxIDkyLjU3IDEwMy41NCA5NC43NyAxMDMuOThDOTQuMjggMTA1LjQgOTQgMTA2LjkgOTQgMTA4LjQyQzk0IDEyNC4xMSA4MS42OSAxMzYuNDIgNjYgMTM2LjQyQzUwLjMxIDEzNi40MiAzOCAxMjQuMTEgMzggMTA4LjQyQzM4IDkyLjczIDUwLjMxIDgwLjQyIDY2IDgwLjQyQzc0LjMxIDgwLjQyIDgxLjg0IDg0LjA1IDg3LjA0IDg5Ljg1QzkzLjMxIDgzLjU4IDEwMS40MiA4MCAxMTAuMzMgODBDMTI1LjAyIDgwIDEzOC4wNiA4Ny4yNyAxNDUuODMgOTguMjJDMTUxLjY0IDkyLjAyIDE1OS4yNSA4OCAxNjcuNjcgODBDMTgyLjM2IDgwIDE5NS40IDg3LjI3IDIwMy4xNyA5OC4yMkMyMDguMzcgOTIuNDIgMjE1LjkgODguNzkgMjI0LjIxIDg4Ljc5QzIzOC45IDg4Ljc5IDI1MS45NCA5Ni4wNiAyNTkuNzEgMTA3LjAxQzI2NC45MSAxMDEuMjEgMjcyLjU0IDk3LjU4IDI4MC44NSA5Ny41OEMyOTUuNTQgOTcuNTggMzA4LjU4IDEwNC44NSAzMTYuMzUgMTE1LjhDMzIxLjU1IDExMCAzMjkuMDggMTA2LjM3IDMzNy4zOSAxMDYuMzdDMzUyLjA4IDEwNi4zNyAzNjUuMTIgMTEzLjY0IDM3Mi44OSAxMjQuNTlDMzc4LjA3IDExOC44MSAzODUuNjggMTE1LjE5IDM5NC4wNyAxMTUuMTlDNDA4Ljc2IDExNS4xOSA0MjEuOCAxMjIuNDYgNDI5LjU3IDEzMy40MUM0MzQuNzcgMTI3LjYxIDQ0Mi4zIDEyMy45OCA0NTAuNjEgMTIzLjk4QzQ2NS4zIDEyMy45OCA0NzguMzQgMTMxLjI1IDQ4Ni4xMSAxNDIuMkM0OTEuMzEgMTM2LjQgNDk4Ljk0IDEzMi43NyA1MDcuMjUgMTMyLjc3QzUyMS45NCAxMzIuNzcgNTM0Ljk4IDE0MC4wNCA1NDIuNzUgMTUwLjk5QzU0Ny45NSAxNDUuMTkgNTU1LjU4IDE0MS41NiA1NjMuODkgMTQxLjU2QzU3OC41OCAxNDEuNTYgNTkxLjYyIDE0OC44MyA1OTkuMzkgMTU5Ljc4QzYwNC41OSAxNTMuOTggNjEyLjIyIDE1MC4zNSA2MjAuNTMgMTUwLjk1QzYzNS4yMiAxNTAuMzUgNjQ4LjI2IDE1Ny42MiA2NTYuMDMgMTY4LjU3QzY2MS4yMyAxNjIuNzcgNjY4Ljg2IDE1OS4xNCA2NzcuMTcgMTU5LjE0QzY5MS44NiAxNTkuMTQgNzA0LjkgMTY2LjQxIDcxMi42NyAxNzcuMzZDNzE3Ljg3IDE3MS41NiA3MjUuNSAxNjcuOTMgNzMzLjgxIDE2Ny45M0M3NDguNSAxNjcuOTMgNzYxLjU0IDE3NS4yIDc2OS4zMSAxODYuMTVDNzc0LjUxIDE4MC4zNSA3ODIuMTQgMTc2LjcyIDc5MC40NSAxNzYuNzJDODA1LjE0IDE3Ni43MiA4MTguMTggMTgzLjk5IDgyNS45NSAxOTQuOTRDODMxLjE1IDE4OS4xNCA4MzguNzggMTg1LjUxIDg0Ny4wOSAxODUuNTFDODYxLjc4IDE4NS41MSA4NzQuODIgMTkyLjc4IDg4Mi41OSAyMDMuNzNDODg3Ljc5IDE5Ny45MyA4OTUuNDIgMTk0LjMgOTAzLjczIDE5NC4zQzkxOC40MiAxOTQuMyA5MzEuNDYgMjAxLjU3IDkzOS4yMyAyMTIuNTJDOTQ0LjQzIDIwNi43MiA5NTIuMDYgMjAzLjA5IDk2MC4zNyAyMDMuMDlDOTc1LjA2IDIwMy4wOSA5ODguMSAyMTAuMzYgOTk1Ljg3IDIyMS4zMUMxMDAxLjA3IDIxNS41MSAxMDA4LjcgMjExLjg4IDEwMTcuMDEgMjExLjg4QzEwMzEuNyAyMTEuODggMTA0NC43NCAyMTkuMTUgMTA1Mi41MSAyMzAuMUwxMDUyLjUxIDMwMEgxMDAwVjIyMkMxMDAwIDIwNi4zMSAxMDEyLjMxIDE5NCAxMDI4IDE5NEMxMDQzLjY5IDE5NCAxMDU2IDIwNi4zMSAxMDU2IDIyMkMxMDU2IDIzNy42OSAxMDQzLjY5IDI1MCAxMDI4IDI1MEMxMDEyLjMxIDI1MCAxMDAwIDIzNy42OSAxMDAwIDIyMlYyNTBIMTAwMFYyNzJIMTAwMFYyOTRIMTAwMFYzMDBIMTAwMFoiIGZpbGw9IiNGMjRCNkMiLz4KPC9zdmc+Cg==';

const UNSPLASH_ICON_BASE64 = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxjaXJjbGUgY3g9IjEwMCIgY3k9IjEwMCIgcj0iODAiIGZpbGw9IiMwMDAwMDAiLz4KPHBhdGggZD0iTTEwMCAxMzMuMzMzQzExOC40MDkgMTMzLjMzMyAxMzMuMzMzIDExOC40MDkgMTMzLjMzMyAxMDAuMDAxQzEzMy4zMzMgODEuNTkyIDExOC40MDkgNjYuNjY3IDEwMCA2Ni42NjdDODEuNTkxIDY2LjY2NyA2Ni42NjcgODEuNTkyIDY2LjY2NyAxMDAuMDAxQzY2LjY2NyAxMTguNDA5IDgxLjU5MSAxMzMuMzMzIDEwMCAxMzMuMzMzWiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+Cg==';

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
    const diffTime = Math.abs(today - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    setRunningDays(diffDays);
  }, [startDateString]);

  return runningDays;
}

// 默认数据
const DEFAULT_PUBLIC_NAV = [
  {
    id: 1,
    category: '常用开发',
    sort_order: 1,
    links: [
      { id: 'link-1', name: 'GitHub', url: 'https://github.com', description: '代码托管平台', icon: GITHUB_ICON_BASE64 },
      { id: 'link-2', name: 'Supabase', url: 'https://supabase.com', description: '后端即服务', icon: SUPABASE_ICON_BASE64 },
      { id: 'link-3', name: 'Vercel', url: 'https://vercel.com', description: '部署平台', icon: VERCEL_ICON_BASE64 }
    ]
  },
  {
    id: 2,
    category: '设计资源',
    sort_order: 2,
    links: [
      { id: 'link-4', name: 'Figma', url: 'https://figma.com', description: '设计工具', icon: FIGMA_ICON_BASE64 },
      { id: 'link-5', name: 'Unsplash', url: 'https://unsplash.com', description: '免费图片', icon: UNSPLASH_ICON_BASE64 }
    ]
  }
];

// ====================================================================
// 核心数据同步函数
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
      .map(link => ({ ...link, id: `link-${link.id}`, category_id: cat.id })) 
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
      .map(link => ({ ...link, id: `link-${link.id}`, category_id: cat.id })) 
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
// 核心组件 (LinkIcon 修改版, LinkCard, PublicNav, LinkForm)
// ====================================================================

// LinkIcon - **纯 Base64/静态模式**
// 如果有 link.icon 且能加载，则显示；否则显示文字图标。
const LinkIcon = ({ link }) => {
  const [imgError, setImgError] = useState(false);
  const iconSource = link.icon; // 数据库或硬编码的 Base64 字符串

  // 1. 如果有图标数据且没有报错，显示图片
  if (iconSource && !imgError) {
    return (
      <div className="w-10 h-10 rounded-lg border bg-gray-50 dark:bg-gray-700 flex items-center justify-center flex-shrink-0 overflow-hidden">
        <img 
          src={iconSource} 
          alt={`${link.name} icon`} 
          className="w-6 h-6 object-contain" 
          onError={() => setImgError(true)} // 如果 Base64 数据损坏，转为文字模式
        />
      </div>
    );
  }

  // 2. 回退模式：显示文字首字母
  return (
    <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-lg font-bold text-gray-600 dark:text-gray-300 flex-shrink-0">
      {link.name ? link.name.substring(0, 1).toUpperCase() : <ExternalLink className="w-5 h-5 text-blue-500" />}
    </div>
  );
};

// 链接卡片
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

// 公共导航显示组件
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
      <input
        type="text"
        className="w-full p-2 border rounded dark:bg-gray-600 dark:border-gray-500"
        placeholder="Base64 字符串或图片 URL (留空则显示文字图标)"
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
      icon: linkData.icon || null, 
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
                
                {addingLinkTo === category.id && (
                  <LinkForm
                    onSave={(link) => handleAddLink(category.id, link)}
                    onCancel={() => setAddingLinkTo(null)}
                    mode="add"
                  />
                )}

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
      icon: linkData.icon || null, 
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
          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg mb-6 border border-blue-200 dark:border-blue-800">
            <h4 className="font-semibold mb-1">当前用户：{user.email}</h4>
            <p className="text-sm text-blue-600 dark:text-blue-300">
                用户 ID: {user.id.substring(0, 8)}...
            </p>
          </div>
          
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

          <div className="space-y-4">
            {sortedUserNav.map(category => (
              <div key={category.id} className="border rounded-lg p-4 bg-white dark:bg-gray-800">
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
                
                {addingLinkTo === category.id && (
                  <LinkForm
                    onSave={(link) => handleAddLink(category.id, link)}
                    onCancel={() => setAddingLinkTo(null)}
                    mode="add"
                  />
                )}

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


// AuthModal, WelcomeModal, InfoModal, LinkActionModal
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
                onLogin(user); 
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
                    <a 
                        href={link.url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        onClick={onClose}
                        className="flex items-center justify-center w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                    >
                        <ExternalLink className="w-5 h-5 mr-2" /> 立即访问
                    </a>

                    {canEdit && (
                        <button
                            onClick={() => {
                                onClose();
                                onEdit(link); 
                            }}
                            className="flex items-center justify-center w-full py-3 bg-yellow-500 text-white rounded-lg font-semibold hover:bg-yellow-600 transition-colors"
                        >
                            <Edit className="w-5 h-5 mr-2" /> 编辑链接
                        </button>
                    )}

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
  const [viewMode, setViewMode] = useState('public'); 
  const [isDarkMode, setIsDarkMode] = useState(window.matchMedia('(prefers-color-scheme: dark)').matches);
  
  const [showAuth, setShowAuth] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showUserPanel, setShowUserPanel] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [infoContent, setInfoContent] = useState({ title: '', content: '' });
  const [showLinkAction, setShowLinkAction] = useState(false); 
  const [selectedLink, setSelectedLink] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [searchMode, setSearchMode] = useState('internal'); 

  const appStartDate = '2024-01-01'; 
  const runningDays = useRunningDays(appStartDate);
  
  const isAdmin = user && user.email === ADMIN_EMAIL;
  
  const searchEngines = useMemo(() => [
    { id: 'internal', name: '站内' },
    { id: 'google', name: 'Google' },
    { id: 'baidu', name: '百度' },
    { id: 'bing', name: 'Bing' },
  ], []);

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

  const handleLogoutSuccess = useCallback(() => {
    setUser(null);
    setSession(null);
    setUserNav([]);
    setViewMode('public');
    loadNavData(null); 
  }, [loadNavData]);


  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => setIsDarkMode(e.matches);
    mediaQuery.addEventListener('change', handler);

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
          handleLogoutSuccess(); 
        }
      }
    );

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

  const handleUserLoginClick = () => {
      if (user) {
          setShowUserPanel(true); 
      } else {
          setShowAuth(true); 
      }
  };
  
  const handleAdminSettingsClick = () => {
      if (isAdmin) {
          setShowAdminPanel(true);
      } else {
          alert('此入口仅供管理员使用，请使用下方人头图标登录/管理您的个人导航。');
      }
  };

  const handleViewModeToggle = () => {
    if (user) {
        setViewMode(prev => prev === 'public' ? 'user' : 'public');
    } else {
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

- 技术栈: React, Tailwind CSS, Supabase` 
      });
      setShowInfo(true);
  };

  const currentViewText = viewMode === 'public' ? '公共导航' : '我的导航';

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark bg-gray-900 text-white' : 'bg-white text-gray-800'}`}>
        <header className="fixed top-0 left-0 right-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 z-10 shadow-md">
            <div className="max-w-7xl mx-auto px-4 py-3">
                <div className="flex items-center w-full relative justify-center"> 
                    <h1 
                        className="text-3xl font-bold cursor-pointer" 
                        style={{ color: '#6A5ACD' }} 
                        onClick={() => {
                            if (viewMode !== 'public') setViewMode('public');
                        }}
                    >
                        极速导航网
                    </h1>
                    <div className="absolute right-0 text-sm text-gray-500 dark:text-gray-400">
                        在: <span className="font-semibold text-blue-600 dark:text-blue-400">{currentViewText}</span>
                    </div>
                </div>

                <div className="max-w-xl mx-auto"> 
                    <form onSubmit={handleSearchSubmit} className="mt-4 flex gap-4">
                        <div className="relative flex-1"> 
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-400" />
                            <input
                                id="searchInput"
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder={searchMode === 'internal' ? '请输入搜索内容' : `使用 ${searchEngines.find(e => e.id === searchMode)?.name || ''} 搜索...`}
                                className="w-full px-4 py-3 pl-10 rounded-full border border-gray-700 bg-gray-700 text-white placeholder-gray-400 outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        {searchMode !== 'internal' && (
                            <button 
                                type="submit" 
                                className="p-3 bg-blue-600 text-cyan-400 rounded-full hover:bg-blue-700 flex items-center justify-center flex-shrink-0"
                            >
                                <Search className="w-5 h-5" />
                            </button>
                        )}
                    </form>
                    
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

        <div className="fixed bottom-6 right-6 flex flex-col items-end space-y-3 z-50">
            {isAdmin && (
                 <button
                    onClick={handleAdminSettingsClick}
                    title="管理公共导航 (管理员)"
                    className="p-4 rounded-full bg-red-600 text-white shadow-xl hover:bg-red-700 transition-transform transform hover:scale-105"
                >
                    <Settings className="w-6 h-6" /> 
                </button>
            )}
            
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
            
            <button
                onClick={handleUserLoginClick}
                title={user ? '我的账户/设置' : '登录/注册'}
                className="p-4 rounded-full bg-blue-600 text-white shadow-xl hover:bg-blue-700 transition-transform transform hover:scale-105"
            >
                <User className="w-6 h-6" /> 
            </button>
        </div>

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
      
      <footer className="mt-12 border-t border-gray-200 dark:border-gray-700 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>
            &copy; {new Date().getFullYear()} 极速导航网. All rights reserved. | Powered by Supabase
            <span className="ml-4 font-semibold text-blue-600 dark:text-blue-400">
                运行: {runningDays} 天
            </span>
          </p>
          <div className="flex justify-center items-center mt-2">
            <button onClick={handleShowAbout} className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 mx-2">关于本站</button>
            <span className="text-gray-300 dark:text-gray-600 ml-4 mr-2">|</span>
            
            <button onClick={handleShowDisclaimer} className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 mx-2">免责声明</button>
            <span className="text-gray-300 dark:text-gray-600 ml-4 mr-2">|</span>
            
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" title="GitHub 仓库" className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 mx-1">
                <Github className="w-5 h-5" /> 
            </a>
            
            <a 
                href="https://adcwwvux.eu-central-1.clawcloudrun.com/" 
                target="_blank" 
                rel="noopener noreferrer" 
                title="网站主页/其他链接" 
                className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 mx-1"
            >
                <Globe className="w-5 h-5" />
            </a>
            
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