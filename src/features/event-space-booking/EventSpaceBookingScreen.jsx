import React, {
  useCallback,
  useState,
  useMemo,
  useRef,
  useEffect,
} from 'react';

import {eventBookingApi} from '../../services/eventBookingService';
import EventBookingAdminPanel from './EventBookingAdminPanel';
import {
  blocksAvailability,
  getRequestForToken,
  isOnOrAfterLocalDate,
  isValidDateOnly,
  isValidClockTime,
  isValidGuestCount,
  isWithinVenueHours,
  overlaps,
  toMinutes,
} from './eventBookingLogic';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  Animated,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Modal,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';

/* ---------------------------------------------------------------- */
/*  Theme                                                           */
/* ---------------------------------------------------------------- */
const COLOR = {
  royal: '#6D28D9',
  soft: '#8B5CF6',
  emerald: '#10B981',
  bg: '#F8FAFC',
  card: '#FFFFFF',
  text: '#111827',
  sub: '#64748B',
  border: '#E2E8F0',
  borderSoft: '#EEF2F7',
  danger: '#EF4444',
  warning: '#F59E0B',
  success: '#10B981',
  pendingBg: '#FEF3C7',
  pendingText: '#B45309',
  approvedBg: '#D1FAE5',
  approvedText: '#047857',
  rejectedBg: '#FEE2E2',
  rejectedText: '#B91C1C',
  shadow: '#0F172A',
};

const FONT = {
  heavy: 'System',
  bold: 'System',
  semibold: 'System',
  regular: 'System',
  medium: 'System',
};

const CARD_RADIUS = 20;

const CATEGORIES = [
  {id: 'all', label: 'All Spaces'},
  {id: 'hall', label: 'Indoor'},
  {id: 'garden', label: 'Outdoor'},
  {id: 'bbq', label: 'Dining'},
];

const STATUS = {PENDING: 'Pending', APPROVED: 'Approved', REJECTED: 'Rejected'};

/* ---------------------------------------------------------------- */
/*  Helpers                                                         */
/* ---------------------------------------------------------------- */
const pad = (n) => (n < 10 ? '0' + n : '' + n);

const formatDate = (d) => {
  if (!d) return '';
  const date = d instanceof Date ? d : new Date(d);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const toISODate = (d) => {
  const date = d instanceof Date ? d : new Date(d);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const isSameDay = (a, b) => toISODate(a) === toISODate(b);

const fmtTime12 = (t) => {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const ap = h >= 12 ? 'PM' : 'AM';
  const hr = h % 12 === 0 ? 12 : h % 12;
  return `${hr}:${pad(m)} ${ap}`;
};

/* ---------------------------------------------------------------- */
/*  Icon set (pure vector-free drawings)                            */
/* ---------------------------------------------------------------- */
const Icon = ({ name, size = 20, color = COLOR.text, style }) => {
  const s = { width: size, height: size };
  const common = [s, style];
  switch (name) {
    case 'search':
      return (
        <View style={common}>
          <View style={[s, { borderWidth: 1.6, borderColor: color, borderRadius: size, justifyContent: 'center', alignItems: 'center' }]}>
            <View style={{ width: size * 0.28, height: size * 0.28, backgroundColor: color, borderRadius: size * 0.14 }} />
          </View>
          <View style={{ position: 'absolute', right: -size * 0.06, bottom: -size * 0.06, width: size * 0.42, height: 1.8, backgroundColor: color, transform: [{ rotate: '45deg' }] }} />
        </View>
      );
    case 'users':
      return (
        <View style={common}>
          <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
            <View style={{ width: size * 0.36, height: size * 0.36, borderRadius: size * 0.18, backgroundColor: color }} />
            <View style={{ width: size * 0.36, height: size * 0.36, borderRadius: size * 0.18, backgroundColor: color, marginLeft: -size * 0.1 }} />
          </View>
          <View style={{ marginTop: -size * 0.02, alignSelf: 'center', width: size * 0.86, height: size * 0.42, backgroundColor: color, borderTopLeftRadius: size * 0.32, borderTopRightRadius: size * 0.32 }} />
        </View>
      );
    case 'clock':
      return (
        <View style={[common, { borderWidth: 1.6, borderColor: color, borderRadius: size, justifyContent: 'center', alignItems: 'center' }]}>
          <View style={{ position: 'absolute', width: 1.6, height: size * 0.34, backgroundColor: color, top: size * 0.16, transform: [{ rotate: '0deg' }] }} />
          <View style={{ position: 'absolute', width: size * 0.26, height: 1.6, backgroundColor: color, left: size * 0.5 - 1, top: size * 0.5 - 0.8 }} />
        </View>
      );
    case 'calendar':
      return (
        <View style={[common, { borderWidth: 1.6, borderColor: color, borderRadius: 5, overflow: 'hidden' }]}>
          <View style={{ height: size * 0.26, backgroundColor: color }} />
          <View style={{ position: 'absolute', left: size * 0.2, top: -2, width: 1.6, height: size * 0.32, backgroundColor: color }} />
          <View style={{ position: 'absolute', right: size * 0.2, top: -2, width: 1.6, height: size * 0.32, backgroundColor: color }} />
          <View style={{ flex: 1 }} />
        </View>
      );
    case 'check':
      return (
        <View style={[common, { alignItems: 'center', justifyContent: 'center' }]}>
          <View style={{ width: size * 0.5, height: size * 0.26, borderColor: color, borderBottomWidth: 2.2, borderLeftWidth: 2.2, transform: [{ rotate: '-45deg' }], marginTop: -size * 0.1 }} />
        </View>
      );
    case 'chevronRight':
      return (
        <View style={[common, { alignItems: 'center', justifyContent: 'center' }]}>
          <View style={{ width: size * 0.3, height: size * 0.5, borderColor: color, borderTopWidth: 2, borderRightWidth: 2, transform: [{ rotate: '45deg' }] }} />
        </View>
      );
    case 'chevronLeft':
      return (
        <View style={[common, { alignItems: 'center', justifyContent: 'center' }]}>
          <View style={{ width: size * 0.3, height: size * 0.5, borderColor: color, borderTopWidth: 2, borderLeftWidth: 2, transform: [{ rotate: '-45deg' }] }} />
        </View>
      );
    case 'arrowLeft':
      return (
        <View style={[common, { flexDirection: 'row', alignItems: 'center' }]}>
          <View style={{ width: 0, height: 0, borderTopWidth: size * 0.18, borderBottomWidth: size * 0.18, borderRightWidth: size * 0.22, borderTopColor: 'transparent', borderBottomColor: 'transparent', borderRightColor: color }} />
          <View style={{ width: size * 0.55, height: 2, backgroundColor: color, marginLeft: -1 }} />
        </View>
      );
    case 'x':
      return (
        <View style={[common, { alignItems: 'center', justifyContent: 'center' }]}>
          <View style={{ width: size * 0.6, height: 2, backgroundColor: color, transform: [{ rotate: '45deg' }] }} />
          <View style={{ position: 'absolute', width: size * 0.6, height: 2, backgroundColor: color, transform: [{ rotate: '-45deg' }] }} />
        </View>
      );
    case 'plus':
      return (
        <View style={[common, { alignItems: 'center', justifyContent: 'center' }]}>
          <View style={{ position: 'absolute', width: size * 0.62, height: 2, backgroundColor: color }} />
          <View style={{ width: 2, height: size * 0.62, backgroundColor: color }} />
        </View>
      );
    case 'minus':
      return (
        <View style={[common, { alignItems: 'center', justifyContent: 'center' }]}>
          <View style={{ width: size * 0.62, height: 2, backgroundColor: color }} />
        </View>
      );
    case 'compass':
      return (
        <View style={[common, { alignItems: 'center', justifyContent: 'center' }]}>
          <View style={{ width: size, height: size, borderRadius: size * 0.5, borderWidth: 2, borderColor: color }} />
          <View style={{ position: 'absolute', width: 2, height: size * 0.4, backgroundColor: color, transform: [{ rotate: '45deg' }] }} />
        </View>
      );
    case 'bookmark':
      return (
        <View style={[common, { alignItems: 'center' }]}>
          <View style={{ width: size * 0.7, height: size * 0.62, borderTopLeftRadius: 4, borderTopRightRadius: 4, backgroundColor: color }} />
          <View style={{ width: 0, height: 0, borderTopWidth: size * 0.3, borderLeftWidth: size * 0.35, borderRightWidth: size * 0.35, borderTopColor: color, borderLeftColor: 'transparent', borderRightColor: 'transparent', marginTop: -1 }} />
        </View>
      );
    case 'sparkle':
      return (
        <View style={[common, { alignItems: 'center', justifyContent: 'center' }]}>
          <View style={{ width: size * 0.5, height: size * 0.5, backgroundColor: color, transform: [{ rotate: '45deg' }] }} />
        </View>
      );
    case 'info':
      return (
        <View style={[common, { alignItems: 'center', justifyContent: 'center' }]}>
          <View style={{ width: size, height: size, borderRadius: size * 0.5, borderWidth: 2, borderColor: color }} />
          <View style={{ position: 'absolute', top: size * 0.22, width: 2.2, height: size * 0.12, backgroundColor: color }} />
          <View style={{ position: 'absolute', top: size * 0.44, width: 2.2, height: size * 0.26, backgroundColor: color }} />
        </View>
      );
    case 'list':
      return (
        <View style={[common, { justifyContent: 'center' }]}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', marginVertical: size * 0.07 }}>
              <View style={{ width: size * 0.16, height: size * 0.16, backgroundColor: color, borderRadius: 2 }} />
              <View style={{ width: size * 0.64, height: 2, backgroundColor: color, marginLeft: size * 0.12 }} />
            </View>
          ))}
        </View>
      );
    default:
      return <View style={common} />;
  }
};

