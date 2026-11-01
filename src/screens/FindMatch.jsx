
import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';

const DEMO_LISTINGS = [
  {
    id: '1',
    owner: 'Ali Raza',
    block: 'Block 7',
    distance: '0.5 km',
    title: 'Drill Machine',
    category: 'Tools',
    description: 'Available for small home repairs.',
    available: true,
  },
  {
    id: '2',
    owner: 'Sana Khan',
    block: 'Block 5',
    distance: '0.8 km',
    title: 'Electric Drill',
    category: 'Tools',
    description: 'Cordless drill available for short-term use.',
    available: true,
  },
  {
    id: '3',
    owner: 'Usman Ahmed',
    block: 'Block 6',
    distance: '1.2 km',
    title: 'Tool Kit',
    category: 'Tools',
    description: 'Basic home repair tools available to borrow.',
    available: true,
  },
  {
    id: '4',
    owner: 'Ayesha Khan',
    block: 'Block 7',
    distance: '0.4 km',
    title: 'Study Notes',
    category: 'Education',
    description: 'Study notes available to share.',
    available: true,
  },
  {
    id: '5',
    owner: 'Hamza Ali',
    block: 'Block 4',
    distance: '1.0 km',
    title: 'Ladder',
    category: 'Home',
    description: 'A ladder available for household tasks.',
    available: true,
  },
];

const DEMO_INCOMING_REQUESTS = [
  {
    id: '101',
    requester: 'Ahmed Khan',
    block: 'Block 3',
    itemTitle: 'Your Bicycle',
    status: 'Pending',
  },
  {
    id: '102',
    requester: 'Fatima Ali',
    block: 'Block 5',
    itemTitle: 'Your Study Table',
    status: 'Pending',
  },
];

const normalize = value => String(value || '').toLowerCase().trim();

