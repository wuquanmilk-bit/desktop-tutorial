// 替换你现有的图标组件
const Favicon = ({ url }) => {
  const domain = url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0];
  const firstLetter = domain.charAt(0).toUpperCase();
  
  return (
     {
        e.target.src = `data:image/svg+xml,${encodeURIComponent(`
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32">
            <rect width="32" height="32" fill="#337ab7" rx="4"/>
            <text x="16" y="20" text-anchor="middle" fill="white" font-family="Arial" font-size="14">${firstLetter}</text>
          </svg>
        `)}`;
      }}
      alt=""
      style={{ width: 16, height: 16, borderRadius: 2 }}
    />
  );
};