/* ---------------------------------------------------------------- */
/*  Small UI atoms                                                  */
/* ---------------------------------------------------------------- */
const StatusBadge = ({ status, size = 'md' }) => {
  let bg = COLOR.pendingBg;
  let fg = COLOR.pendingText;
  if (status === STATUS.APPROVED) { bg = COLOR.approvedBg; fg = COLOR.approvedText; }
  else if (status === STATUS.REJECTED) { bg = COLOR.rejectedBg; fg = COLOR.rejectedText; }

  const dot = size === 'sm' ? 6 : 7;
  const fontSize = size === 'sm' ? 11 : 12;
  const padH = size === 'sm' ? 7 : 10;
  const padV = size === 'sm' ? 3 : 5;

  return (
    <View style={[styles.badge, { backgroundColor: bg, paddingVertical: padV, paddingHorizontal: padH }]}>
      <View style={{ width: dot, height: dot, borderRadius: dot / 2, backgroundColor: fg, marginRight: 6 }} />
      <Text style={{ color: fg, fontSize, fontFamily: FONT.semibold, fontWeight: '600' }}>{status}</Text>
    </View>
  );
};

const FacilityChip = ({ label }) => (
  <View style={styles.chip}>
    <Icon name="check" size={12} color={COLOR.royal} />
    <Text style={styles.chipText}>{label}</Text>
  </View>
);

const SectionTitle = ({ title, subtitle, right }) => (
  <View style={styles.sectionHead}>
    <View style={{ flex: 1 }}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle ? <Text style={styles.sectionSub}>{subtitle}</Text> : null}
    </View>
    {right}
  </View>
);

/* ---------------------------------------------------------------- */
/*  Top navigation bar                                              */
/* ---------------------------------------------------------------- */
const TopBar = ({ title, onBack, right, large }) => (
  <View style={[styles.topBar, large && styles.topBarLarge]}>
    {onBack && (
      <TouchableOpacity onPress={onBack} style={styles.topBack} activeOpacity={0.7}>
        <Icon name="arrowLeft" size={20} color={COLOR.royal} />
      </TouchableOpacity>
    )}
    <Text style={[styles.topTitle, onBack ? { marginLeft: 8 } : null]}>{title}</Text>
    <View style={{ flex: 1 }} />
    {right}
  </View>
);

