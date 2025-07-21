import { useState } from "preact/hooks";
import { apply } from "twind";

// タイプ定義
interface Venue {
  id: number;
  name: string;
  category: string;
  address: string;
  rating: number;
  priceRange: string;
  distance: number;
  description: string;
  tags: string[];
  isOpen: boolean;
  isFavorite?: boolean;
}

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  actionLabel?: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  bio: string;
  stats: {
    visitedVenues: number;
    totalReviews: number;
    averageRating: number;
    helpfulVotes: number;
  };
}

// UIコンポーネント
const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  onClick, 
  className = '',
  disabled = false 
}: {
  children: preact.ComponentChildren;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}) => {
  const variants = {
    primary: 'btn-pink',
    secondary: 'bg-pink-secondary text-white hover:bg-pink-secondary-dark',
    outline: 'btn-pink-outline',
    ghost: 'text-pink-primary hover:bg-pink-light',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      class={apply`${variants[variant]} ${sizes[size]} rounded-md transition-all duration-200 ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      {children}
    </button>
  );
};

const Card = ({ 
  children, 
  variant = 'default', 
  className = '' 
}: {
  children: preact.ComponentChildren;
  variant?: 'default' | 'soft' | 'elevated';
  className?: string;
}) => {
  const variants = {
    default: 'card-soft',
    soft: 'bg-surface-soft rounded-lg p-4 shadow-soft border border-border-light',
    elevated: 'card-elevated',
  };

  return (
    <div class={apply`${variants[variant]} ${className}`}>
      {children}
    </div>
  );
};

const Badge = ({ 
  children, 
  variant = 'default', 
  size = 'md' 
}: {
  children: preact.ComponentChildren;
  variant?: 'default' | 'pink' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}) => {
  const variants = {
    default: 'bg-gray-100 text-gray-700',
    pink: 'badge-pink',
    outline: 'border border-pink-primary text-pink-primary bg-transparent',
  };

  const sizes = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  return (
    <span class={apply`${variants[variant]} ${sizes[size]} rounded-full font-medium inline-flex items-center`}>
      {children}
    </span>
  );
};

// スクリーン
const SearchScreen = ({ venues, onVenueSelect }: { venues: Venue[]; onVenueSelect: (venue: Venue) => void }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const categories = [
    { id: 'all', label: 'すべて', icon: '🏪' },
    { id: 'bar', label: 'バー', icon: '🍸' },
    { id: 'club', label: 'クラブ', icon: '🎵' },
    { id: 'lounge', label: 'ラウンジ', icon: '🛋️' },
    { id: 'restaurant', label: 'レストラン', icon: '🍽️' },
    { id: 'karaoke', label: 'カラオケ', icon: '🎤' },
    { id: 'pub', label: 'パブ', icon: '🍺' },
  ];

  const filteredVenues = venues.filter(venue => {
    const matchesSearch = venue.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         venue.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || venue.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      bar: '🍸',
      club: '🎵',
      lounge: '🛋️',
      restaurant: '🍽️',
      karaoke: '🎤',
      pub: '🍺',
    };
    return icons[category] || '🏪';
  };

  const getPriceRangeLabel = (priceRange: string) => {
    const labels: Record<string, string> = {
      budget: '¥',
      moderate: '¥¥',
      expensive: '¥¥¥',
      luxury: '¥¥¥¥',
    };
    return labels[priceRange] || '¥';
  };

  return (
    <div class="h-full flex flex-col">
      {/* 検索ヘッダー */}
      <div class="p-4 bg-white border-b border-border-light">
        <h2 class={apply`text-xl font-heading font-semibold text-pink-primary mb-4`}>
          店舗検索
        </h2>
        
        {/* 検索バー */}
        <div class="relative mb-4">
          <input
            type="text"
            placeholder="店舗名で検索..."
            value={searchQuery}
            onInput={(e) => setSearchQuery((e.target as HTMLInputElement).value)}
            class={apply`w-full px-4 py-3 pl-10 rounded-lg border border-border-medium focus:border-pink-primary focus:ring-2 focus:ring-pink-primary focus:ring-opacity-20 transition-all`}
          />
          <span class="absolute left-3 top-3.5 text-pink-primary">🔍</span>
        </div>

        {/* カテゴリフィルター */}
        <div class="flex gap-2 overflow-x-auto pb-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setCategoryFilter(category.id)}
              class={apply`flex items-center gap-2 px-3 py-2 rounded-lg whitespace-nowrap transition-all ${
                categoryFilter === category.id
                  ? 'bg-pink-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-pink-light'
              }`}
            >
              <span>{category.icon}</span>
              <span class="text-sm font-medium">{category.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 検索結果 */}
      <div class="flex-1 overflow-y-auto p-4">
        <p class={apply`text-sm text-text-secondary mb-4`}>
          {filteredVenues.length}件の店舗が見つかりました
        </p>
        
        <div class="space-y-4">
          {filteredVenues.map((venue) => (
            <Card key={venue.id} className="cursor-pointer hover:shadow-pink transition-all duration-200" onClick={() => onVenueSelect(venue)}>
              <div class="flex justify-between items-start mb-3">
                <div class="flex-1">
                  <h3 class={apply`text-lg font-semibold text-pink-primary mb-1`}>
                    {getCategoryIcon(venue.category)} {venue.name}
                  </h3>
                  <p class={apply`text-sm text-text-secondary mb-2`}>
                    {venue.address}
                  </p>
                </div>
                <Badge variant="pink" size="sm">
                  {venue.rating} ★
                </Badge>
              </div>
              
              <p class={apply`text-sm text-text-primary mb-3 leading-relaxed`}>
                {venue.description}
              </p>
              
              <div class="flex justify-between items-center">
                <div class="flex gap-2">
                  <Badge variant="outline" size="sm">
                    {getPriceRangeLabel(venue.priceRange)}
                  </Badge>
                  <Badge variant="outline" size="sm">
                    {venue.distance}m
                  </Badge>
                  <Badge variant={venue.isOpen ? 'default' : 'outline'} size="sm">
                    {venue.isOpen ? '営業中' : '営業時間外'}
                  </Badge>
                </div>
                <div class="flex gap-2">
                  {venue.tags.slice(0, 2).map((tag, index) => (
                    <Badge key={index} variant="outline" size="sm">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
        
        {filteredVenues.length === 0 && (
          <div class="text-center py-12">
            <div class="text-4xl mb-4">🔍</div>
            <p class={apply`text-text-secondary`}>
              検索条件に一致する店舗が見つかりませんでした
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

const MapScreen = () => {
  return (
    <div class="h-full flex items-center justify-center bg-pink-light">
      <div class="text-center">
        <div class="text-6xl mb-4">🗺️</div>
        <h2 class={apply`text-2xl font-heading font-semibold text-pink-primary mb-2`}>
          地図表示
        </h2>
        <p class={apply`text-text-secondary`}>
          インタラクティブな地図機能
        </p>
      </div>
    </div>
  );
};

const FavoritesScreen = ({ favorites, onRemoveFavorite }: { favorites: Venue[]; onRemoveFavorite: (id: number) => void }) => {
  return (
    <div class="h-full flex flex-col">
      <div class="p-4 bg-white border-b border-border-light">
        <h2 class={apply`text-xl font-heading font-semibold text-pink-primary mb-2`}>
          お気に入り
        </h2>
        <p class={apply`text-sm text-text-secondary`}>
          {favorites.length}件のお気に入り
        </p>
      </div>
      
      <div class="flex-1 overflow-y-auto p-4">
        {favorites.length > 0 ? (
          <div class="space-y-4">
            {favorites.map((venue) => (
              <Card key={venue.id}>
                <div class="flex justify-between items-start mb-3">
                  <div class="flex-1">
                    <h3 class={apply`text-lg font-semibold text-pink-primary mb-1`}>
                      ❤️ {venue.name}
                    </h3>
                    <p class={apply`text-sm text-text-secondary`}>
                      評価: {venue.rating} ★
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveFavorite(venue.id)}
                    className="text-red-500 hover:bg-red-50"
                  >
                    削除
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div class="text-center py-12">
            <div class="text-4xl mb-4">💔</div>
            <p class={apply`text-text-secondary`}>
              まだお気に入りがありません
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

const NotificationScreen = ({ notifications, onMarkAsRead }: { notifications: Notification[]; onMarkAsRead: (id: number) => void }) => {
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getNotificationIcon = (type: string) => {
    const icons: Record<string, string> = {
      new_venue: '🏪',
      review: '⭐',
      event: '🎉',
      promotion: '🎁',
      reminder: '⏰',
    };
    return icons[type] || '📢';
  };

  return (
    <div class="h-full flex flex-col">
      <div class="p-4 bg-white border-b border-border-light">
        <h2 class={apply`text-xl font-heading font-semibold text-pink-primary mb-2`}>
          通知
        </h2>
        <p class={apply`text-sm text-text-secondary`}>
          {unreadCount}件の未読通知
        </p>
      </div>
      
      <div class="flex-1 overflow-y-auto p-4">
        <div class="space-y-4">
          {notifications.map((notification) => (
            <Card 
              key={notification.id} 
              variant={notification.isRead ? 'default' : 'soft'}
              className={`cursor-pointer transition-all duration-200 ${
                !notification.isRead ? 'border-l-4 border-pink-primary' : ''
              }`}
              onClick={() => onMarkAsRead(notification.id)}
            >
              <div class="flex items-start gap-3">
                <div class="text-2xl">
                  {getNotificationIcon(notification.type)}
                </div>
                <div class="flex-1">
                  <h3 class={apply`font-semibold text-text-primary mb-1`}>
                    {notification.title}
                  </h3>
                  <p class={apply`text-sm text-text-secondary mb-2`}>
                    {notification.message}
                  </p>
                  <p class={apply`text-xs text-text-tertiary`}>
                    {notification.timestamp}
                  </p>
                </div>
                {!notification.isRead && (
                  <div class="w-2 h-2 bg-pink-primary rounded-full"></div>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

const ProfileScreen = ({ user }: { user: User }) => {
  return (
    <div class="h-full overflow-y-auto p-4">
      <div class="text-center mb-8">
        <div class={apply`w-20 h-20 bg-pink-light rounded-full flex items-center justify-center text-2xl font-bold text-pink-primary mx-auto mb-4`}>
          {user.name.charAt(0)}
        </div>
        <h2 class={apply`text-xl font-heading font-semibold text-pink-primary mb-1`}>
          {user.name}
        </h2>
        <p class={apply`text-sm text-text-secondary`}>
          {user.email}
        </p>
      </div>

      <Card className="mb-6">
        <h3 class={apply`text-lg font-heading font-semibold text-pink-primary mb-4`}>
          統計
        </h3>
        <div class="grid grid-cols-3 gap-4 text-center">
          <div>
            <div class={apply`text-2xl font-bold text-pink-primary`}>
              {user.stats.visitedVenues}
            </div>
            <div class={apply`text-sm text-text-secondary`}>訪問店舗</div>
          </div>
          <div>
            <div class={apply`text-2xl font-bold text-pink-primary`}>
              {user.stats.totalReviews}
            </div>
            <div class={apply`text-sm text-text-secondary`}>レビュー</div>
          </div>
          <div>
            <div class={apply`text-2xl font-bold text-pink-primary`}>
              {user.stats.averageRating.toFixed(1)}
            </div>
            <div class={apply`text-sm text-text-secondary`}>平均評価</div>
          </div>
        </div>
      </Card>

      <Card>
        <h3 class={apply`text-lg font-heading font-semibold text-pink-primary mb-4`}>
          自己紹介
        </h3>
        <p class={apply`text-text-primary leading-relaxed`}>
          {user.bio}
        </p>
      </Card>
    </div>
  );
};

// メインアプリケーション
export default function NightlifeNavigatorApp() {
  const [activeTab, setActiveTab] = useState('search');
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [showVenueModal, setShowVenueModal] = useState(false);

  // サンプルデータ
  const sampleVenues: Venue[] = [
    {
      id: 1,
      name: "GENTLE LOUNGE",
      category: "lounge",
      address: "渋谷区渋谷1-2-3",
      rating: 4.8,
      priceRange: "expensive",
      distance: 250,
      description: "やさしいピンクの温かみのあるデザインで、心地よい雰囲気を演出。",
      tags: ["ラウンジ", "やさしい", "ピンク"],
      isOpen: true,
      isFavorite: false,
    },
    {
      id: 2,
      name: "NEON BAR",
      category: "bar",
      address: "新宿区新宿2-3-4",
      rating: 4.5,
      priceRange: "moderate",
      distance: 800,
      description: "ネオンライトが美しい大人のバー。カクテルの種類が豊富。",
      tags: ["バー", "ネオン", "カクテル"],
      isOpen: true,
      isFavorite: true,
    },
    {
      id: 3,
      name: "TOKYO DINING",
      category: "restaurant",
      address: "港区六本木3-4-5",
      rating: 4.3,
      priceRange: "luxury",
      distance: 1200,
      description: "高級感あふれるダイニングレストラン。",
      tags: ["レストラン", "高級", "ディナー"],
      isOpen: false,
      isFavorite: false,
    },
  ];

  const [venues] = useState(sampleVenues);
  const [favorites, setFavorites] = useState(sampleVenues.filter(v => v.isFavorite));
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'new_venue',
      title: '新しい店舗が追加されました',
      message: '渋谷に新しいラウンジがオープン',
      timestamp: '2分前',
      isRead: false,
    },
    {
      id: 2,
      type: 'review',
      title: 'お気に入り店舗に新しいレビュー',
      message: 'GENTLE LOUNGEに新しいレビュー',
      timestamp: '1時間前',
      isRead: true,
    },
  ]);

  const user: User = {
    id: 1,
    name: '田中太郎',
    email: 'tanaka@example.com',
    bio: 'ナイトライフ愛好家。美味しいお酒と音楽を求めて東京の夜を探索中。',
    stats: {
      visitedVenues: 45,
      totalReviews: 32,
      averageRating: 4.2,
      helpfulVotes: 128,
    },
  };

  const tabs = [
    { id: 'search', label: '検索', icon: '🔍' },
    { id: 'map', label: '地図', icon: '🗺️' },
    { id: 'favorites', label: 'お気に入り', icon: '❤️' },
    { id: 'notifications', label: '通知', icon: '🔔', badge: notifications.filter(n => !n.isRead).length },
    { id: 'profile', label: 'プロフィール', icon: '👤' },
  ];

  const handleVenueSelect = (venue: Venue) => {
    setSelectedVenue(venue);
    setShowVenueModal(true);
  };

  const handleRemoveFavorite = (id: number) => {
    setFavorites(prev => prev.filter(f => f.id !== id));
  };

  const handleMarkAsRead = (id: number) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, isRead: true } : n
    ));
  };

  const renderScreen = () => {
    switch (activeTab) {
      case 'search':
        return <SearchScreen venues={venues} onVenueSelect={handleVenueSelect} />;
      case 'map':
        return <MapScreen />;
      case 'favorites':
        return <FavoritesScreen favorites={favorites} onRemoveFavorite={handleRemoveFavorite} />;
      case 'notifications':
        return <NotificationScreen notifications={notifications} onMarkAsRead={handleMarkAsRead} />;
      case 'profile':
        return <ProfileScreen user={user} />;
      default:
        return <SearchScreen venues={venues} onVenueSelect={handleVenueSelect} />;
    }
  };

  return (
    <div class="mx-auto max-w-md bg-white border border-border-light rounded-xl shadow-large overflow-hidden" style="height: 600px;">
      {/* ヘッダー */}
      <header class={apply`bg-white border-b border-border-light px-4 py-3 flex items-center justify-between`}>
        <h1 class={apply`text-lg font-heading font-bold text-pink-primary`}>
          Nightlife Navigator
        </h1>
        <div class="relative">
          <button 
            onClick={() => setActiveTab('notifications')}
            class={apply`text-2xl relative`}
          >
            🔔
            {notifications.filter(n => !n.isRead).length > 0 && (
              <span class={apply`absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center`}>
                {notifications.filter(n => !n.isRead).length}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main class="flex-1" style="height: calc(600px - 60px - 80px);">
        {renderScreen()}
      </main>

      {/* タブナビゲーション */}
      <nav class={apply`bg-white border-t border-border-light px-2 py-2`}>
        <div class="flex justify-around">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              class={apply`flex flex-col items-center py-2 px-3 rounded-lg transition-all duration-200 relative ${
                activeTab === tab.id
                  ? 'bg-pink-primary text-white'
                  : 'text-text-secondary hover:bg-pink-light hover:text-pink-primary'
              }`}
            >
              <span class="text-lg mb-1">{tab.icon}</span>
              <span class="text-xs font-medium">{tab.label}</span>
              {tab.badge && tab.badge > 0 && (
                <span class={apply`absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center`}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </nav>

      {/* 店舗詳細モーダル */}
      {showVenueModal && selectedVenue && (
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowVenueModal(false)}>
          <div class="bg-white rounded-xl p-6 m-4 max-w-md w-full max-h-96 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div class="flex justify-between items-start mb-4">
              <h2 class={apply`text-xl font-heading font-bold text-pink-primary`}>
                {selectedVenue.name}
              </h2>
              <button
                onClick={() => setShowVenueModal(false)}
                class={apply`text-text-tertiary hover:text-text-primary text-2xl leading-none`}
              >
                ×
              </button>
            </div>
            
            <div class="space-y-4">
              <div>
                <p class={apply`text-text-secondary mb-2`}>{selectedVenue.address}</p>
                <p class={apply`text-text-primary leading-relaxed`}>{selectedVenue.description}</p>
              </div>
              
              <div class="flex gap-2">
                <Badge variant="pink">
                  {selectedVenue.rating} ★
                </Badge>
                <Badge variant="outline">
                  {selectedVenue.distance}m
                </Badge>
                <Badge variant={selectedVenue.isOpen ? 'default' : 'outline'}>
                  {selectedVenue.isOpen ? '営業中' : '営業時間外'}
                </Badge>
              </div>
              
              <div class="flex gap-2 flex-wrap">
                {selectedVenue.tags.map((tag, index) => (
                  <Badge key={index} variant="outline" size="sm">
                    {tag}
                  </Badge>
                ))}
              </div>
              
              <div class="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1">
                  お気に入り
                </Button>
                <Button variant="primary" className="flex-1">
                  道順を見る
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}