import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, Button, App, Tag } from 'antd';
import {
  UserPlus,
  Edit3,
  Phone,
  User,
  Lock,
  Shield,
  Zap,
  AlertCircle,
  Crown,
  UserCheck,
} from 'lucide-react';
import { accountApi } from '@/api/accountApi';
import { useAuthStore } from '@/store/authStore';
import type { Account, Role, CreateAccountRequest, UpdateAccountRequest } from '@/types/auth';

interface AccountFormModalProps {
  open: boolean;
  account: Account | null;
  onClose: () => void;
  onSuccess: () => void;
}

const ROLE_OPTIONS: { value: Role; label: string; icon: React.ReactNode; color: string; desc: string }[] = [
  {
    value: 'CUSTOMER',
    label: '👤 Hội Viên (CUSTOMER)',
    icon: <UserCheck className="w-4 h-4 text-gold" />,
    color: '#bd9875',
    desc: 'Khách chơi máy trạm, quét QR đặt món, tích lũy giờ chơi',
  },
  {
    value: 'STAFF',
    label: '🛡️ Nhân Viên Ca Trực (STAFF)',
    icon: <Shield className="w-4 h-4 text-cyan-400" />,
    color: '#06b6d4',
    desc: 'Thu ngân quầy POS, mở máy, duyệt đơn F&B, nạp giờ',
  },
  {
    value: 'ADMIN',
    label: '👑 Quản Trị Viên (ADMIN)',
    icon: <Crown className="w-4 h-4 text-red-400" />,
    color: '#ef4444',
    desc: 'Toàn quyền cấu hình máy, thực đơn, nhân sự và báo cáo doanh thu',
  },
];

