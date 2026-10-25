import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Input, Skeleton, Button, Badge, App } from 'antd';
import {
  ArrowLeft,
  Search,
  UtensilsCrossed,
  RefreshCw,
  ReceiptText,
  Utensils,
  Coffee,
  Clock,
  Gamepad2,
  Sparkles,
} from 'lucide-react';
import { itemApi } from '@/api/itemApi';
import { orderApi } from '@/api/orderApi';
import { MenuCard } from '../components/MenuCard';
import { MenuFilterTabs, type FilterCategory } from '../components/MenuFilterTabs';
import { CartDrawer } from '../components/CartDrawer';
import { FloatingCartButton } from '../components/FloatingCartButton';
import { QrPaymentModal } from '../components/QrPaymentModal';
import { GlassCard } from '@/components/ui/GlassCard';
import { PageTransition } from '@/components/animations/PageTransition';
import { StaggerContainer, StaggerItem } from '@/components/animations/StaggerContainer';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import type { ItemResponse, ItemType } from '@/types/item';
import type { OrderResponse, VietQrResponse } from '@/types/order';

interface CategorySectionConfig {
  key: ItemType;
  label: string;
  icon: React.ReactNode;
}

const CATEGORY_SECTIONS: CategorySectionConfig[] = [
  { key: 'FOOD', label: 'Món ăn nóng', icon: <Utensils className="w-4 h-4 text-gold" /> },
  { key: 'DRINK', label: 'Đồ uống giải khát', icon: <Coffee className="w-4 h-4 text-gold" /> },
  { key: 'PLAYTIME', label: 'Gói giờ chơi & Combo', icon: <Clock className="w-4 h-4 text-gold" /> },
  { key: 'SERVICE', label: 'Dịch vụ & Tiện ích', icon: <Gamepad2 className="w-4 h-4 text-gold" /> },
];

