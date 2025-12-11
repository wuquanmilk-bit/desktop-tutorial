// 超简单可靠的 LinkIcon 组件
const LinkIcon = ({ link }) => {
  return (
    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-md">
      <Favicon url={link.url} size={24} />
    </div>
  );
};