const FindMatch = ({
  needs = [],
  requests = [],
  onCreateRequest,
  onBack,
}) => {
  const [search, setSearch] = useState('');
  const [selectedNeed, setSelectedNeed] = useState(
    needs.length > 0 ? needs[needs.length - 1] : null,
  );

  const [incomingRequests, setIncomingRequests] = useState(
    DEMO_INCOMING_REQUESTS,
  );

  const searchText = search.trim() || selectedNeed?.title || '';

  const matches = useMemo(() => {
    if (!searchText.trim()) {
      return [];
    }

    const query = normalize(searchText);
    const category = normalize(selectedNeed?.category || '');
    const words = query.split(/\s+/).filter(word => word.length > 2);
    const manualSearch = search.trim().length > 0;

    return DEMO_LISTINGS.filter(listing => {
      if (!listing.available) {
        return false;
      }

      const title = normalize(listing.title);
      const description = normalize(listing.description);
      const listingCategory = normalize(listing.category);

      const titleMatch =
        title.includes(query) ||
        words.some(word => title.includes(word));

      const descriptionMatch = words.some(word =>
        description.includes(word),
      );

      // Category matching is used only when selecting a saved need.
      const categoryMatch =
        !manualSearch &&
        category.length > 0 &&
        listingCategory === category;

      return titleMatch || descriptionMatch || categoryMatch;
    });
  }, [searchText, selectedNeed, search]);

  const getStatusStyle = status => {
    switch (status) {
      case 'Accepted':
        return {
          backgroundColor: '#DCFCE7',
          color: '#166534',
        };
      case 'Rejected':
        return {
          backgroundColor: '#FEE2E2',
          color: '#991B1B',
        };
      default:
        return {
          backgroundColor: '#FEF3C7',
          color: '#92400E',
        };
    }
  };

  const handleRequest = listing => {
    const alreadyRequested = requests.some(
      request => request.listingId === listing.id,
    );

    if (alreadyRequested) {
      Alert.alert(
        'Request Already Sent',
        'You have already requested this listing.',
      );
      return;
    }

    if (typeof onCreateRequest !== 'function') {
      Alert.alert(
        'Request Unavailable',
        'Request handling is not connected yet.',
      );
      return;
    }

    try {
      const success = onCreateRequest(listing);

      if (success === false) {
        Alert.alert(
          'Request Already Sent',
          'You have already requested this listing.',
        );
        return;
      }

      Alert.alert(
        'Request Sent',
        `Your request for ${listing.title} has been sent.`,
      );
    } catch (error) {
      Alert.alert(
        'Request Not Sent',
        'Please try again.',
      );
    }
  };

  const handleIncomingRequest = (requestId, newStatus) => {
    setIncomingRequests(previousRequests =>
      previousRequests.map(request =>
        request.id === requestId
          ? { ...request, status: newStatus }
          : request,
      ),
    );

    Alert.alert(
      'Request Updated',
      `Request has been ${newStatus.toLowerCase()}.`,
    );
  };

  const renderListing = listing => {
    const requested = requests.some(
      request => request.listingId === listing.id,
    );

    return (
      <View key={listing.id} style={styles.listingCard}>
        <View style={styles.ownerRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {listing.owner
                .split(' ')
                .map(part => part[0])
                .join('')}
            </Text>
          </View>

          <View style={styles.ownerInfo}>
            <Text style={styles.ownerName}>{listing.owner}</Text>
            <Text style={styles.location}>
              {listing.block} · {listing.distance}
            </Text>
          </View>

          <View style={styles.availableBadge}>
            <Text style={styles.availableText}>Available</Text>
          </View>
        </View>

        <View style={styles.listingDetails}>
          <Text style={styles.listingTitle}>{listing.title}</Text>
          <Text style={styles.categoryBadge}>{listing.category}</Text>
          <Text style={styles.description}>
            {listing.description}
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.contactButton,
            requested && styles.requestedButton,
          ]}
          onPress={() => handleRequest(listing)}
          activeOpacity={0.85}
          disabled={requested}>
          <Text style={styles.contactButtonText}>
            {requested ? 'Request Sent ✓' : 'Request Item →'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderStatus = status => {
    const statusStyle = getStatusStyle(status);

    return (
      <View
        style={[
          styles.statusBadge,
          { backgroundColor: statusStyle.backgroundColor },
        ]}>
        <Text
          style={[
            styles.statusText,
            { color: statusStyle.color },
          ]}>
          {status}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled">

        <TouchableOpacity
          onPress={onBack}
          style={styles.backButton}>
          <Text style={styles.backText}>
            ‹  Back to Dashboard
          </Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.eyebrow}>
            NEXALIVING COMMUNITY
          </Text>
          <Text style={styles.heading}>Need → Match</Text>
          <Text style={styles.subtitle}>
            Find useful items and helpful neighbours in your community.
          </Text>
        </View>

        {/* YOUR NEEDS */}
        {needs.length > 0 && (
          <View style={styles.needSection}>
            <Text style={styles.sectionTitle}>Your Needs</Text>

            {needs.map(need => (
              <TouchableOpacity
                key={need.id}
                style={[
                  styles.needOption,
                  selectedNeed?.id === need.id &&
                  styles.selectedNeedOption,
                ]}
                onPress={() => {
                  setSelectedNeed(need);
                  setSearch('');
                }}>
                <View style={styles.needOptionText}>
                  <Text style={styles.needTitle}>
                    {need.title}
                  </Text>
                  <Text style={styles.needCategory}>
                    {need.category} · {need.duration || 'Duration not set'}
                  </Text>
                </View>

                <Text style={styles.selectIcon}>
                  {selectedNeed?.id === need.id ? '✓' : '›'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* SEARCH */}
        <Text style={styles.sectionTitle}>Search for an Item</Text>

        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>⌕</Text>

          <TextInput
            style={styles.searchInput}
            placeholder="e.g. Drill machine, ladder, notes"
            placeholderTextColor="#94A3B8"
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />

          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text style={styles.clearText}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* MATCHES */}
        <View style={styles.resultsHeader}>
          <Text style={styles.sectionTitle}>Available Matches</Text>
          <Text style={styles.count}>{matches.length} found</Text>
        </View>

        <View style={styles.demoNotice}>
          <Text style={styles.demoNoticeText}>
            Demo listings only. Real resident listings will require backend integration.
          </Text>
        </View>

        {matches.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>⌕</Text>
            <Text style={styles.emptyTitle}>
              No matching listings
            </Text>
            <Text style={styles.emptyText}>
              Select one of your needs or search for an item.
            </Text>
          </View>
        ) : (
          matches.map(renderListing)
        )}

        {/* MY REQUESTS */}
        <View style={styles.myRequestsSection}>
          <Text style={styles.sectionTitle}>My Requests</Text>

          {requests.length === 0 ? (
            <View style={styles.emptyRequestCard}>
              <Text style={styles.emptyText}>
                You have not sent any requests yet.
              </Text>
            </View>
          ) : (
            requests.map(request => (
              <View key={request.id} style={styles.requestCard}>
                <Text style={styles.listingTitle}>
                  {request.itemTitle}
                </Text>

                <Text style={styles.description}>
                  Owner: {request.owner}
                </Text>

                {renderStatus(request.status)}
              </View>
            ))
          )}
        </View>

        {/* INCOMING REQUESTS */}
        <View style={styles.incomingSection}>
          <Text style={styles.sectionTitle}>
            Incoming Requests
          </Text>

          {incomingRequests.length === 0 ? (
            <View style={styles.emptyRequestCard}>
              <Text style={styles.emptyText}>
                No incoming requests right now.
              </Text>
            </View>
          ) : (
            incomingRequests.map(request => (
              <View key={request.id} style={styles.requestCard}>
                <Text style={styles.listingTitle}>
                  {request.itemTitle}
                </Text>

                <Text style={styles.description}>
                  Requested by: {request.requester}
                </Text>

                <Text style={styles.location}>
                  {request.block}
                </Text>

                {renderStatus(request.status)}

                {request.status === 'Pending' && (
                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={styles.acceptButton}
                      onPress={() =>
                        handleIncomingRequest(
                          request.id,
                          'Accepted',
                        )
                      }>
                      <Text style={styles.actionButtonText}>
                        Accept
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.rejectButton}
                      onPress={() =>
                        handleIncomingRequest(
                          request.id,
                          'Rejected',
                        )
                      }>
                      <Text style={styles.actionButtonText}>
                        Reject
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: 20,
    paddingBottom: 36,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    marginBottom: 18,
  },
  backText: {
    color: '#6D28D9',
    fontSize: 15,
    fontWeight: '600',
  },
  header: {
    marginBottom: 24,
  },
  eyebrow: {
    color: '#6D28D9',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  heading: {
    color: '#111827',
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    color: '#64748B',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
  },
  sectionTitle: {
    color: '#111827',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 12,
  },
  needSection: {
    marginBottom: 22,
  },
  needOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 14,
    marginBottom: 9,
  },
  selectedNeedOption: {
    borderColor: '#6D28D9',
    backgroundColor: '#F5F0FF',
  },
  needOptionText: {
    flex: 1,
  },
  needTitle: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '600',
  },
  needCategory: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 5,
  },
  selectIcon: {
    color: '#6D28D9',
    fontSize: 20,
    marginLeft: 10,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    minHeight: 54,
    marginBottom: 24,
  },
  searchIcon: {
    fontSize: 25,
    color: '#6D28D9',
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: '#111827',
    fontSize: 14,
    paddingVertical: 12,
  },
  clearText: {
    color: '#6D28D9',
    fontWeight: '600',
    paddingLeft: 8,
  },
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  count: {
    color: '#6D28D9',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 12,
  },
  demoNotice: {
    backgroundColor: '#F3E8FF',
    padding: 11,
    borderRadius: 10,
    marginBottom: 14,
  },
  demoNoticeText: {
    color: '#6D28D9',
    fontSize: 12,
    lineHeight: 18,
  },
  listingCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },
  ownerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#6D28D9',
    fontSize: 14,
    fontWeight: '700',
  },
  ownerInfo: {
    flex: 1,
    marginLeft: 11,
  },
  ownerName: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '700',
  },
  location: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 5,
  },
  availableBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
  },
  availableText: {
    color: '#047857',
    fontSize: 11,
    fontWeight: '700',
  },
  listingDetails: {
    marginTop: 16,
  },
  listingTitle: {
    color: '#111827',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 8,
  },
  categoryBadge: {
    color: '#6D28D9',
    backgroundColor: '#F3E8FF',
    alignSelf: 'flex-start',
    overflow: 'hidden',
    borderRadius: 6,
    paddingHorizontal: 9,
    paddingVertical: 4,
    fontSize: 11,
    fontWeight: '600',
  },
  description: {
    color: '#64748B',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 9,
  },
  contactButton: {
    backgroundColor: '#6D28D9',
    minHeight: 46,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  requestedButton: {
    backgroundColor: '#64748B',
  },
  contactButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyIcon: {
    color: '#6D28D9',
    fontSize: 36,
    marginBottom: 8,
  },
  emptyTitle: {
    color: '#111827',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptyText: {
    color: '#64748B',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
  myRequestsSection: {
    marginTop: 24,
    marginBottom: 20,
  },
  incomingSection: {
    marginTop: 10,
    marginBottom: 25,
  },
  emptyRequestCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 18,
  },
  requestCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    marginTop: 10,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    marginTop: 15,
  },
  acceptButton: {
    flex: 1,
    backgroundColor: '#16A34A',
    padding: 12,
    borderRadius: 9,
    alignItems: 'center',
    marginRight: 5,
  },
  rejectButton: {
    flex: 1,
    backgroundColor: '#DC2626',
    padding: 12,
    borderRadius: 9,
    alignItems: 'center',
    marginLeft: 5,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});

export default FindMatch;