export const CustomerMenuPage: React.FC = () => {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const { sessionId } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<FilterCategory>('ALL');

  useDocumentTitle('Thực đơn món & dịch vụ');

  // Quản lý giỏ hàng và Modal thanh toán
  const { addItem, isOpen, setIsOpen } = useCartStore();
  const [createdOrder, setCreatedOrder] = useState<OrderResponse | null>(null);
  const [vietQrData, setVietQrData] = useState<VietQrResponse | null>(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  // Tra cứu thực đơn từ API
  const {
    data: pageData,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['menu-items'],
    queryFn: () => itemApi.getAllItems({ page: 0, size: 100 }),
    staleTime: 60000,
  });

  // Tra cứu số lượng đơn hàng đang chờ xử lý trong phiên để hiện badge góc trên bên phải
  const { data: ordersPage } = useQuery({
    queryKey: ['session-orders', sessionId],
    queryFn: () => orderApi.getOrdersBySession(sessionId!),
    enabled: Boolean(sessionId),
    refetchInterval: 15000,
  });

  const pendingOrdersCount = useMemo(() => {
    return ordersPage?.content?.filter((o) => o.status === 'PENDING_PAYMENT').length || 0;
  }, [ordersPage]);

  const allItems: ItemResponse[] = useMemo(() => {
    return pageData?.content || [];
  }, [pageData]);

  // Đếm số lượng món theo từng loại
  const counts = useMemo(() => {
    const map: Partial<Record<FilterCategory, number>> = {
      ALL: allItems.length,
      FOOD: 0,
      DRINK: 0,
      PLAYTIME: 0,
      SERVICE: 0,
    };
    allItems.forEach((item) => {
      if (map[item.type] !== undefined) {
        map[item.type] = (map[item.type] || 0) + 1;
      }
    });
    return map;
  }, [allItems]);

  // Lọc món theo tab danh mục và từ khóa tìm kiếm
  const filteredItems = useMemo(() => {
    return allItems.filter((item) => {
      const matchCategory =
        activeCategory === 'ALL' || item.type === activeCategory;
      const matchSearch =
        !searchTerm.trim() ||
        item.name.toLowerCase().includes(searchTerm.trim().toLowerCase());

      return matchCategory && matchSearch;
    });
  }, [allItems, activeCategory, searchTerm]);

  // Gom nhóm theo từng Category khi ở tab "Tất cả"
  const groupedSections = useMemo(() => {
    const list: { key: string; label: string; icon: React.ReactNode; items: ItemResponse[] }[] = [];

    CATEGORY_SECTIONS.forEach((cat) => {
      const items = filteredItems.filter((i) => i.type === cat.key);
      if (items.length > 0) {
        list.push({ ...cat, items });
      }
    });

    // Fallback cho bất kỳ loại dịch vụ mới nào khác từ DB
    const knownKeys = new Set(CATEGORY_SECTIONS.map((c) => c.key));
    const otherItems = filteredItems.filter((i) => !knownKeys.has(i.type));
    if (otherItems.length > 0) {
      list.push({
        key: 'OTHER',
        label: 'Dịch vụ & Tiện ích khác',
        icon: <Sparkles className="w-4 h-4 text-gold" />,
        items: otherItems,
      });
    }

    return list;
  }, [filteredItems]);

  const handleAddToCart = (item: ItemResponse) => {
    addItem(item);
    message.success(`Đã thêm "${item.name}" vào giỏ hàng!`);
  };

  const handleOrderSuccess = (order: OrderResponse, qr: VietQrResponse | null) => {
    setCreatedOrder(order);
    if (qr) {
      setVietQrData(qr);
      setIsQrModalOpen(true);
    } else {
      message.success(`Tạo đơn #${order.id} thành công! Nhân viên sẽ phục vụ tại máy.`);
      navigate('/customer/orders');
    }
  };

  const handlePaymentCompleted = () => {
    setIsQrModalOpen(false);
    message.success('Cảm ơn bạn! Đơn hàng đang được quầy xử lý.');
    navigate('/customer/orders');
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-b from-midnight via-midnight to-obsidian text-sand flex flex-col justify-between selection:bg-gold selection:text-midnight">
        {/* 1. TOP HEADER & SEARCH */}
        <header className="sticky top-0 z-30 glass-panel border-b border-mist/15 px-4 sm:px-6 py-3.5 backdrop-blur-md">
          <div className="max-w-4xl mx-auto space-y-3">
            <div className="flex items-center justify-between gap-3">
              {/* Left: Back button & Title */}
              <div className="flex items-center gap-3">
                <Button
                  type="text"
                  shape="circle"
                  icon={<ArrowLeft className="w-5 h-5 text-sand" />}
                  onClick={() => navigate('/customer/dashboard')}
                  className="hover:bg-slate/60 text-sand flex items-center justify-center cursor-pointer"
                  aria-label="Quay lại Dashboard"
                />
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold font-['Space_Grotesk'] text-sand m-0">
                    Thực Đơn <span className="text-gold">F&B</span>
                  </h1>
                  <span className="text-[11px] text-mist block">
                    Đặt món & dịch vụ phục vụ trực tiếp tại máy
                  </span>
                </div>
              </div>

              {/* Right: Order History Icon with Badge */}
              <div className="flex items-center">
                <Badge
                  count={pendingOrdersCount}
                  overflowCount={99}
                  color="#F59E0B"
                  offset={[-2, 4]}
                >
                  <button
                    type="button"
                    onClick={() => navigate('/customer/orders')}
                    className="w-10 h-10 rounded-xl bg-slate/60 hover:bg-slate border border-mist/20 hover:border-gold/40 text-sand flex items-center justify-center transition-all duration-200 cursor-pointer shadow-sm hover:scale-105 active:scale-95"
                    aria-label={`Xem đơn hàng (${pendingOrdersCount} đơn chờ)`}
                  >
                    <ReceiptText className="w-5 h-5 text-gold shrink-0" />
                  </button>
                </Badge>
              </div>
            </div>

            {/* Search Box */}
            <div className="w-full">
              <Input
                size="large"
                placeholder="Tìm kiếm món ăn, nước uống, combo..."
                prefix={<Search className="w-4 h-4 text-mist mr-1" />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                allowClear
                className="bg-midnight/70 text-sand border-mist/20 hover:border-gold/50 focus:border-gold h-11 text-sm rounded-xl"
              />
            </div>

            {/* Filter Tabs */}
            <MenuFilterTabs
              activeTab={activeCategory}
              onTabChange={setActiveCategory}
              counts={counts}
            />
          </div>
        </header>

        {/* 2. MENU GRID */}
        <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 pb-28">
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-4">
              {Array.from({ length: 8 }).map((_, idx) => (
                <GlassCard key={idx} className="p-4 rounded-xl">
                  <Skeleton active paragraph={{ rows: 3 }} />
                </GlassCard>
              ))}
            </div>
          ) : isError ? (
            <GlassCard elevated className="text-center py-12 border-danger/30 max-w-md mx-auto">
              <p className="text-danger font-semibold mb-2">Không thể tải danh sách thực đơn!</p>
              <p className="text-xs text-mist mb-4">Vui lòng kiểm tra lại kết nối mạng hoặc thử lại.</p>
              <Button
                type="primary"
                icon={<RefreshCw className="w-4 h-4 mr-1" />}
                onClick={() => refetch()}
                className="bg-gold text-midnight border-0"
              >
                Thử lại
              </Button>
            </GlassCard>
          ) : filteredItems.length === 0 ? (
            <GlassCard className="text-center py-16 max-w-md mx-auto border-mist/15">
              <div className="w-12 h-12 rounded-full bg-slate/60 text-gold flex items-center justify-center mx-auto mb-3 border border-gold/30">
                <UtensilsCrossed className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-sand mb-1">
                Không tìm thấy món phù hợp
              </h3>
              <p className="text-xs text-mist mb-4">
                {searchTerm
                  ? `Không có kết quả nào khớp với "${searchTerm}"`
                  : 'Danh mục này hiện chưa có món nào.'}
              </p>
              {(searchTerm || activeCategory !== 'ALL') && (
                <Button
                  size="small"
                  onClick={() => {
                    setSearchTerm('');
                    setActiveCategory('ALL');
                  }}
                  className="text-xs border-gold/40 text-sand hover:text-gold"
                >
                  Xóa bộ lọc tìm kiếm
                </Button>
              )}
            </GlassCard>
          ) : activeCategory === 'ALL' ? (
            <div className="space-y-8">
              {groupedSections.map((section) => (
                <section key={section.key} className="space-y-3.5">
                  {/* Category Section Header */}
                  <div className="flex items-center justify-between pb-2.5 border-b border-mist/15">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-gold/15 flex items-center justify-center border border-gold/30">
                        {section.icon}
                      </div>
                      <h2 className="text-sm sm:text-base font-bold text-sand tracking-wide">
                        {section.label}
                      </h2>
                    </div>
                    <span className="text-[11px] font-semibold text-mist bg-slate/60 px-2.5 py-0.5 rounded-full border border-mist/15 font-mono">
                      {section.items.length} món
                    </span>
                  </div>

                  {/* Category Items Grid */}
                  <StaggerContainer className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-4">
                    {section.items.map((item) => (
                      <StaggerItem key={item.id}>
                        <MenuCard
                          item={item}
                          onAddToCart={handleAddToCart}
                        />
                      </StaggerItem>
                    ))}
                  </StaggerContainer>
                </section>
              ))}
            </div>
          ) : (
            <StaggerContainer className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-4">
              {filteredItems.map((item) => (
                <StaggerItem key={item.id}>
                  <MenuCard
                    item={item}
                    onAddToCart={handleAddToCart}
                  />
                </StaggerItem>
              ))}
            </StaggerContainer>
          )}
        </main>

        {/* 3. FLOATING CART BUTTON & DRAWERS */}
        <FloatingCartButton />

        <CartDrawer
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          onOrderSuccess={handleOrderSuccess}
        />

        <QrPaymentModal
          isOpen={isQrModalOpen}
          onClose={() => setIsQrModalOpen(false)}
          order={createdOrder}
          vietQr={vietQrData}
          onConfirmPaid={handlePaymentCompleted}
        />

        {/* 4. FOOTER (Desktop only) */}
        <footer className="hidden sm:block py-4 text-center text-xs text-mist/60 border-t border-mist/10 mt-auto bg-midnight/80">
          CyberNet F&B Service • Gọi món nhanh chóng — Giao tận bàn
        </footer>
      </div>
    </PageTransition>
  );
};

export default CustomerMenuPage;
