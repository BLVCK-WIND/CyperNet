import { Component, type ErrorInfo, type ReactNode } from 'react';
import { useRouteError, useNavigate } from 'react-router-dom';
import { Button } from 'antd';
import { AlertOctagon, RotateCcw, Home } from 'lucide-react';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('CyberNet React ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gradient-to-b from-midnight via-midnight to-obsidian text-sand flex flex-col items-center justify-center p-6 text-center select-none">
          <div className="max-w-md w-full p-8 rounded-2xl bg-slate/60 border border-mist/20 shadow-2xl backdrop-blur-xl">
            <div className="w-16 h-16 rounded-full bg-danger/10 border border-danger/30 text-danger flex items-center justify-center mx-auto mb-4 animate-bounce">
              <AlertOctagon className="w-8 h-8" />
            </div>

            <h2 className="text-2xl font-bold font-['Space_Grotesk'] text-sand mb-2">
              Đã xảy ra lỗi!
            </h2>

            <p className="text-xs text-mist leading-relaxed mb-6">
              Ứng dụng gặp sự cố ngoài dự kiến trong khi hiển thị. Dữ liệu tài khoản và phiên chơi của bạn vẫn an toàn trên hệ thống.
            </p>

            {this.state.error && (
              <div className="mb-6 p-3 rounded-lg bg-midnight/90 border border-mist/10 text-left overflow-x-auto max-h-32 text-[11px] font-mono text-danger/80">
                {this.state.error.message || String(this.state.error)}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                type="primary"
                size="large"
                icon={<RotateCcw className="w-4 h-4 text-midnight" />}
                onClick={this.handleReset}
                className="w-full sm:w-auto h-11 px-5 font-bold bg-gold hover:bg-gold-light text-midnight rounded-xl border-0 shadow-lg shadow-gold/20 flex items-center justify-center gap-2"
              >
                TẢI LẠI TRANG
              </Button>

              <Button
                size="large"
                icon={<Home className="w-4 h-4 text-mist" />}
                onClick={() => {
                  window.location.href = '/customer/dashboard';
                }}
                className="w-full sm:w-auto h-11 px-5 font-semibold bg-midnight/70 hover:bg-slate text-sand rounded-xl border border-mist/20 flex items-center justify-center gap-2"
              >
                Về Trang Chủ
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * RouteErrorBoundary: Dùng cho errorElement trong React Router 7.
 * Bắt lỗi qua useRouteError() để loại bỏ triệt để hiện tượng màn hình đen (Blank Screen).
 */
export const RouteErrorBoundary: React.FC = () => {
  const error = useRouteError() as { message?: string; statusText?: string } | Error | null;
  const navigate = useNavigate();

  const errorMessage =
    (error instanceof Error && error.message) ||
    (typeof error === 'object' && error !== null && ('statusText' in error || 'message' in error)
      ? (error as { statusText?: string; message?: string }).statusText || (error as { statusText?: string; message?: string }).message
      : String(error || 'Đã xảy ra sự cố hiển thị ngoài dự kiến'));

  return (
    <div className="min-h-screen bg-gradient-to-b from-midnight via-midnight to-obsidian text-sand flex flex-col items-center justify-center p-6 text-center select-none">
      <div className="max-w-md w-full p-8 rounded-2xl bg-slate/60 border border-mist/20 shadow-2xl backdrop-blur-xl">
        <div className="w-16 h-16 rounded-full bg-danger/10 border border-danger/30 text-danger flex items-center justify-center mx-auto mb-4 animate-bounce">
          <AlertOctagon className="w-8 h-8" />
        </div>

        <h2 className="text-2xl font-bold font-['Space_Grotesk'] text-sand mb-2">
          Đã xảy ra lỗi tải trang!
        </h2>

        <p className="text-xs text-mist leading-relaxed mb-6">
          Ứng dụng gặp sự cố ngoài dự kiến khi dựng trang này. Dữ liệu tài khoản của bạn vẫn an toàn trên máy chủ.
        </p>

        {errorMessage && (
          <div className="mb-6 p-3 rounded-lg bg-midnight/90 border border-mist/10 text-left overflow-x-auto max-h-32 text-[11px] font-mono text-danger/80">
            {errorMessage}
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            type="primary"
            size="large"
            icon={<RotateCcw className="w-4 h-4 text-midnight" />}
            onClick={() => window.location.reload()}
            className="w-full sm:w-auto h-11 px-5 font-bold bg-gold hover:bg-gold-light text-midnight rounded-xl border-0 shadow-lg shadow-gold/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            TẢI LẠI TRANG
          </Button>

          <Button
            size="large"
            icon={<Home className="w-4 h-4 text-mist" />}
            onClick={() => navigate('/staff/floormap')}
            className="w-full sm:w-auto h-11 px-5 font-semibold bg-midnight/70 hover:bg-slate text-sand rounded-xl border border-mist/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            Về Sơ Đồ Máy
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ErrorBoundary;
