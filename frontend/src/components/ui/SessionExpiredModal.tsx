import React from 'react';
import { Modal, Button, Tag } from 'antd';
import { Clock, LogOut, AlertCircle, RefreshCw } from 'lucide-react';

interface SessionExpiredModalProps {
  open: boolean;
  computerCode?: string;
  onLogout: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const SessionExpiredModal: React.FC<SessionExpiredModalProps> = ({
  open,
  computerCode,
  onLogout,
  onRefresh,
  isRefreshing = false,
}) => {
  return (
    <Modal
      open={open}
      closable={false}
      mask={{ closable: false }}
      footer={null}
      centered
      width={400}
      styles={{
        body: {
          backgroundColor: '#10232A',
          padding: '24px',
          borderRadius: '16px',
        },
      }}
    >
      <div className="flex flex-col items-center text-center space-y-4">
        {/* Pulsing Alert Icon */}
        <div className="relative">
          <div className="w-16 h-16 rounded-full bg-danger/10 border border-danger/30 flex items-center justify-center text-danger animate-pulse">
            <Clock className="w-8 h-8" />
          </div>
          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-danger text-midnight flex items-center justify-center shadow">
            <AlertCircle className="w-3.5 h-3.5 stroke-[3]" />
          </div>
        </div>

        {/* Title & Description */}
        <div>
          <div className="flex items-center justify-center gap-2 mb-1.5">
            <h3 className="text-lg font-bold font-['Space_Grotesk'] text-sand m-0">
              Phiên Chơi Đã Kết Thúc
            </h3>
            {computerCode && (
              <Tag color="#EF5350" className="font-mono font-bold text-xs border-0 m-0">
                {computerCode}
              </Tag>
            )}
          </div>
          <p className="text-xs text-mist leading-relaxed max-w-xs mx-auto">
            Thời gian sử dụng máy trạm của bạn đã hết. Vui lòng nạp thêm giờ tại quầy thu ngân hoặc đăng xuất để hoàn tất phiên chơi.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="w-full space-y-2 pt-2">
          {onRefresh && (
            <Button
              type="default"
              loading={isRefreshing}
              icon={<RefreshCw className={`w-4 h-4 text-gold ${isRefreshing ? 'animate-spin' : ''}`} />}
              onClick={onRefresh}
              className="w-full h-11 rounded-xl border-mist/20 hover:border-gold text-sand font-semibold text-xs flex items-center justify-center gap-2"
            >
              Kiểm tra lại phiên (Đã nạp thêm)
            </Button>
          )}

          <Button
            type="primary"
            danger
            icon={<LogOut className="w-4 h-4" />}
            onClick={onLogout}
            className="w-full h-11 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-danger/20"
          >
            Đăng xuất & Rời máy
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default SessionExpiredModal;
