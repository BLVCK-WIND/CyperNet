import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, InputNumber, Select, Switch, Button, App, Spin } from 'antd';
import {
  Utensils,
  Coffee,
  Sparkles,
  Gamepad2,
  UploadCloud,
  Image as ImageIcon,
  X,
  AlertCircle,
} from 'lucide-react';
import { itemApi } from '@/api/itemApi';
import type { ItemResponse, ItemType, CreateItemRequest, UpdateItemRequest } from '@/types/item';

interface ItemFormModalProps {
  open: boolean;
  item: ItemResponse | null;
  onClose: () => void;
  onSuccess: () => void;
}

const ITEM_TYPES: { value: ItemType; label: string; icon: React.ReactNode; color: string }[] = [
  { value: 'FOOD', label: '🍔 Món ăn chế biến (FOOD)', icon: <Utensils className="w-4 h-4 text-amber-400" />, color: '#f59e0b' },
  { value: 'DRINK', label: '🥤 Đồ uống giải khát (DRINK)', icon: <Coffee className="w-4 h-4 text-cyan-400" />, color: '#06b6d4' },
  { value: 'PLAYTIME', label: '🎮 Gói nạp giờ chơi (PLAYTIME)', icon: <Gamepad2 className="w-4 h-4 text-emerald-400" />, color: '#10b981' },
  { value: 'SERVICE', label: '⚡ Dịch vụ & Tiện ích (SERVICE)', icon: <Sparkles className="w-4 h-4 text-purple-400" />, color: '#a855f7' },
];

