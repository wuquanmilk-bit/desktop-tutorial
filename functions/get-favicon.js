// 最终回退方案 - 纯文字图标
const SimpleIcon = ({ url, name }) => {
  const getFirstLetter = (url) => {
    try {
      const domain = new URL(url).hostname;
      return domain.charAt(0).toUpperCase();
    } catch (e) {
      return name ? name.charAt(0).toUpperCase() : '?';
    }
  };

  const letter = getFirstLetter(url);
  const colors = [
    'from-blue-500 to-blue-600',
    'from-green-500 to-green-600', 
    'from-purple-500 to-purple-600',
    'from-red-500 to-red-600',
    'from-yellow-500 to-yellow-600'
  ];
  
  const colorIndex = letter.charCodeAt(0) % colors.length;
  const colorClass = colors[colorIndex];

  return (
    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${colorClass} flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-md`}>
      {letter}
    </div>
  );
};

// 使用简单图标
const LinkIcon = ({ link }) => {
  return <SimpleIcon url={link.url} name={link.name} />;
};