export const AccountFormModal: React.FC<AccountFormModalProps> = ({
  open,
  account,
  onClose,
  onSuccess,
}) => {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const currentUserId = useAuthStore((s) => s.user?.id);

  const isEditing = Boolean(account);
  const isEditingSelf = Boolean(account && account.id === currentUserId);

  useEffect(() => {
    if (open) {
      if (account) {
        form.setFieldsValue({
          phone: account.phone,
          name: account.name,
          role: account.role,
          password: '',
        });
      } else {
        form.resetFields();
        form.setFieldsValue({
          role: 'STAFF',
          password: '',
        });
      }
    }
  }, [open, account, form]);

  // Nhanh chóng điền mật khẩu mặc định
  const handleQuickFillPassword = (pwd: string) => {
    form.setFieldValue('password', pwd);
  };

  // Điền 4 số cuối SĐT làm mật khẩu
  const handleFillPhoneSuffix = () => {
    const phoneVal = form.getFieldValue('phone');
    if (phoneVal && phoneVal.length >= 4) {
      const suffix = phoneVal.slice(-4);
      form.setFieldValue('password', suffix);
    } else {
      message.warning('Vui lòng nhập số điện thoại trước!');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setIsSubmitting(true);

      if (isEditing && account) {
        const payload: UpdateAccountRequest = {
          name: values.name.trim(),
          password: values.password?.trim() ? values.password.trim() : undefined,
          role: isEditingSelf ? account.role : values.role, // Chống tự đổi role của chính mình
        };

        await accountApi.updateAccount(account.id, payload);
        message.success(`Đã cập nhật thông tin tài khoản ${account.phone} thành công!`);
      } else {
        const payload: CreateAccountRequest = {
          phone: values.phone.trim(),
          name: values.name.trim(),
          password: values.password.trim(),
          role: values.role,
        };

        await accountApi.createAccount(payload);
        message.success(`Đã khởi tạo tài khoản ${payload.phone} (${payload.role}) thành công!`);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      if (err?.errorFields) return;
      const errorMsg = err?.response?.data?.message || 'Đã xảy ra lỗi khi lưu thông tin tài khoản!';
      message.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      destroyOnClose
      width={520}
      centered
      className="twinkle-modal"
      title={
        <div className="flex items-center gap-3 text-sand border-b border-mist/20 pb-3">
          <div className="w-9 h-9 rounded-xl bg-gold/20 border border-gold/40 flex items-center justify-center text-gold">
            {isEditing ? <Edit3 className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
          </div>
          <div>
            <h2 className="text-lg font-heading font-bold text-sand">
              {isEditing ? 'Cập Nhật Tài Khoản' : 'Cấp Tài Khoản Mới'}
            </h2>
            <p className="text-xs text-mist font-normal">
              {isEditing
                ? `Chỉnh sửa thông tin tài khoản #${account?.id} (${account?.phone})`
                : 'Khởi tạo tài khoản nhân viên hoặc quản trị viên mới'}
            </p>
          </div>
        </div>
      }
    >
      <Form
        form={form}
        layout="vertical"
        className="mt-4 space-y-4"
        requiredMark={false}
      >
        {/* Số điện thoại */}
        <Form.Item
          name="phone"
          label={
            <span className="text-xs font-semibold uppercase tracking-wider text-sand/90">
              Số Điện Thoại Đăng Nhập <span className="text-red-400">*</span>
            </span>
          }
          rules={[
            { required: true, message: 'Vui lòng nhập số điện thoại!' },
            { pattern: /^[0-9]{9,11}$/, message: 'Số điện thoại phải từ 9 đến 11 chữ số!' },
          ]}
        >
          <Input
            prefix={<Phone className="w-4 h-4 text-mist/60 mr-1" />}
            placeholder="Ví dụ: 0901234567"
            disabled={isEditing}
            maxLength={11}
            className="h-10 rounded-xl bg-midnight/70 border-mist/30 text-sand placeholder:text-mist/50 hover:border-gold focus:border-gold disabled:bg-black/30 disabled:text-mist"
          />
        </Form.Item>

        {/* Tên tài khoản */}
        <Form.Item
          name="name"
          label={
            <span className="text-xs font-semibold uppercase tracking-wider text-sand/90">
              Họ Và Tên <span className="text-red-400">*</span>
            </span>
          }
          rules={[
            { required: true, message: 'Vui lòng nhập họ và tên!' },
            { min: 2, max: 100, message: 'Tên phải từ 2 đến 100 ký tự!' },
          ]}
        >
          <Input
            prefix={<User className="w-4 h-4 text-mist/60 mr-1" />}
            placeholder="Ví dụ: Nguyễn Văn Thu Ngân, Lê Quản Trị..."
            className="h-10 rounded-xl bg-midnight/70 border-mist/30 text-sand placeholder:text-mist/50 hover:border-gold focus:border-gold"
          />
        </Form.Item>

        {/* Vai trò (Role) */}
        <Form.Item
          name="role"
          label={
            <span className="text-xs font-semibold uppercase tracking-wider text-sand/90 flex items-center justify-between w-full">
              <span>Phân Quyền Vai Trò <span className="text-red-400">*</span></span>
              {isEditingSelf && (
                <Tag color="warning" className="m-0 text-[10px] rounded-full border-0">
                  Tài khoản của bạn (Không thể đổi role)
                </Tag>
              )}
            </span>
          }
          rules={[{ required: true, message: 'Vui lòng chọn vai trò!' }]}
        >
          <Select
            disabled={isEditingSelf}
            className="h-10 w-full"
            options={ROLE_OPTIONS.map((r) => ({
              value: r.value,
              label: (
                <div className="flex items-center gap-2">
                  {r.icon}
                  <span className="font-semibold">{r.label}</span>
                </div>
              ),
            }))}
          />
        </Form.Item>

        {/* Mật khẩu */}
        <Form.Item
          name="password"
          label={
            <span className="text-xs font-semibold uppercase tracking-wider text-sand/90 flex items-center justify-between w-full">
              <span>
                {isEditing ? 'Đổi Mật Khẩu Mới' : 'Mật Khẩu Đăng Nhập'} {!isEditing && <span className="text-red-400">*</span>}
              </span>
              <span className="text-[11px] text-mist font-normal">
                {isEditing ? '(Để trống nếu không đổi)' : '(Tối thiểu 4 ký tự)'}
              </span>
            </span>
          }
          rules={[
            { required: !isEditing, message: 'Vui lòng nhập mật khẩu!' },
            {
              validator: (_, val) => {
                if (val && val.length < 4) {
                  return Promise.reject(new Error('Mật khẩu phải từ 4 ký tự trở lên!'));
                }
                return Promise.resolve();
              },
            },
          ]}
        >
          <Input.Password
            prefix={<Lock className="w-4 h-4 text-mist/60 mr-1" />}
            placeholder={isEditing ? 'Nhập mật khẩu mới nếu muốn đổi...' : 'Nhập mật khẩu khởi tạo...'}
            className="h-10 rounded-xl bg-midnight/70 border-mist/30 text-sand placeholder:text-mist/50 hover:border-gold focus:border-gold"
          />
        </Form.Item>

        {/* Phím tắt điền nhanh mật khẩu */}
        <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-black/20 border border-white/5">
          <span className="text-xs text-mist flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-gold" />
            Điền nhanh:
          </span>
          <Button
            size="small"
            onClick={() => handleQuickFillPassword('123456')}
            className="rounded-lg text-xs h-7 border-mist/30 text-sand hover:border-gold hover:text-gold bg-midnight/50"
          >
            123456
          </Button>
          <Button
            size="small"
            onClick={() => handleQuickFillPassword('admin123')}
            className="rounded-lg text-xs h-7 border-mist/30 text-sand hover:border-gold hover:text-gold bg-midnight/50"
          >
            admin123
          </Button>
          <Button
            size="small"
            onClick={handleFillPhoneSuffix}
            className="rounded-lg text-xs h-7 border-gold/40 text-gold hover:bg-gold/10 bg-gold/5"
          >
            4 số cuối SĐT
          </Button>
        </div>

        {/* Cảnh báo an toàn phân quyền */}
        <div className="p-3 rounded-xl bg-midnight/80 border border-mist/20 text-xs text-mist leading-relaxed flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-gold shrink-0 mt-0.5" />
          <span>
            <strong>Lưu ý bảo mật RBAC:</strong> Tài khoản vai trò <strong>ADMIN</strong> có toàn quyền kiểm soát hệ thống. Tài khoản <strong>STAFF</strong> chỉ có quyền trên phân hệ quầy thu ngân.
          </span>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-mist/20">
          <Button
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-xl h-10 px-5 border-mist/30 text-sand hover:border-mist"
          >
            Hủy Bỏ
          </Button>
          <Button
            type="primary"
            onClick={handleSubmit}
            loading={isSubmitting}
            className="rounded-xl h-10 px-6 bg-gold hover:bg-gold-light text-midnight font-bold border-0 shadow-lg shadow-gold/20"
          >
            {isEditing ? 'Lưu Thay Đổi' : 'Tạo Tài Khoản'}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};