export const ItemFormModal: React.FC<ItemFormModalProps> = ({
  open,
  item,
  onClose,
  onSuccess,
}) => {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const isEditing = Boolean(item);

  useEffect(() => {
    if (open) {
      if (item) {
        form.setFieldsValue({
          name: item.name,
          type: item.type,
          price: item.price,
          available: item.available,
          imageUrl: item.imageUrl || '',
        });
        setPreviewUrl(item.imageUrl || '');
      } else {
        form.resetFields();
        form.setFieldsValue({
          type: 'FOOD',
          price: 20000,
          available: true,
          imageUrl: '',
        });
        setPreviewUrl('');
      }
    }
  }, [open, item, form]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate size < 5MB
    if (file.size > 5 * 1024 * 1024) {
      message.error('Kích thước ảnh không được vượt quá 5MB!');
      return;
    }

    try {
      setIsUploading(true);
      const res = await itemApi.uploadItemImage(file);
      const uploadedUrl = res.fileUrl;
      form.setFieldValue('imageUrl', uploadedUrl);
      setPreviewUrl(uploadedUrl);
      message.success('Tải ảnh đại diện thành công!');
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || 'Không thể tải ảnh lên máy chủ!';
      message.error(errorMsg);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = () => {
    form.setFieldValue('imageUrl', '');
    setPreviewUrl('');
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setIsSubmitting(true);

      const payload: CreateItemRequest | UpdateItemRequest = {
        name: values.name.trim(),
        type: values.type,
        price: Number(values.price),
        available: Boolean(values.available),
        imageUrl: values.imageUrl?.trim() || undefined,
      };

      if (isEditing && item) {
        await itemApi.updateItem(item.id, payload);
        message.success(`Đã cập nhật món "${payload.name}" thành công!`);
      } else {
        await itemApi.createItem(payload as CreateItemRequest);
        message.success(`Đã thêm món mới "${payload.name}" vào thực đơn!`);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      if (err?.errorFields) return; // Validation error form
      const errorMsg = err?.response?.data?.message || 'Đã xảy ra lỗi khi lưu thông tin món ăn!';
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
      width={560}
      centered
      className="twinkle-modal"
      title={
        <div className="flex items-center gap-3 text-sand border-b border-mist/20 pb-3">
          <div className="w-9 h-9 rounded-xl bg-gold/20 border border-gold/40 flex items-center justify-center text-gold">
            <Utensils className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-heading font-bold text-sand">
              {isEditing ? 'Chỉnh Sửa Mặt Hàng' : 'Thêm Mặt Hàng Vào Thực Đơn'}
            </h2>
            <p className="text-xs text-mist font-normal">
              {isEditing ? `Cập nhật thông tin mã món #${item?.id}` : 'Điền đầy đủ thông tin bên dưới để mở bán'}
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
        {/* Tên món */}
        <Form.Item
          name="name"
          label={<span className="text-xs font-semibold uppercase tracking-wider text-sand/90">Tên món / Gói dịch vụ <span className="text-red-400">*</span></span>}
          rules={[
            { required: true, message: 'Vui lòng nhập tên món!' },
            { max: 100, message: 'Tên món tối đa 100 ký tự!' },
          ]}
        >
          <Input
            placeholder="Ví dụ: Mì tôm trứng bò khô, Cà phê sữa đá, Gói nạp 2 giờ chơi..."
            className="h-10 rounded-xl bg-midnight/70 border-mist/30 text-sand placeholder:text-mist/50 hover:border-gold focus:border-gold"
          />
        </Form.Item>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Phân loại */}
          <Form.Item
            name="type"
            label={<span className="text-xs font-semibold uppercase tracking-wider text-sand/90">Phân loại <span className="text-red-400">*</span></span>}
            rules={[{ required: true, message: 'Vui lòng chọn phân loại!' }]}
          >
            <Select
              className="h-10 w-full"
              options={ITEM_TYPES.map((t) => ({
                value: t.value,
                label: (
                  <div className="flex items-center gap-2">
                    {t.icon}
                    <span>{t.label}</span>
                  </div>
                ),
              }))}
            />
          </Form.Item>

          {/* Đơn giá */}
          <Form.Item
            name="price"
            label={<span className="text-xs font-semibold uppercase tracking-wider text-sand/90">Đơn giá (VNĐ) <span className="text-red-400">*</span></span>}
            rules={[
              { required: true, message: 'Vui lòng nhập giá bán!' },
              { type: 'number', min: 0, message: 'Giá bán không được âm!' },
            ]}
          >
            <InputNumber
              className="h-10 w-full rounded-xl bg-midnight/70 border-mist/30 text-sand hover:border-gold focus:border-gold flex items-center"
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => (value ? Number(value.replace(/,/g, '')) : 0)}
              step={1000}
              placeholder="20,000"
              addonAfter={<span className="text-sand/80 font-mono text-xs">₫</span>}
            />
          </Form.Item>
        </div>

        {/* Trạng thái Còn hàng / Hết hàng */}
        <Form.Item
          name="available"
          valuePropName="checked"
          className="mb-2 p-3 rounded-xl bg-black/20 border border-white/5 flex items-center justify-between"
        >
          <div className="flex items-center justify-between w-full">
            <div className="space-y-0.5">
              <div className="text-sm font-semibold text-sand">Mở bán (Còn hàng)</div>
              <div className="text-xs text-mist">
                Bật để khách hàng có thể nhìn thấy và đặt món trên điện thoại
              </div>
            </div>
            <Switch
              checkedChildren="CÒN"
              unCheckedChildren="HẾT"
              className="bg-mist/30"
            />
          </div>
        </Form.Item>

        {/* Ảnh đại diện món ăn */}
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-sand/90 block">
            Ảnh minh họa món ăn
          </label>

          <div className="flex items-start gap-4 p-3 rounded-xl bg-black/20 border border-white/5">
            {/* Box Preview */}
            <div className="w-24 h-24 rounded-xl border border-white/10 bg-midnight/80 flex items-center justify-center overflow-hidden shrink-0 relative group">
              {isUploading ? (
                <Spin size="small" />
              ) : previewUrl ? (
                <>
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={() => setPreviewUrl('')}
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 hover:bg-red-500 text-sand flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
                    title="Xóa ảnh"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center text-mist/60 text-xs">
                  <ImageIcon className="w-6 h-6 mb-1" />
                  <span>Chưa có ảnh</span>
                </div>
              )}
            </div>

            {/* Upload & Link controls */}
            <div className="flex-1 space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleFileUpload}
                className="hidden"
              />

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  icon={<UploadCloud className="w-4 h-4" />}
                  onClick={() => fileInputRef.current?.click()}
                  loading={isUploading}
                  className="rounded-xl border-mist/30 hover:border-gold hover:text-gold text-sand text-xs h-9 bg-midnight/50"
                >
                  {isUploading ? 'Đang tải lên...' : 'Tải ảnh từ máy'}
                </Button>
                <span className="text-xs text-mist/70">JPG, PNG, WEBP (Tối đa 5MB)</span>
              </div>

              <Form.Item name="imageUrl" noStyle>
                <Input
                  placeholder="Hoặc dán URL ảnh trực tiếp (https://...)"
                  onChange={(e) => setPreviewUrl(e.target.value.trim())}
                  className="h-8 rounded-lg bg-midnight/70 border-mist/30 text-sand placeholder:text-mist/40 text-xs"
                />
              </Form.Item>
            </div>
          </div>
        </div>

        {/* Chú thích gói giờ chơi */}
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            <strong>Lưu ý cho món PLAYTIME:</strong> Nếu đặt tên dạng "Gói nạp 2 giờ chơi", hệ thống sẽ tự động trích xuất số giờ quy đổi để cộng vào phiên chơi của khách khi duyệt đơn.
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
            {isEditing ? 'Lưu Thay Đổi' : 'Mở Bán Mặt Hàng'}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};
