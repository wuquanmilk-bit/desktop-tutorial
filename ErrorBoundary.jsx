// ErrorBoundary.jsx
import React from 'react';

// 这是 React 应用中最高级别的容错组件，用来捕获子组件渲染和生命周期中的错误。
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    // 静态方法：在后代组件抛出错误后被调用
    static getDerivedStateFromError(error) {
        // 更新 state，使下一次渲染能够显示备用 UI
        return { hasError: true, error: error.message };
    }

    // 生命周期方法：用于记录错误信息
    componentDidCatch(error, errorInfo) {
        // 您可以在此发送错误报告给您的日志服务
        console.error("ErrorBoundary 捕获到错误:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            // 如果出错，显示一个友好的错误提示 UI，而不是空白页面
            return (
                <div style={{ padding: '20px', border: '2px solid red', backgroundColor: '#fef2f2', color: '#b91c1c', borderRadius: '12px', margin: '20px 0' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>功能组件加载失败 (已捕获)</h3>
                    <p style={{ marginTop: '5px' }}>抱歉，此功能组件出现致命错误。应用的其他部分将保持正常。</p>
                    <details style={{ marginTop: '10px', fontSize: '0.875rem' }}>
                        <summary>查看详细错误 (开发环境可见)</summary>
                        <p>{this.state.error}</p>
                    </details>
                </div>
            );
        }

        // 如果没有错误，正常渲染子组件
        return this.props.children;
    }
}

export default ErrorBoundary;