/* ---------------------------------------------------------------- */
/*  Bottom navigation                                               */
/* ---------------------------------------------------------------- */
const TabBar = ({ active, onChange, bookingsCount, showAdmin }) => {
  const tabs = [
    { id: 'explore', label: 'Explore', icon: 'compass' },
    { id: 'bookings', label: 'My Bookings', icon: 'bookmark' },
  ];
  if (showAdmin) tabs.push({id: 'admin', label: 'Admin', icon: 'users'});
  return (
    <View style={styles.tabBar}>
      <View style={styles.tabBarInner}>
        {tabs.map((t) => {
          const isActive = active === t.id;
          return (
            <TouchableOpacity
              key={t.id}
              style={styles.tabItem}
              onPress={() => onChange(t.id)}
              activeOpacity={0.6}
            >
              <View style={[styles.tabIconWrap, isActive && styles.tabIconWrapActive]}>
                <Icon name={t.icon} size={22} color={isActive ? '#FFFFFF' : COLOR.sub} />
                {t.id === 'bookings' && bookingsCount > 0 && (
                  <View style={styles.tabBadge}>
                    <Text style={styles.tabBadgeText}>{bookingsCount > 9 ? '9+' : bookingsCount}</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>{t.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

/* ---------------------------------------------------------------- */
/*  Hero image card                                                 */
/* ---------------------------------------------------------------- */
const HeroCard = () => (
  <View style={styles.hero}>
    <Image
      source={{ uri: 'https://images.pexels.com/photos/260922/pexels-photo-260922.jpeg?auto=compress&cs=tinysrgb&w=1200' }}
      style={styles.heroImage}
      resizeMode="cover"
    />
    <View style={styles.heroOverlay} />
    <View style={styles.heroContent}>
      
      <Text style={styles.heroTitle}>Reserve Your{'\n'}Community Space</Text>
      <Text style={styles.heroSub}>
        Book the hall, garden and BBQ area for your next gathering — all in one place.
      </Text>
      
    </View>
  </View>
);

/* ---------------------------------------------------------------- */
/*  Venue card                                                       */
/* ---------------------------------------------------------------- */
const VenueCard = ({ venue, onPress }) => (
  <TouchableOpacity style={styles.venueCard} onPress={onPress} activeOpacity={0.9}>
    <View style={styles.venueImageWrap}>
      <Image source={{ uri: venue.image }} style={styles.venueImage} resizeMode="cover" />
      <View style={styles.venueImageFade} />
      <View style={styles.venueCapacityPill}>
        <Icon name="users" size={12} color={COLOR.royal} />
        <Text style={styles.venueCapacityText}>Up to {venue.capacity}</Text>
      </View>
      <View style={styles.venuePricePill}>
        <Text style={styles.venuePriceText}>{venue.price}</Text>
      </View>
    </View>
    <View style={styles.venueBody}>
      <Text style={styles.venueName}>{venue.name}</Text>
      <Text style={styles.venueShort}>{venue.short}</Text>
      <View style={styles.venueFacRow}>
        {venue.facilities.slice(0, 3).map((f) => (
          <View key={f} style={styles.miniChip}>
            <Text style={styles.miniChipText}>{f}</Text>
          </View>
        ))}
        {venue.facilities.length > 3 && (
          <View style={[styles.miniChip, styles.miniChipMore]}>
            <Text style={[styles.miniChipText, { color: COLOR.royal }]}>+{venue.facilities.length - 3}</Text>
          </View>
        )}
      </View>
      <View style={styles.venueFooter}>
        <View style={styles.venueMetaRow}>
          <Icon name="clock" size={13} color={COLOR.sub} />
          <Text style={styles.venueMetaText}>{venue.hours}</Text>
        </View>
        <TouchableOpacity style={styles.bookNowBtn} onPress={onPress} activeOpacity={0.8}>
          <Text style={styles.bookNowText}>Book Now</Text>
          <Icon name="chevronRight" size={14} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  </TouchableOpacity>
);

/* ---------------------------------------------------------------- */
/*  VIEW 1 — Explore Spaces                                          */
/* ---------------------------------------------------------------- */
const ExploreView = ({venues, onOpenVenue, onGoBookings, loading, error, onRetry}) => {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
 
  const filtered = useMemo(() => {
  return venues.filter((v) => {
    const searchable = `${v.name} ${v.short} ${v.description} ${(v.facilities || []).join(' ')}`.toLowerCase();

    const q = query.trim().toLowerCase();

    const matchCat =
      category === 'all' ||
      (category === 'hall' && /hall|indoor/.test(searchable)) ||
      (category === 'garden' && /garden|lawn|outdoor/.test(searchable)) ||
      (category === 'bbq' && /bbq|dining/.test(searchable));

    const matchQ = !q || searchable.includes(q);

    return matchCat && matchQ;
  });
}, [venues, query, category]);

  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        <HeroCard />

        <View style={styles.exploreBody}>
          {/* Search */}
          <View style={styles.searchBar}>
            <Icon name="search" size={18} color={COLOR.sub} />
            <TextInput
              
              value={query}
              onChangeText={setQuery}
              placeholder="Search spaces or facilities"
              placeholderTextColor={COLOR.sub}
              style={styles.searchInput}
              returnKeyType="search"
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery('')} style={styles.searchClear}>
                <Icon name="x" size={14} color={COLOR.sub} />
              </TouchableOpacity>
            )}
          </View>

          {/* Categories */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.catScroll}
          >
            {CATEGORIES.map((c) => {
              const active = category === c.id;
              return (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.catChip, active && styles.catChipActive]}
                  onPress={() => setCategory(c.id)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.catChipText, active && styles.catChipTextActive]}>{c.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Section header */}
          <SectionTitle
            title="Available Spaces"
          subtitle={`${filtered.length} venues available`}
            right={
              <TouchableOpacity onPress={onGoBookings} style={styles.seeAllBtn}>
                <Text style={styles.seeAllText}>My Bookings</Text>
                <Icon name="chevronRight" size={13} color={COLOR.royal} />
              </TouchableOpacity>
            }
          />

          {loading ? (
            <View style={styles.emptyExplore}>
              <ActivityIndicator color={COLOR.royal} />
              <Text style={styles.emptyExploreSub}>Loading available spaces…</Text>
            </View>
          ) : error ? (
            <View style={styles.emptyExplore}>
              <Text style={styles.emptyExploreSub}>{error}</Text>
              <TouchableOpacity onPress={onRetry} style={styles.seeAllBtn}>
                <Text style={styles.seeAllText}>Try again</Text>
              </TouchableOpacity>
            </View>
          ) : filtered.length === 0 ? (
            <View style={styles.emptyExplore}>
              <Icon name="search" size={40} color={COLOR.border} />
              <Text style={styles.emptyExploreTitle}>No spaces found</Text>
              <Text style={styles.emptyExploreSub}>Try a different search or category.</Text>
            </View>
          ) : (
            <View style={{ marginTop: 8 }}>
              {filtered.map((v) => (
                <VenueCard key={v.id} venue={v} onPress={() => onOpenVenue(v)} />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

/* ---------------------------------------------------------------- */
/*  VIEW 2 — Venue Details                                           */
/* ---------------------------------------------------------------- */
const DetailsView = ({ venue, onBack, onBook }) => {
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerOpacity = scrollY.interpolate({
    inputRange: [180, 280],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.screen}>
      <Animated.View style={[styles.detailsFloatingHeader, { opacity: headerOpacity }]}>
        <TouchableOpacity onPress={onBack} style={styles.topBack}>
          <Icon name="arrowLeft" size={20} color={COLOR.royal} />
        </TouchableOpacity>
        <Text style={styles.detailsFloatingTitle} numberOfLines={1}>{venue.name}</Text>
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
        scrollEventThrottle={16}
      >
        <View style={styles.detailsHero}>
          <Image source={{ uri: venue.image }} style={styles.detailsHeroImage} resizeMode="cover" />
          <View style={styles.detailsHeroOverlay} />
          <TouchableOpacity onPress={onBack} style={styles.detailsBackBtn}>
            <Icon name="arrowLeft" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.detailsHeroCap}>
            <Icon name="users" size={13} color="#FFFFFF" />
            <Text style={styles.detailsHeroCapText}>Up to {venue.capacity} guests</Text>
          </View>
          <View style={styles.detailsHeroInfo}>
            <Text style={styles.detailsHeroName}>{venue.name}</Text>
            <Text style={styles.detailsHeroShort}>{venue.short}</Text>
          </View>
        </View>

        <View style={styles.detailsBody}>
          {/* Quick stats */}
          <View style={styles.detailsStatsRow}>
            <View style={styles.statCard}>
              <Icon name="users" size={18} color={COLOR.royal} />
              <Text style={styles.statValue}>{venue.capacity}</Text>
              <Text style={styles.statLabel}>Capacity</Text>
            </View>
            <View style={styles.statCard}>
              <Icon name="clock" size={18} color={COLOR.royal} />
              <Text style={styles.statValueSmall}>{venue.hours.split('–')[0].trim()}</Text>
              <Text style={styles.statLabel}>Opens</Text>
            </View>
            <View style={styles.statCard}>
              <Icon name="sparkle" size={18} color={COLOR.royal} />
              <Text style={styles.statValueSmall}>{venue.price}</Text>
              <Text style={styles.statLabel}>Rate</Text>
            </View>
          </View>

          {/* Description */}
          <SectionTitle title="About this space" />
          <Text style={styles.detailsDesc}>{venue.description}</Text>

          {/* Facilities */}
          <SectionTitle title="Facilities" subtitle="Included with every booking" />
          <View style={styles.facGrid}>
            {venue.facilities.map((f) => (
              <FacilityChip key={f} label={f} />
            ))}
          </View>

          {/* Availability */}
          <SectionTitle
  title="Availability"
  subtitle="Availability is checked when you submit your booking."
/>
         <View style={styles.availCard}>
  <View style={styles.availRow}>
    <Icon name="calendar" size={16} color={COLOR.royal} />
    <Text style={styles.availRowText}>
      Select your event date while booking.
    </Text>
  </View>

  <View style={styles.availRow}>
    <Icon name="clock" size={16} color={COLOR.royal} />
    <Text style={styles.availRowText}>
      Venue hours: {venue.hours}
    </Text>
  </View>

  <Text style={styles.availSlotText}>
    Final availability and time conflicts are verified by the backend when you submit your request.
  </Text>
</View>

          {/* CTA */}
          <TouchableOpacity style={styles.detailsCTA} onPress={onBook} activeOpacity={0.85}>
            <Text style={styles.detailsCTAText}>Book This Space</Text>
            <Icon name="chevronRight" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

/* ---------------------------------------------------------------- */
/*  Date picker modal                                               */
/* ---------------------------------------------------------------- */
const DatePickerModal = ({ visible, value, onClose, onPick }) => {
  const [view, setView] = useState(() => {
    const base = value || new Date();
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const monthLabel = view.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const firstDay = new Date(view.getFullYear(), view.getMonth(), 1);
  const startWeekday = firstDay.getDay();
  const daysInMonth = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(view.getFullYear(), view.getMonth(), d));

  const prev = () => setView(new Date(view.getFullYear(), view.getMonth() - 1, 1));
  const next = () => setView(new Date(view.getFullYear(), view.getMonth() + 1, 1));
  const canGoPrev = new Date(view.getFullYear(), view.getMonth(), 1) > new Date(today.getFullYear(), today.getMonth(), 1);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={styles.dateModal}>
              <View style={styles.dateModalHead}>
                <Text style={styles.dateModalTitle}>Select a date</Text>
                <TouchableOpacity onPress={onClose} style={styles.dateModalClose}>
                  <Icon name="x" size={18} color={COLOR.sub} />
                </TouchableOpacity>
              </View>
              <View style={styles.dateNavRow}>
                <TouchableOpacity onPress={prev} disabled={!canGoPrev} style={[styles.dateNavBtn, !canGoPrev && { opacity: 0.3 }]}>
                  <Icon name="chevronLeft" size={18} color={COLOR.royal} />
                </TouchableOpacity>
                <Text style={styles.dateNavMonth}>{monthLabel}</Text>
                <TouchableOpacity onPress={next} style={styles.dateNavBtn}>
                  <Icon name="chevronRight" size={18} color={COLOR.royal} />
                </TouchableOpacity>
              </View>
              <View style={styles.dateWeekRow}>
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                  <Text key={i} style={styles.dateWeekDay}>{d}</Text>
                ))}
              </View>
              <View style={styles.dateGrid}>
                {cells.map((d, i) => {
                  if (!d) return <View key={'e' + i} style={styles.dateCell} />;
                  const isPast = d < today;
                  const selected = value && isSameDay(d, value);
                  return (
                    <TouchableOpacity
                      key={i}
                      style={[styles.dateCell, selected && styles.dateCellSelected]}
                      onPress={() => onPick(d)}
                      disabled={isPast}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.dateCellText,
                          isPast && styles.dateCellPast,
                          selected && styles.dateCellTextSelected,
                        ]}
                      >
                        {d.getDate()}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <View style={styles.dateLegend}>
                <View style={styles.dateLegendItem}>
                  <View style={[styles.dateLegendDot, { backgroundColor: COLOR.royal }]} />
                  <Text style={styles.dateLegendText}>Selected</Text>
                </View>
                <View style={styles.dateLegendItem}>
                  <View style={[styles.dateLegendDot, { backgroundColor: COLOR.border }]} />
                  <Text style={styles.dateLegendText}>Unavailable</Text>
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

/* ---------------------------------------------------------------- */
/*  Time picker modal                                               */
/* ---------------------------------------------------------------- */
const TimePickerModal = ({ visible, value, onClose, onPick, label }) => {
  const hours = [];
  for (let h = 0; h < 24; h++) hours.push(h);
  const [h, setH] = useState(value ? Math.floor(toMinutes(value) / 60) : 10);
  const [m, setM] = useState(value ? toMinutes(value) % 60 : 0);

  const apply = () => {
    onPick(`${pad(h)}:${pad(m)}`);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={styles.timeModal}>
              <View style={styles.timeModalHead}>
                <Text style={styles.timeModalTitle}>{label || 'Select time'}</Text>
                <TouchableOpacity onPress={onClose} style={styles.dateModalClose}>
                  <Icon name="x" size={18} color={COLOR.sub} />
                </TouchableOpacity>
              </View>

              <View style={styles.timeWheelWrap}>
                <View style={styles.timeWheelHighlight} />
                <ScrollView style={styles.timeWheel} showsVerticalScrollIndicator={false}>
                  <View style={{ height: 56 }} />
                  {hours.map((hour) => (
                    <TouchableOpacity
                      key={hour}
                      style={styles.timeWheelItem}
                      onPress={() => setH(hour)}
                    >
                      <Text style={[styles.timeWheelText, h === hour && styles.timeWheelTextActive]}>
                        {pad(hour)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                  <View style={{ height: 56 }} />
                </ScrollView>
                <Text style={styles.timeColon}>:</Text>
                <ScrollView style={styles.timeWheel} showsVerticalScrollIndicator={false}>
                  <View style={{ height: 56 }} />
                  {[0, 15, 30, 45].map((mm) => (
                    <TouchableOpacity
                      key={mm}
                      style={styles.timeWheelItem}
                      onPress={() => setM(mm)}
                    >
                      <Text style={[styles.timeWheelText, m === mm && styles.timeWheelTextActive]}>
                        {pad(mm)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                  <View style={{ height: 56 }} />
                </ScrollView>
              </View>

              <View style={styles.timePreviewRow}>
                <Text style={styles.timePreviewLabel}>Selected</Text>
                <Text style={styles.timePreviewValue}>{fmtTime12(`${pad(h)}:${pad(m)}`)}</Text>
              </View>

              <TouchableOpacity style={styles.timeApplyBtn} onPress={apply} activeOpacity={0.85}>
                <Text style={styles.timeApplyText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

/* ---------------------------------------------------------------- */
/*  VIEW 3 — Book a Space                                            */
/* ---------------------------------------------------------------- */
const BookView = ({ venue, onBack, onSubmitted, onGoBookings }) => {
  const [date, setDate] = useState(null);
  const [start, setStart] = useState(null);
  const [end, setEnd] = useState(null);
  const [guests, setGuests] = useState(10);
  const [purpose, setPurpose] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState({});
  const [showDate, setShowDate] = useState(false);
  const [showStart, setShowStart] = useState(false);
  const [showEnd, setShowEnd] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(null); // booking object

  const validate = () => {
    const e = {};
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
      e.date = 'Please choose a valid date.';
    } else {
      const selectedDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDay < today) e.date = 'Choose today or a future date.';
    }
    if (!start) e.start = 'Set a start time.';
    else if (!isValidClockTime(start)) e.start = 'Choose a valid start time.';
    if (!end) e.end = 'Set an end time.';
    else if (!isValidClockTime(end)) e.end = 'Choose a valid end time.';
    if (start && end && (!isValidClockTime(start) || !isValidClockTime(end))) {
      e.end = 'Choose a valid start and end time.';
    } else if (start && end && toMinutes(end) <= toMinutes(start)) e.end = 'End time must be after start time.';
    if (start && end && (!isValidClockTime(venue.openingTime) || !isValidClockTime(venue.closingTime))) {
      e.start = 'Venue hours are unavailable. Refresh the venue list and try again.';
    } else if (start && end) {
      if (toMinutes(start) < toMinutes(venue.openingTime)) {
        e.start = `Start time must be at or after ${fmtTime12(venue.openingTime)}.`;
      }
      if (toMinutes(end) > toMinutes(venue.closingTime)) {
        e.end = `End time must be at or before ${fmtTime12(venue.closingTime)}.`;
      }
    }
    if (!Number.isInteger(Number(guests)) || Number(guests) < 1) e.guests = 'Enter a whole number of at least 1 guest.';
    else if (!Number.isInteger(Number(venue.capacity)) || Number(venue.capacity) < 1) e.guests = 'Venue capacity is unavailable. Refresh the venue list and try again.';
    else if (!isValidGuestCount(guests, venue.capacity)) e.guests = `Max capacity is ${venue.capacity}.`;
    if (!purpose.trim()) e.purpose = 'Tell us the purpose of your event.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
  if (!validate()) return;

  const booking = {
    venueId: venue.id,
    venueName: venue.name,
    venueImage: venue.image,
    date: toISODate(date),
    dateObj: date,
    start,
    end,
    guests,
    purpose: purpose.trim(),
    notes: notes.trim(),
    status: STATUS.PENDING,
    createdAt: new Date().toISOString(),
  };

  setSubmitting(true);
  setErrors({});

  try {
    const savedBooking = await onSubmitted(booking);

    setSuccess({
      ...booking,
      ...savedBooking,
      dateObj: date,
      venueName: savedBooking?.venueName || venue.name,
      venueImage: savedBooking?.venueImage || venue.image,
    });
  } catch (error) {
    if (error.status === 409) {
      setErrors({
        conflict: error.message || 'This time slot is already booked.',
      });
    } else {
      Alert.alert(
        'Booking Failed',
        error.message || 'Unable to submit booking.',
      );
    }
  } finally {
    setSubmitting(false);
  }
};

  const reset = () => {
    setDate(null); setStart(null); setEnd(null); setGuests(10);
    setPurpose(''); setNotes(''); setErrors({});
    onBack();
  };

  if (success) {
    return (
      <View style={styles.screen}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
          <View style={styles.successWrap}>
            <View style={styles.successCircle}>
              <Icon name="check" size={48} color="#FFFFFF" />
            </View>
            <Text style={styles.successTitle}>Booking Submitted!</Text>
            <Text style={styles.successSub}>
              Your request for <Text style={{ fontFamily: FONT.semibold, fontWeight: '600', color: COLOR.text }}>{success.venueName}</Text> has been received and is now {STATUS.PENDING} approval.
            </Text>

            <View style={styles.successCard}>
              <View style={styles.successCardRow}>
                <Text style={styles.successCardLabel}>Booking ID</Text>
                <Text style={styles.successCardValue}>{success.bookingCode || success.id}</Text>
              </View>
              <View style={styles.successDivider} />
              <View style={styles.successCardRow}>
                <Text style={styles.successCardLabel}>Date</Text>
                <Text style={styles.successCardValue}>{formatDate(success.dateObj)}</Text>
              </View>
              <View style={styles.successDivider} />
              <View style={styles.successCardRow}>
                <Text style={styles.successCardLabel}>Time</Text>
                <Text style={styles.successCardValue}>{fmtTime12(success.start)} – {fmtTime12(success.end)}</Text>
              </View>
              <View style={styles.successDivider} />
              <View style={styles.successCardRow}>
                <Text style={styles.successCardLabel}>Guests</Text>
                <Text style={styles.successCardValue}>{success.guests}</Text>
              </View>
              <View style={styles.successDivider} />
              <View style={styles.successCardRow}>
                <Text style={styles.successCardLabel}>Status</Text>
                <StatusBadge status={success.status} />
              </View>
            </View>

            <View style={styles.successActions}>
              <TouchableOpacity style={styles.successPrimary} onPress={onGoBookings} activeOpacity={0.85}>
                <Text style={styles.successPrimaryText}>View My Bookings</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.successSecondary} onPress={reset} activeOpacity={0.7}>
                <Text style={styles.successSecondaryText}>Book another space</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 140 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Selected venue banner */}
        <View style={styles.bookBanner}>
          <Image source={{ uri: venue.image }} style={styles.bookBannerImage} resizeMode="cover" />
          <View style={styles.bookBannerOverlay} />
          <View style={styles.bookBannerContent}>
            <View style={styles.bookBannerLabel}>
              <Icon name="bookmark" size={11} color="#FFFFFF" />
              <Text style={styles.bookBannerLabelText}>Selected Space</Text>
            </View>
            <Text style={styles.bookBannerName}>{venue.name}</Text>
            <View style={styles.bookBannerMetaRow}>
              <Icon name="users" size={12} color="#FFFFFF" />
              <Text style={styles.bookBannerMeta}>Up to {venue.capacity} guests</Text>
              <View style={styles.bookBannerDot} />
              <Icon name="clock" size={12} color="#FFFFFF" />
              <Text style={styles.bookBannerMeta}>{venue.hours}</Text>
            </View>
          </View>
        </View>

        <View style={styles.bookBody}>
          <SectionTitle title="Booking details" subtitle="Choose a date, time and tell us about your event" />

          {/* Date */}
          <Text style={styles.fieldLabel}>Date</Text>
          <TouchableOpacity
            style={[styles.fieldBox, errors.date && styles.fieldBoxError]}
            onPress={() => setShowDate(true)}
            activeOpacity={0.8}
          >
            <Icon name="calendar" size={18} color={COLOR.royal} />
            <Text style={[styles.fieldValue, !date && styles.fieldPlaceholder]}>
              {date ? formatDate(date) : 'Select a date'}
            </Text>
            <Icon name="chevronRight" size={16} color={COLOR.sub} />
          </TouchableOpacity>
          {errors.date && <Text style={styles.fieldError}>{errors.date}</Text>}

          {/* Time row */}
          <View style={styles.timeRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>Start time</Text>
              <TouchableOpacity
                style={[styles.fieldBox, errors.start && styles.fieldBoxError]}
                onPress={() => setShowStart(true)}
                activeOpacity={0.8}
              >
                <Icon name="clock" size={18} color={COLOR.royal} />
                <Text style={[styles.fieldValue, !start && styles.fieldPlaceholder]}>
                  {start ? fmtTime12(start) : 'Start'}
                </Text>
              </TouchableOpacity>
              {errors.start && <Text style={styles.fieldError}>{errors.start}</Text>}
            </View>
            <View style={{ width: 12 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>End time</Text>
              <TouchableOpacity
                style={[styles.fieldBox, errors.end && styles.fieldBoxError]}
                onPress={() => setShowEnd(true)}
                activeOpacity={0.8}
              >
                <Icon name="clock" size={18} color={COLOR.royal} />
                <Text style={[styles.fieldValue, !end && styles.fieldPlaceholder]}>
                  {end ? fmtTime12(end) : 'End'}
                </Text>
              </TouchableOpacity>
              {errors.end && <Text style={styles.fieldError}>{errors.end}</Text>}
            </View>
          </View>

          {/* Guests stepper */}
          <Text style={styles.fieldLabel}>Number of guests</Text>
          <View style={[styles.fieldBox, styles.guestBox, errors.guests && styles.fieldBoxError]}>
            <View style={styles.guestStepper}>
              <TouchableOpacity
                style={[styles.guestStepBtn, guests <= 1 && styles.guestStepDisabled]}
                onPress={() => setGuests((g) => Math.max(1, g - 1))}
                disabled={guests <= 1}
              >
                <Icon name="minus" size={16} color={guests <= 1 ? COLOR.border : COLOR.royal} />
              </TouchableOpacity>
              <Text style={styles.guestValue}>{guests}</Text>
              <TouchableOpacity
                style={[styles.guestStepBtn, guests >= venue.capacity && styles.guestStepDisabled]}
                onPress={() => setGuests((g) => Math.min(venue.capacity, g + 1))}
                disabled={guests >= venue.capacity}
              >
                <Icon name="plus" size={16} color={guests >= venue.capacity ? COLOR.border : COLOR.royal} />
              </TouchableOpacity>
            </View>
            <View style={styles.guestMeta}>
              <Text style={styles.guestMetaText}>Max {venue.capacity}</Text>
              <View style={styles.guestBar}>
                <View style={[styles.guestBarFill, { width: `${Math.min(100, (guests / venue.capacity) * 100)}%` }]} />
              </View>
            </View>
          </View>
          {errors.guests && <Text style={styles.fieldError}>{errors.guests}</Text>}

          {/* Purpose */}
          <Text style={styles.fieldLabel}>Event purpose</Text>
          <View style={[styles.fieldBox, styles.textAreaBox, errors.purpose && styles.fieldBoxError]}>
            <TextInput
              value={purpose}
              onChangeText={(t) => setPurpose(t)}
              placeholder="e.g. Birthday celebration, residents' meeting, kids' party…"
              placeholderTextColor={COLOR.sub}
              style={styles.textArea}
              multiline
              numberOfLines={3}
              maxLength={120}
            />
          </View>
          {errors.purpose && <Text style={styles.fieldError}>{errors.purpose}</Text>}

          {/* Notes */}
          <Text style={styles.fieldLabel}>Additional notes <Text style={styles.optional}>(optional)</Text></Text>
          <View style={[styles.fieldBox, styles.textAreaBox]}>
            <TextInput
              value={notes}
              onChangeText={(t) => setNotes(t)}
              placeholder="Catering needs, decorations, special requests…"
              placeholderTextColor={COLOR.sub}
              style={styles.textArea}
              multiline
              numberOfLines={3}
              maxLength={200}
            />
            <Text style={styles.charCount}>{notes.length}/200</Text>
          </View>

          {errors.conflict && (
            <View style={styles.conflictBox}>
              <Icon name="info" size={16} color={COLOR.danger} />
              <Text style={styles.conflictText}>{errors.conflict}</Text>
            </View>
          )}

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
            onPress={submit}
            disabled={submitting}
            activeOpacity={0.85}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Text style={styles.submitBtnText}>Submit Booking</Text>
                <Icon name="check" size={18} color="#FFFFFF" />
              </>
            )}
          </TouchableOpacity>
          <Text style={styles.submitHint}>
            Your request will be submitted with Pending status. Venue availability is checked when you submit.
          </Text>
        </View>
      </ScrollView>

      <DatePickerModal visible={showDate} value={date} onClose={() => setShowDate(false)} onPick={(d) => { setDate(d); setShowDate(false); }} />
      <TimePickerModal visible={showStart} value={start} label="Start time" onClose={() => setShowStart(false)} onPick={(t) => { setStart(t); setShowStart(false); }} />
      <TimePickerModal visible={showEnd} value={end} label="End time" onClose={() => setShowEnd(false)} onPick={(t) => { setEnd(t); setShowEnd(false); }} />
    </KeyboardAvoidingView>
  );
};

/* ---------------------------------------------------------------- */
/*  VIEW 4 — My Bookings                                             */
/* ---------------------------------------------------------------- */
const BookingsView = ({bookings, venues, loading, error, onRetry, onOpenVenue, onNewBooking}) => {
  const [filter, setFilter] = useState('all');
  const filters = [
    { id: 'all', label: 'All' },
    { id: STATUS.PENDING, label: 'Pending' },
    { id: STATUS.APPROVED, label: 'Approved' },
    { id: STATUS.REJECTED, label: 'Rejected' },
  ];

  const sorted = [...bookings].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const filtered = filter === 'all' ? sorted : sorted.filter((b) => b.status === filter);

  if (loading || error || bookings.length === 0) {
    return (
      <View style={styles.screen}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
          {loading ? <View style={styles.emptyBookings}><ActivityIndicator size="large" color={COLOR.royal} /><Text style={styles.emptyBookingsSub}>Refreshing your bookings...</Text></View> : null}
          {error ? <View style={styles.emptyBookings}><Text style={styles.emptyBookingsTitle}>Could not load bookings</Text><Text style={styles.emptyBookingsSub}>{error}</Text><TouchableOpacity style={styles.emptyBookingsBtn} onPress={onRetry}><Text style={styles.emptyBookingsBtnText}>Try again</Text></TouchableOpacity></View> : null}
          {!loading && !error && bookings.length === 0 ? <>
          <View style={styles.emptyBookings}>
            <View style={styles.emptyBookingsIcon}>
              <Icon name="bookmark" size={44} color={COLOR.royal} />
            </View>
            <Text style={styles.emptyBookingsTitle}>No bookings yet</Text>
            <Text style={styles.emptyBookingsSub}>
              When you reserve a community space, your requests will appear here with their live status.
            </Text>
            <TouchableOpacity style={styles.emptyBookingsBtn} onPress={onNewBooking} activeOpacity={0.85}>
              <Icon name="plus" size={16} color="#FFFFFF" />
              <Text style={styles.emptyBookingsBtnText}>Book a space</Text>
            </TouchableOpacity>
          </View>
          </> : null}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 130 }}>
        <View style={styles.bookingsHead}>
          <Text style={styles.bookingsHeadTitle}>My Bookings</Text>
          <Text style={styles.bookingsHeadSub}>
            {bookings.length} {bookings.length === 1 ? 'request' : 'requests'} · live status
          </Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.bookingsFilters}>
          {filters.map((f) => {
            const active = filter === f.id;
            return (
              <TouchableOpacity
                key={f.id}
                style={[styles.filterChip, active && styles.filterChipActive]}
                onPress={() => setFilter(f.id)}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{f.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {filtered.length === 0 ? (
          <View style={styles.emptyFiltered}>
            <Icon name="list" size={34} color={COLOR.border} />
            <Text style={styles.emptyFilteredText}>No {filter !== 'all' ? filter.toLowerCase() : ''} bookings</Text>
          </View>
        ) : (
          <View style={{ marginTop: 8 }}>
            {filtered.map((b) => {
              const venue = venues.find((v) => String(v.id) === String(b.venueId));
              return (
                <View key={b.id} style={styles.bookingCard}>
                  <View style={styles.bookingCardTop}>
                    <Image source={{ uri: b.venueImage }} style={styles.bookingThumb} resizeMode="cover" />
                    <View style={styles.bookingCardInfo}>
                      <Text style={styles.bookingVenueName} numberOfLines={1}>{b.venueName}</Text>
                      <Text style={styles.bookingId}>{b.bookingCode || b.id}</Text>
                      <View style={styles.bookingMetaRow}>
                        <Icon name="calendar" size={12} color={COLOR.sub} />
                        <Text style={styles.bookingMetaText}>{formatDate(b.dateObj || b.date)}</Text>
                      </View>
                      <View style={styles.bookingMetaRow}>
                        <Icon name="clock" size={12} color={COLOR.sub} />
                        <Text style={styles.bookingMetaText}>{fmtTime12(b.start)} – {fmtTime12(b.end)}</Text>
                      </View>
                      <View style={styles.bookingMetaRow}>
                        <Icon name="users" size={12} color={COLOR.sub} />
                        <Text style={styles.bookingMetaText}>{b.guests} guests · {b.purpose}</Text>
                      </View>
                    </View>
                    <StatusBadge status={b.status} size="sm" />
                  </View>
                  {b.status === STATUS.REJECTED && b.rejectionReason ? (
                    <View style={styles.bookingNotes}>
                      <Text style={styles.bookingNotesLabel}>Rejection reason</Text>
                      <Text style={styles.bookingNotesText}>{b.rejectionReason}</Text>
                    </View>
                  ) : null}
                  {b.notes ? (
                    <View style={styles.bookingNotes}>
                      <Text style={styles.bookingNotesLabel}>Notes</Text>
                      <Text style={styles.bookingNotesText} numberOfLines={2}>{b.notes}</Text>
                    </View>
                  ) : null}
                  {venue && (
                    <View style={styles.bookingCardFoot}>
                      <TouchableOpacity style={styles.bookingViewBtn} onPress={() => onOpenVenue(venue)}>
                        <Text style={styles.bookingViewBtnText}>View space</Text>
                        <Icon name="chevronRight" size={13} color={COLOR.royal} />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

/* ---------------------------------------------------------------- */
/*  Main screen                                                      */
/* ---------------------------------------------------------------- */
export default function EventSpaceBookingScreen({token = null}) {
  const [tab, setTab] = useState('explore');
  const [adminAccess, setAdminAccess] = useState({token: null, authorized: false});
  const eventAdminAuthorized = adminAccess.token === token && adminAccess.authorized;
  const [stack, setStack] = useState([]);

  const [venues, setVenues] = useState([]);
  const [bookings, setBookings] = useState([]);

  const [loading, setLoading] = useState(false);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingsError, setBookingsError] = useState('');
  const [loadError, setLoadError] = useState('');

  const push = entry => setStack(s => [...s, entry]);
  const pop = () => setStack(s => s.slice(0, -1));
  const resetStack = () => setStack([]);

  const openVenue = venue => push({type: 'details', venue});
  const openBook = venue => push({type: 'book', venue});

  const venueRequestRef = useRef(null);
  const bookingsRequestRef = useRef(null);
  const bookingsLoadedRef = useRef(false);
  const activeTokenRef = useRef(token);
  const adminAccessRequestRef = useRef(null);

  const refreshBookings = useCallback(async (force = false) => {
    if (!token) {
      setBookings([]);
      setBookingsError('Authentication is required to view your bookings.');
      bookingsLoadedRef.current = false;
      return;
    }
    const currentRequest = getRequestForToken(bookingsRequestRef.current, token);
    if (currentRequest) {
      await currentRequest.promise;
      if (!force) return;
    }
    if (bookingsLoadedRef.current && !force) return;

    setBookingsLoading(true);
    setBookingsError('');
    const request = {token, promise: null};
    request.promise = (async () => {
      try {
        const residentBookings = await eventBookingApi.getMyBookings(token);
        if (activeTokenRef.current === token && bookingsRequestRef.current === request) {
          setBookings(residentBookings);
          bookingsLoadedRef.current = true;
        }
      } catch (error) {
        if (activeTokenRef.current === token && bookingsRequestRef.current === request) {
          setBookingsError(error.message || 'Unable to refresh bookings.');
        }
      } finally {
        if (bookingsRequestRef.current === request) {
          bookingsRequestRef.current = null;
          if (activeTokenRef.current === token) setBookingsLoading(false);
        }
      }
    })();
    bookingsRequestRef.current = request;
    return request.promise;
  }, [token]);

  const loadData = useCallback(async () => {
    if (activeTokenRef.current !== token) {
      activeTokenRef.current = token;
      bookingsLoadedRef.current = false;
      setBookings([]);
      setVenues([]);
      setBookingsError('');
      setLoadError('');
      setTab('explore');
      resetStack();
    }
    const currentVenueRequest = getRequestForToken(venueRequestRef.current, token);
    if (currentVenueRequest) return currentVenueRequest.promise;
    if (!token) {
      setVenues([]);
      setBookings([]);
      setLoadError('Authentication is required to view event spaces and bookings.');
      setBookingsError('Authentication is required to view your bookings.');
      bookingsLoadedRef.current = false;
      return;
    }
    const request = {token, promise: null};
    request.promise = (async () => {
      try {
        setLoading(true);
        setLoadError('');
        const [venueData] = await Promise.all([
          eventBookingApi.getVenues(token),
          refreshBookings(),
        ]);
        if (activeTokenRef.current === token && venueRequestRef.current === request) {
          setVenues(venueData);
        }
      } catch (error) {
        if (activeTokenRef.current === token && venueRequestRef.current === request) {
          setLoadError(error.message || 'Unable to load event spaces.');
        }
      } finally {
        if (venueRequestRef.current === request) {
          venueRequestRef.current = null;
          if (activeTokenRef.current === token) setLoading(false);
        }
      }
    })();
    venueRequestRef.current = request;
    return request.promise;
  }, [token, refreshBookings]);

  const showExplore = () => {
    if (tab !== 'explore') loadData();
    setTab('explore');
    resetStack();
  };

  useEffect(() => {
    let active = true;
    activeTokenRef.current = token;
    setAdminAccess({token, authorized: false});
    setTab(current => current === 'admin' ? 'explore' : current);

    if (!token) {
      adminAccessRequestRef.current = null;
      return () => { active = false; };
    }

    let request = adminAccessRequestRef.current;
    if (!request || request.token !== token) {
      request = {
        token,
        promise: eventBookingApi.getAdminAccess(token)
          .then(response => response?.isAdmin === true)
          .catch(() => false),
      };
      adminAccessRequestRef.current = request;
    }

    request.promise.then(isAdmin => {
      if (active && activeTokenRef.current === token) {
        setAdminAccess({token, authorized: isAdmin});
        if (!isAdmin) setTab(current => current === 'admin' ? 'explore' : current);
      }
    });

    return () => { active = false; };
  }, [token]);

  // Initial load and reload when authentication token changes.
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Refresh resident bookings after returning from admin review.
  const openMyBookings = async () => {
    resetStack();
    setTab('bookings');
    await refreshBookings();
  };

  const handleSubmit = async booking => {
    if (!token) throw new Error('Authentication is required to submit a booking.');

    if (!isValidDateOnly(booking.date) || !isOnOrAfterLocalDate(booking.date)) {
      throw new Error('Choose a valid date that is today or in the future.');
    }

    const venue = venues.find(item => String(item.id) === String(booking.venueId));
    if (!venue || !isValidGuestCount(booking.guests, venue.capacity)) {
      throw new Error('The guest count or venue capacity is invalid. Refresh the venue list and try again.');
    }
    if (!isWithinVenueHours(booking.start, booking.end, venue.openingTime, venue.closingTime)) {
      throw new Error('The selected time is outside the venue hours. Refresh the venue list and try again.');
    }

    const availability = await eventBookingApi.checkAvailability(booking.venueId, booking.date, token);
    if (!Array.isArray(availability.blockedSlots)) {
      throw new Error('Could not confirm venue availability. Please try again.');
    }
    if (String(availability.venueId || '') !== String(booking.venueId) ||
        availability.date !== booking.date) {
      throw new Error('Availability response did not match this venue and date. Please try again.');
    }
    if (!isWithinVenueHours(booking.start, booking.end, availability.openingTime, availability.closingTime)) {
      throw new Error('The selected time is outside the venue hours. Refresh the venue list and try again.');
    }
    const requestedStart = toMinutes(booking.start);
    const requestedEnd = toMinutes(booking.end);
    const conflict = availability.blockedSlots.find(slot => {
      if (!slot || typeof slot !== 'object') {
        throw new Error('Availability data was incomplete. Please try again.');
      }
      const status = String(slot.status || '').toLowerCase();
      if (!['pending', 'approved', 'rejected', 'cancelled'].includes(status)) {
        throw new Error('Availability data was incomplete. Please try again.');
      }
      if (!blocksAvailability(slot)) return false;
      if (!isValidClockTime(slot.start) || !isValidClockTime(slot.end) || toMinutes(slot.end) <= toMinutes(slot.start)) {
        throw new Error('Availability data was incomplete. Please try again.');
      }
      return overlaps(requestedStart, requestedEnd, toMinutes(slot.start), toMinutes(slot.end));
    });
    if (conflict) {
      const error = new Error('That time slot is unavailable. Choose a different time.');
      error.status = 409;
      throw error;
    }
    const saved = await eventBookingApi.createBooking(booking, token);
    await refreshBookings(true);
    return saved;
  };

  // Resolve current view.
  let content;
  let topBarTitle = 'Event Spaces';
  let showTopBar = true;
  let onBack = null;

  if (stack.length === 0) {
    showTopBar = false;

    content = tab === 'admin' && eventAdminAuthorized ? (
        <EventBookingAdminPanel token={token} onBack={showExplore} />
      ) : tab === 'explore' || tab === 'admin' ? (
        <ExploreView
          venues={venues}
          loading={loading}
          error={loadError}
          onRetry={loadData}
          onOpenVenue={openVenue}
          onGoBookings={openMyBookings}
        />
      ) : (
        <BookingsView
          bookings={bookings}
          loading={bookingsLoading}
          error={bookingsError}
          onRetry={() => refreshBookings(true)}
          venues={venues}
          onOpenVenue={openVenue}
          onNewBooking={showExplore}
        />
      );
  } else {
    const top = stack[stack.length - 1];

    onBack = pop;

    if (top.type === 'details') {
      topBarTitle = top.venue.name;

      content = (
        <DetailsView
          venue={top.venue}
          onBack={pop}
          onBook={() => openBook(top.venue)}
        />
      );
    } else if (top.type === 'book') {
      topBarTitle = 'Book a Space';

      content = (
        <BookView
          venue={top.venue}
          onBack={pop}
          onSubmitted={handleSubmit}
          onGoBookings={openMyBookings}
        />
      );
    }
  }

  return (
    <SafeAreaView style={styles.app}>
      <View style={styles.appInner}>
        {showTopBar && (
          <TopBar
            title={topBarTitle}
            onBack={onBack}
          />
        )}

        <View style={{flex: 1}}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator
                size="large"
                color={COLOR.royal}
              />
              <Text style={{marginTop: 12, color: COLOR.sub}}>
                Loading event spaces...
              </Text>
            </View>
          ) : (
            content
          )}

          {!!loadError && !loading ? (
            <Text style={styles.previewNotice}>
              {loadError}
            </Text>
          ) : null}
        </View>

        <TabBar
          active={tab}
          onChange={nextTab => {
            if (nextTab === 'bookings') {
              openMyBookings();
            } else if (nextTab === 'admin' && eventAdminAuthorized) {
              resetStack();
              setTab('admin');
            } else {
              showExplore();
            }
          }}
          bookingsCount={bookings.length}
          showAdmin={eventAdminAuthorized}
        />
      </View>
    </SafeAreaView>
  );
}
/* ---------------------------------------------------------------- */
/*  Styles                                                          */
/* ---------------------------------------------------------------- */
const styles = StyleSheet.create({
  app: { flex: 1, backgroundColor: COLOR.bg },
  appInner: { flex: 1, backgroundColor: COLOR.bg },

  screen: { flex: 1, backgroundColor: COLOR.bg },

  /* Top bar */
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: COLOR.card,
    borderBottomWidth: 1,
    borderBottomColor: COLOR.borderSoft,
  },
  topBarLarge: { paddingVertical: 18 },
  topBack: {
    width: 38, height: 38, borderRadius: 14,
    backgroundColor: '#F1ECFE',
    alignItems: 'center', justifyContent: 'center',
  },
  topTitle: {
    fontSize: 18, fontFamily: FONT.semibold, fontWeight: '600', color: COLOR.text, marginLeft: 12,
  },

  /* Bottom tab bar */
  tabBar: {
    backgroundColor: COLOR.card,
    borderTopWidth: 1,
    borderTopColor: COLOR.borderSoft,
    paddingBottom: Platform.OS === 'ios' ? 18 : 12,
    paddingTop: 10,
    paddingHorizontal: 20,
  },
  tabBarInner: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  tabItem: { alignItems: 'center', justifyContent: 'center', flex: 1, paddingVertical: 4 },
  tabIconWrap: {
    width: 44, height: 30, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  tabIconWrapActive: { backgroundColor: COLOR.royal },
  tabLabel: { fontSize: 11, fontFamily: FONT.medium, fontWeight: '500', color: COLOR.sub, marginTop: 4 },
  tabLabelActive: { color: COLOR.royal, fontFamily: FONT.semibold, fontWeight: '600' },
  tabBadge: {
    position: 'absolute', top: -2, right: 4,
    minWidth: 16, height: 16, paddingHorizontal: 4, borderRadius: 8,
    backgroundColor: COLOR.emerald, alignItems: 'center', justifyContent: 'center',
  },
  tabBadgeText: { fontSize: 9, fontFamily: FONT.bold, fontWeight: '700', color: '#FFFFFF' },

  /* Hero */
  hero: {
    marginHorizontal: 16, marginTop: 10,
    borderRadius: 26, overflow: 'hidden',
    height: 230,
  },
  heroImage: { width: '100%', height: '100%' },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(17,24,39,0.55)',
  },
heroContent: { position: 'absolute', left: 20, right: 20, bottom: 22, top: 18, justifyContent: 'flex-end' },
  heroPill: {
    flexDirection: 'row', alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(109,40,217,0.85)',
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20,
  },
  heroPillText: { fontSize: 11, fontFamily: FONT.semibold, fontWeight: '600', color: '#FFFFFF', marginLeft: 6, letterSpacing: 0.3 },
  heroTitle: {
    fontSize: 26, fontFamily: FONT.heavy, fontWeight: '800', color: '#FFFFFF',
    lineHeight: 32, letterSpacing: -0.4, marginTop: 6,
  },
  heroSub: {
    fontSize: 13, fontFamily: FONT.regular, color: 'rgba(255,255,255,0.92)',
    lineHeight: 19, marginTop: 8, maxWidth: '88%',
  },
  heroSearch: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, marginTop: 14,
  },
  heroSearchText: { fontSize: 13, fontFamily: FONT.regular, color: COLOR.sub, marginLeft: 10 },

  /* Explore body */
  exploreBody: { paddingHorizontal: 16, paddingTop: 18 },

  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLOR.card,
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12,
    borderWidth: 1, borderColor: COLOR.border,
  },
  searchInput: { flex: 1, fontSize: 14, fontFamily: FONT.regular, color: COLOR.text, marginLeft: 10, padding: 0 },
  searchClear: { width: 22, height: 22, borderRadius: 11, backgroundColor: COLOR.borderSoft, alignItems: 'center', justifyContent: 'center' },

  catScroll: { paddingVertical: 16, paddingHorizontal: 2 },
  catChip: {
    paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20,
    backgroundColor: COLOR.card, borderWidth: 1, borderColor: COLOR.border,
    marginRight: 10,
  },
  catChipActive: { backgroundColor: COLOR.royal, borderColor: COLOR.royal },
  catChipText: { fontSize: 13, fontFamily: FONT.medium, fontWeight: '500', color: COLOR.sub },
  catChipTextActive: { color: '#FFFFFF', fontFamily: FONT.semibold, fontWeight: '600' },

  sectionHead: { flexDirection: 'row', alignItems: 'center', marginTop: 22, marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontFamily: FONT.bold, fontWeight: '700', color: COLOR.text, letterSpacing: -0.2 },
  sectionSub: { fontSize: 12, fontFamily: FONT.regular, color: COLOR.sub, marginTop: 2 },
  seeAllBtn: { flexDirection: 'row', alignItems: 'center' },
  seeAllText: { fontSize: 12, fontFamily: FONT.semibold, fontWeight: '600', color: COLOR.royal, marginRight: 2 },

  /* Venue card */
  venueCard: {
    backgroundColor: COLOR.card, borderRadius: CARD_RADIUS, marginBottom: 16,
    borderWidth: 1, borderColor: COLOR.borderSoft,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: COLOR.shadow, shadowOpacity: 0.06, shadowRadius: 14, shadowOffset: { width: 0, height: 6 } },
      android: { elevation: 2 },
    }),
  },
  venueImageWrap: { position: 'relative', height: 170, backgroundColor: COLOR.borderSoft },
  venueImage: { width: '100%', height: '100%' },
  venueImageFade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(17,24,39,0.08)',
  },
  venueCapacityPill: {
    position: 'absolute', top: 12, left: 12,
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16,
  },
  venueCapacityText: { fontSize: 11, fontFamily: FONT.semibold, fontWeight: '600', color: COLOR.royal, marginLeft: 5 },
  venuePricePill: {
    position: 'absolute', top: 12, right: 12,
    backgroundColor: 'rgba(17,24,39,0.78)',
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16,
  },
  venuePriceText: { fontSize: 11, fontFamily: FONT.semibold, fontWeight: '600', color: '#FFFFFF' },

  venueBody: { padding: 16 },
  venueName: { fontSize: 18, fontFamily: FONT.bold, fontWeight: '700', color: COLOR.text, letterSpacing: -0.2 },
  venueShort: { fontSize: 13, fontFamily: FONT.regular, color: COLOR.sub, marginTop: 4, lineHeight: 18 },
  venueFacRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 12 },
  miniChip: {
    backgroundColor: '#F4F0FE', paddingHorizontal: 9, paddingVertical: 5, borderRadius: 12,
    marginRight: 7, marginBottom: 7,
  },
  miniChipText: { fontSize: 11, fontFamily: FONT.medium, fontWeight: '500', color: COLOR.soft },
  miniChipMore: { backgroundColor: '#EDE6FD' },

  venueFooter: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: COLOR.borderSoft,
  },
  venueMetaRow: { flexDirection: 'row', alignItems: 'center' },
  venueMetaText: { fontSize: 12, fontFamily: FONT.regular, color: COLOR.sub, marginLeft: 6 },
  bookNowBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLOR.royal,
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14,
  },
  bookNowText: { fontSize: 13, fontFamily: FONT.semibold, fontWeight: '600', color: '#FFFFFF', marginRight: 4 },

  emptyExplore: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyExploreTitle: { fontSize: 16, fontFamily: FONT.semibold, fontWeight: '600', color: COLOR.text, marginTop: 14 },
  emptyExploreSub: { fontSize: 13, fontFamily: FONT.regular, color: COLOR.sub, marginTop: 6 },

  /* Details */
  detailsFloatingHeader: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12,
    backgroundColor: COLOR.card, borderBottomWidth: 1, borderBottomColor: COLOR.borderSoft,
  },
  detailsFloatingTitle: { fontSize: 16, fontFamily: FONT.semibold, fontWeight: '600', color: COLOR.text, marginLeft: 10, flex: 1 },

  detailsHero: { position: 'relative', height: 280, backgroundColor: COLOR.borderSoft },
  detailsHeroImage: { width: '100%', height: '100%' },
  detailsHeroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(17,24,39,0.45)',
  },
  detailsBackBtn: {
    position: 'absolute', top: 16, left: 16,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(17,24,39,0.45)',
    alignItems: 'center', justifyContent: 'center',
  },
  detailsHeroCap: {
    position: 'absolute', top: 16, right: 16,
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(17,24,39,0.55)',
    paddingHorizontal: 11, paddingVertical: 7, borderRadius: 16,
  },
  detailsHeroCapText: { fontSize: 12, fontFamily: FONT.semibold, fontWeight: '600', color: '#FFFFFF', marginLeft: 5 },
  detailsHeroInfo: { position: 'absolute', left: 20, right: 20, bottom: 20 },
  detailsHeroName: { fontSize: 24, fontFamily: FONT.bold, fontWeight: '700', color: '#FFFFFF', letterSpacing: -0.3 },
  detailsHeroShort: { fontSize: 13, fontFamily: FONT.regular, color: 'rgba(255,255,255,0.9)', marginTop: 4 },

  detailsBody: { paddingHorizontal: 16, paddingTop: 20 },
  detailsStatsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  statCard: {
    flex: 1, backgroundColor: COLOR.card, borderRadius: 16,
    paddingVertical: 14, paddingHorizontal: 10, alignItems: 'center',
    marginHorizontal: 4, borderWidth: 1, borderColor: COLOR.borderSoft,
  },
  statValue: { fontSize: 18, fontFamily: FONT.bold, fontWeight: '700', color: COLOR.text, marginTop: 6 },
  statValueSmall: { fontSize: 13, fontFamily: FONT.bold, fontWeight: '700', color: COLOR.text, marginTop: 6 },
  statLabel: { fontSize: 11, fontFamily: FONT.regular, color: COLOR.sub, marginTop: 2 },

  detailsDesc: { fontSize: 14, fontFamily: FONT.regular, color: COLOR.sub, lineHeight: 22, marginBottom: 8 },

  facGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F4F0FE', paddingHorizontal: 11, paddingVertical: 8, borderRadius: 14,
    marginRight: 8, marginBottom: 8,
  },
  chipText: { fontSize: 12, fontFamily: FONT.medium, fontWeight: '500', color: COLOR.soft, marginLeft: 6 },

  demoTag: { backgroundColor: '#FFF8E6', paddingHorizontal: 9, paddingVertical: 4, borderRadius: 10 },
  demoTagText: { fontSize: 10, fontFamily: FONT.semibold, fontWeight: '600', color: COLOR.pendingText },

  availCard: {
    backgroundColor: COLOR.card, borderRadius: 18, padding: 16,
    borderWidth: 1, borderColor: COLOR.borderSoft,
  },
  availRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  availRowText: { fontSize: 13, fontFamily: FONT.regular, color: COLOR.text, marginLeft: 10 },
  availSlots: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: COLOR.borderSoft },
  availSlot: { flexDirection: 'row', alignItems: 'center', width: '50%', paddingVertical: 5 },
  availSlotDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: COLOR.emerald, marginRight: 8 },
  availSlotText: { fontSize: 12, fontFamily: FONT.medium, fontWeight: '500', color: COLOR.text },

  detailsCTA: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLOR.royal, borderRadius: 16,
    paddingVertical: 16, marginTop: 22,
  },
  detailsCTAText: { fontSize: 15, fontFamily: FONT.semibold, fontWeight: '600', color: '#FFFFFF', marginRight: 6 },

  /* Book view */
  bookBanner: {
    margin: 16, marginBottom: 4, borderRadius: 22, overflow: 'hidden', height: 150, position: 'relative',
  },
  bookBannerImage: { width: '100%', height: '100%' },
  bookBannerOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(109,40,217,0.78)' },
  bookBannerContent: { position: 'absolute', left: 18, right: 18, top: 18, bottom: 18, justifyContent: 'flex-end' },
  bookBannerLabel: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 9, paddingVertical: 5, borderRadius: 14 },
  bookBannerLabelText: { fontSize: 10, fontFamily: FONT.semibold, fontWeight: '600', color: '#FFFFFF', marginLeft: 5, letterSpacing: 0.3 },
  bookBannerName: { fontSize: 22, fontFamily: FONT.bold, fontWeight: '700', color: '#FFFFFF', marginTop: 10, letterSpacing: -0.2 },
  bookBannerMetaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  bookBannerMeta: { fontSize: 12, fontFamily: FONT.regular, color: 'rgba(255,255,255,0.95)', marginHorizontal: 4 },
  bookBannerDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.7)', marginHorizontal: 4 },

  bookBody: { paddingHorizontal: 16, paddingTop: 10 },
  fieldLabel: { fontSize: 13, fontFamily: FONT.semibold, fontWeight: '600', color: COLOR.text, marginBottom: 8, marginTop: 16 },
  optional: { fontFamily: FONT.regular, fontWeight: '400', color: COLOR.sub },
  fieldBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLOR.card, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 14,
    borderWidth: 1, borderColor: COLOR.border,
  },
  fieldBoxError: { borderColor: COLOR.danger, backgroundColor: '#FEF2F2' },
  fieldValue: { flex: 1, fontSize: 14, fontFamily: FONT.regular, color: COLOR.text, marginLeft: 10 },
  fieldPlaceholder: { color: COLOR.sub },
  fieldError: { fontSize: 12, fontFamily: FONT.regular, color: COLOR.danger, marginTop: 6, marginLeft: 4 },

  timeRow: { flexDirection: 'row', alignItems: 'flex-start' },

  guestBox: { justifyContent: 'space-between' },
  guestStepper: { flexDirection: 'row', alignItems: 'center' },
  guestStepBtn: { width: 34, height: 34, borderRadius: 12, backgroundColor: '#F4F0FE', alignItems: 'center', justifyContent: 'center' },
  guestStepDisabled: { opacity: 0.4 },
  guestValue: { fontSize: 16, fontFamily: FONT.bold, fontWeight: '700', color: COLOR.text, marginHorizontal: 16, minWidth: 40, textAlign: 'center' },
  guestMeta: { alignItems: 'flex-end' },
  guestMetaText: { fontSize: 11, fontFamily: FONT.regular, color: COLOR.sub, marginBottom: 6 },
  guestBar: { width: 90, height: 5, borderRadius: 3, backgroundColor: COLOR.border },
  guestBarFill: { height: '100%', borderRadius: 3, backgroundColor: COLOR.emerald },

  textAreaBox: { padding: 12, alignItems: 'stretch' },
  textArea: {
    fontSize: 14, fontFamily: FONT.regular, color: COLOR.text,
    minHeight: 76, textAlignVertical: 'top', padding: 0, width: '100%',
  },
  charCount: { fontSize: 10, fontFamily: FONT.regular, color: COLOR.sub, alignSelf: 'flex-end', marginTop: 6 },

  conflictBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FEF2F2', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, marginTop: 14,
  },
  conflictText: { fontSize: 12, fontFamily: FONT.regular, color: COLOR.danger, marginLeft: 8, flex: 1 },

  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLOR.royal, borderRadius: 16,
    paddingVertical: 16, marginTop: 24,
  },
  submitBtnDisabled: { backgroundColor: COLOR.soft, opacity: 0.7 },
  submitBtnText: { fontSize: 15, fontFamily: FONT.semibold, fontWeight: '600', color: '#FFFFFF', marginRight: 8 },
  submitHint: { fontSize: 11, fontFamily: FONT.regular, color: COLOR.sub, textAlign: 'center', marginTop: 12, lineHeight: 16, paddingHorizontal: 20 },

  /* Success */
  successWrap: { alignItems: 'center', paddingHorizontal: 24, paddingTop: 50, paddingBottom: 40 },
  successCircle: {
    width: 88, height: 88, borderRadius: 44, backgroundColor: COLOR.emerald,
    alignItems: 'center', justifyContent: 'center',
    ...Platform.select({
      ios: { shadowColor: COLOR.emerald, shadowOpacity: 0.3, shadowRadius: 18, shadowOffset: { width: 0, height: 8 } },
      android: { elevation: 6 },
    }),
  },
  successTitle: { fontSize: 22, fontFamily: FONT.bold, fontWeight: '700', color: COLOR.text, marginTop: 22, letterSpacing: -0.2 },
  successSub: { fontSize: 14, fontFamily: FONT.regular, color: COLOR.sub, textAlign: 'center', marginTop: 10, lineHeight: 21 },
  successCard: {
    backgroundColor: COLOR.card, borderRadius: 18, padding: 18, marginTop: 24, width: '100%',
    borderWidth: 1, borderColor: COLOR.borderSoft,
  },
  successCardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  successCardLabel: { fontSize: 13, fontFamily: FONT.regular, color: COLOR.sub },
  successCardValue: { fontSize: 13, fontFamily: FONT.semibold, fontWeight: '600', color: COLOR.text },
  successDivider: { height: 1, backgroundColor: COLOR.borderSoft, marginVertical: 4 },
  successActions: { marginTop: 26, width: '100%' },
  successPrimary: {
    backgroundColor: COLOR.royal, borderRadius: 16, paddingVertical: 16, alignItems: 'center',
  },
  successPrimaryText: { fontSize: 15, fontFamily: FONT.semibold, fontWeight: '600', color: '#FFFFFF' },
  successSecondary: { paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  successSecondaryText: { fontSize: 13, fontFamily: FONT.medium, fontWeight: '500', color: COLOR.sub },

  /* My bookings */
  bookingsHead: { paddingHorizontal: 16, paddingTop: 18 },
  bookingsHeadTitle: { fontSize: 24, fontFamily: FONT.bold, fontWeight: '700', color: COLOR.text, letterSpacing: -0.3 },
  bookingsHeadSub: { fontSize: 13, fontFamily: FONT.regular, color: COLOR.sub, marginTop: 4 },

  bookingsFilters: { paddingVertical: 16, paddingHorizontal: 16 },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18,
    backgroundColor: COLOR.card, borderWidth: 1, borderColor: COLOR.border, marginRight: 8,
  },
  filterChipActive: { backgroundColor: COLOR.royal, borderColor: COLOR.royal },
  filterChipText: { fontSize: 12, fontFamily: FONT.medium, fontWeight: '500', color: COLOR.sub },
  filterChipTextActive: { color: '#FFFFFF', fontFamily: FONT.semibold, fontWeight: '600' },

  emptyFiltered: { alignItems: 'center', paddingVertical: 50 },
  emptyFilteredText: { fontSize: 13, fontFamily: FONT.regular, color: COLOR.sub, marginTop: 12 },

  bookingCard: {
    backgroundColor: COLOR.card, borderRadius: CARD_RADIUS, marginBottom: 14,
    padding: 14, marginHorizontal: 16,
    borderWidth: 1, borderColor: COLOR.borderSoft,
    ...Platform.select({
      ios: { shadowColor: COLOR.shadow, shadowOpacity: 0.05, shadowRadius: 12, shadowOffset: { width: 0, height: 5 } },
      android: { elevation: 2 },
    }),
  },
  bookingCardTop: { flexDirection: 'row', alignItems: 'flex-start' },
  bookingThumb: { width: 64, height: 64, borderRadius: 14, backgroundColor: COLOR.borderSoft },
  bookingCardInfo: { flex: 1, marginLeft: 12 },
  bookingVenueName: { fontSize: 15, fontFamily: FONT.bold, fontWeight: '700', color: COLOR.text },
  bookingId: { fontSize: 10, fontFamily: FONT.medium, fontWeight: '500', color: COLOR.soft, marginTop: 2 },
  bookingMetaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  bookingMetaText: { fontSize: 12, fontFamily: FONT.regular, color: COLOR.sub, marginLeft: 6 },

  bookingNotes: {
    marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: COLOR.borderSoft,
    backgroundColor: '#F8FAFC', borderRadius: 10, padding: 10,
  },
  bookingNotesLabel: { fontSize: 10, fontFamily: FONT.semibold, fontWeight: '600', color: COLOR.sub, letterSpacing: 0.4 },
  bookingNotesText: { fontSize: 12, fontFamily: FONT.regular, color: COLOR.text, marginTop: 4, lineHeight: 17 },

  bookingCardFoot: { marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: COLOR.borderSoft, flexDirection: 'row', justifyContent: 'flex-end' },
  bookingViewBtn: { flexDirection: 'row', alignItems: 'center' },
  bookingViewBtnText: { fontSize: 12, fontFamily: FONT.semibold, fontWeight: '600', color: COLOR.royal, marginRight: 2 },

  /* Empty bookings state */
  emptyBookings: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, paddingVertical: 40 },
  emptyBookingsIcon: {
    width: 92, height: 92, borderRadius: 46, backgroundColor: '#F4F0FE',
    alignItems: 'center', justifyContent: 'center',
  },
  emptyBookingsTitle: { fontSize: 20, fontFamily: FONT.bold, fontWeight: '700', color: COLOR.text, marginTop: 22 },
  emptyBookingsSub: { fontSize: 14, fontFamily: FONT.regular, color: COLOR.sub, textAlign: 'center', marginTop: 8, lineHeight: 21 },
  emptyBookingsBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLOR.royal, borderRadius: 16, paddingHorizontal: 22, paddingVertical: 14, marginTop: 24,
  },
  emptyBookingsBtnText: { fontSize: 14, fontFamily: FONT.semibold, fontWeight: '600', color: '#FFFFFF', marginLeft: 6 },

  /* Badges */
  badge: { flexDirection: 'row', alignItems: 'center' },

  /* Modals */
  modalOverlay: {
    flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(15,23,42,0.45)',
  },
  dateModal: {
    backgroundColor: COLOR.card, borderTopLeftRadius: 26, borderTopRightRadius: 26,
    paddingHorizontal: 20, paddingTop: 18, paddingBottom: 30,
  },
  dateModalHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  dateModalTitle: { fontSize: 17, fontFamily: FONT.bold, fontWeight: '700', color: COLOR.text },
  dateModalClose: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLOR.bg, alignItems: 'center', justifyContent: 'center' },

  dateNavRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  dateNavBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#F4F0FE', alignItems: 'center', justifyContent: 'center' },
  dateNavMonth: { fontSize: 16, fontFamily: FONT.semibold, fontWeight: '600', color: COLOR.text },

  dateWeekRow: { flexDirection: 'row', marginBottom: 6 },
  dateWeekDay: { flex: 1, textAlign: 'center', fontSize: 11, fontFamily: FONT.semibold, fontWeight: '600', color: COLOR.sub },

  dateGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dateCell: { width: '14.2857%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 2 },
  dateCellSelected: { backgroundColor: COLOR.royal, borderRadius: 14 },
  dateCellText: { fontSize: 14, fontFamily: FONT.regular, color: COLOR.text },
  dateCellPast: { color: COLOR.border },
  dateCellTextSelected: { color: '#FFFFFF', fontFamily: FONT.semibold, fontWeight: '600' },

  dateLegend: { flexDirection: 'row', justifyContent: 'center', marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: COLOR.borderSoft },
  dateLegendItem: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 14 },
  dateLegendDot: { width: 10, height: 10, borderRadius: 5, marginRight: 6 },
  dateLegendText: { fontSize: 11, fontFamily: FONT.regular, color: COLOR.sub },

  /* Time modal */
  timeModal: {
    backgroundColor: COLOR.card, borderTopLeftRadius: 26, borderTopRightRadius: 26,
    paddingHorizontal: 20, paddingTop: 18, paddingBottom: 30,
  },
  timeModalHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  timeModalTitle: { fontSize: 17, fontFamily: FONT.bold, fontWeight: '700', color: COLOR.text },

  timeWheelWrap: {
    flexDirection: 'row', height: 200, position: 'relative',
    backgroundColor: COLOR.bg, borderRadius: 16,
  },
  timeWheelHighlight: {
    position: 'absolute', top: 72, left: 0, right: 0, height: 56,
    backgroundColor: '#F4F0FE', borderRadius: 14, borderWidth: 1, borderColor: '#E9DFFB',
  },
  timeWheel: { flex: 1 },
  timeWheelItem: { height: 56, alignItems: 'center', justifyContent: 'center' },
  timeWheelText: { fontSize: 18, fontFamily: FONT.regular, color: COLOR.sub },
  timeWheelTextActive: { fontSize: 22, fontFamily: FONT.bold, fontWeight: '700', color: COLOR.royal },
  timeColon: { position: 'absolute', left: 0, right: 0, top: 80, textAlign: 'center', fontSize: 24, fontFamily: FONT.bold, fontWeight: '700', color: COLOR.text },

  timePreviewRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingHorizontal: 4 },
  timePreviewLabel: { fontSize: 13, fontFamily: FONT.regular, color: COLOR.sub },
  timePreviewValue: { fontSize: 18, fontFamily: FONT.bold, fontWeight: '700', color: COLOR.text },

  timeApplyBtn: { backgroundColor: COLOR.royal, borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginTop: 16 },

  timeApplyText: { fontSize: 15, fontFamily: FONT.semibold, fontWeight: '600', color: '#FFFFFF' },
loadingContainer: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
},

previewNotice: {
  color: COLOR.pendingText,
  fontSize: 10,
  textAlign: 'center',
  padding: 8,
  backgroundColor: COLOR.pendingBg,
},
});
