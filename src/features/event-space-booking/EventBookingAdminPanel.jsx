import React, {useCallback, useEffect, useRef, useState} from 'react';
import {ActivityIndicator, Image, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View} from 'react-native';
import {eventBookingApi} from '../../services/eventBookingService';
import {getMongoBookingId} from './eventBookingLogic';

const violet = '#6D28D9';
const softViolet = '#8B5CF6';
const statuses = ['All', 'Pending', 'Approved', 'Rejected'];
const emptyVenue = {name: '', description: '', location: '', capacity: '', hourlyRate: '', currency: 'PKR', openingTime: '09:00', closingTime: '22:00', amenities: '', images: ''};

function VenueImagePreview({uri}) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [uri]);
  return <View style={styles.imagePreview}>
    {!!uri && !failed ? <Image source={{uri}} style={styles.previewImage} resizeMode="cover" onError={() => setFailed(true)} /> : <View style={styles.imagePlaceholder}><Text style={styles.placeholderText}>Image preview unavailable</Text></View>}
  </View>;
}

function Field({label, value, onChangeText, ...props}) {
  return <View style={styles.field}><Text style={styles.label}>{label}</Text><TextInput style={styles.input} value={value} onChangeText={onChangeText} placeholder={label} {...props}/></View>;
}

export function RejectionReasonModal({visible, onCancel, onSubmit, busy}) {
  const [reason, setReason] = useState('');
  useEffect(() => {if (!visible) setReason('');}, [visible]);
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}><View style={styles.scrim}><View style={styles.modal}><Text style={styles.title}>Reject booking</Text><Text style={styles.label}>Reason (required)</Text><TextInput multiline value={reason} onChangeText={setReason} style={[styles.input, styles.multiline]} placeholder="Explain why this booking is rejected"/><View style={styles.row}><Action label="Cancel" onPress={onCancel} secondary/><Action label={busy ? 'Saving…' : 'Reject'} disabled={!reason.trim() || busy} onPress={() => onSubmit(reason.trim())}/></View></View></View></Modal>;
}

function Action({label, onPress, secondary, disabled, danger}) {
  return <TouchableOpacity disabled={disabled} onPress={onPress} style={[styles.action, secondary && styles.secondary, danger && styles.danger, disabled && styles.disabled]}><Text style={[styles.actionText, secondary && styles.secondaryText]}>{label}</Text></TouchableOpacity>;
}

export function AdminBookingCard({booking, onApprove, onReject, busy}) {
  return <View style={styles.card}><View style={styles.row}><Text style={styles.title}>{booking.bookingCode || booking.id}</Text><Text style={styles.status}>{booking.status}</Text></View>
    {!!booking.residentName && <Text style={styles.detail}>{booking.residentName}{booking.residentEmail ? ` · ${booking.residentEmail}` : ''}</Text>}
    <Text style={styles.detail}>{booking.venueName} · {booking.date} · {booking.start}–{booking.end}</Text>
    <Text style={styles.detail}>{booking.guests} guests · {booking.purpose}</Text>
    {booking.status === 'Rejected' && !!booking.rejectionReason && <Text style={styles.reason}>Reason: {booking.rejectionReason}</Text>}
    {booking.status === 'Pending' && <View style={styles.row}><Action label="Approve" onPress={onApprove} disabled={busy}/><Action label="Reject" onPress={onReject} danger disabled={busy}/></View>}
  </View>;
}

export function VenueFormModal({visible, initial, onCancel, onSave, busy}) {
  const [form, setForm] = useState(emptyVenue);
  useEffect(() => {if (visible) setForm(initial ? {...emptyVenue, ...initial, capacity: String(initial.capacity), hourlyRate: String(initial.hourlyRate), amenities: (initial.amenities || initial.facilities || []).join(', '), images: (initial.images || (initial.image ? [initial.image] : [])).join(', ')} : emptyVenue);}, [visible, initial]);
  const set = key => value => setForm(current => ({...current, [key]: value}));
  const previewUri = form.images.split(',').map(value => value.trim()).find(Boolean) || '';
  const submit = () => onSave({name: form.name.trim(), description: form.description.trim(), location: form.location.trim(), capacity: Number(form.capacity), hourlyRate: Number(form.hourlyRate), currency: form.currency.trim() || 'PKR', openingTime: form.openingTime.trim(), closingTime: form.closingTime.trim(), amenities: form.amenities.split(',').map(x => x.trim()).filter(Boolean), images: form.images.split(',').map(x => x.trim()).filter(Boolean)});
  return <Modal visible={visible} animationType="slide" onRequestClose={onCancel}><ScrollView contentContainerStyle={styles.formPage} keyboardShouldPersistTaps="handled"><Text style={styles.title}>{initial ? 'Edit venue' : 'Add venue'}</Text>
    <Field label="Name" value={form.name} onChangeText={set('name')}/><Field label="Description" value={form.description} onChangeText={set('description')}/><Field label="Location" value={form.location} onChangeText={set('location')}/><Field label="Capacity" value={form.capacity} onChangeText={set('capacity')} keyboardType="numeric"/><Field label="Hourly rate" value={form.hourlyRate} onChangeText={set('hourlyRate')} keyboardType="decimal-pad"/><Field label="Currency" value={form.currency} onChangeText={set('currency')}/><Field label="Opening time (HH:mm)" value={form.openingTime} onChangeText={set('openingTime')}/><Field label="Closing time (HH:mm)" value={form.closingTime} onChangeText={set('closingTime')}/><Field label="Facilities / amenities (comma separated)" value={form.amenities} onChangeText={set('amenities')}/><Field label="Image URLs (comma separated)" value={form.images} onChangeText={set('images')}/><VenueImagePreview uri={previewUri}/>
    <View style={styles.row}><Action label="Cancel" onPress={onCancel} secondary/><Action label={busy ? 'Saving…' : 'Save venue'} onPress={submit} disabled={busy || !form.name.trim() || !form.location.trim() || !form.capacity || !form.hourlyRate}/></View></ScrollView></Modal>;
}

export default function EventBookingAdminPanel({token, onBack}) {
  const [filter, setFilter] = useState('All');
  const [bookings, setBookings] = useState([]);
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');
  const [rejecting, setRejecting] = useState(null);
  const [venueForm, setVenueForm] = useState(null);
  const [venueBusy, setVenueBusy] = useState(false);
  const loadRequestId = useRef(0);
  const load = useCallback(async () => {
    const requestId = ++loadRequestId.current;
    setLoading(true); setError('');
    try {
      const [bs, vs] = await Promise.all([eventBookingApi.getAdminBookings(token, filter === 'All' ? '' : filter), eventBookingApi.getVenues(token)]);
      if (loadRequestId.current === requestId) {setBookings(bs); setVenues(vs);}
    } catch (e) {
      if (loadRequestId.current === requestId) setError(e.status === 403 ? 'Admin access required (403). Sign in with an administrator account.' : e.message || 'Unable to load admin data.');
    } finally {
      if (loadRequestId.current === requestId) setLoading(false);
    }
  }, [token, filter]);
  useEffect(() => {load();}, [load]);
  const review = async (booking, action, reason = '') => {
    const mongoBookingId = getMongoBookingId(booking);
    if (!mongoBookingId) {
      setError('This booking is missing its MongoDB ID and cannot be reviewed.');
      return;
    }
    setBusyId(mongoBookingId); setError('');
    try {
      if (action === 'approve') await eventBookingApi.approveBooking(mongoBookingId, token);
      else await eventBookingApi.rejectBooking(mongoBookingId, reason, token);
      setRejecting(null); await load();
    } catch (e) {
      setError(e.status === 403 ? 'Admin access required (403).' : e.message || 'Unable to update booking.');
    } finally {setBusyId('');}
  };
  const saveVenue = async payload => {setVenueBusy(true); setError(''); try {if (venueForm?._id) await eventBookingApi.updateVenue(venueForm._id, payload, token); else await eventBookingApi.createVenue(payload, token); setVenueForm(null); await load();} catch (e) {setError(e.status === 403 ? 'Admin access required (403).' : e.message || 'Unable to save venue.');} finally {setVenueBusy(false);}};
  const deactivate = async venue => {setBusyId(venue.id); setError(''); try {await eventBookingApi.deactivateVenue(venue.id, token); await load();} catch (e) {setError(e.status === 403 ? 'Admin access required (403).' : e.message || 'Unable to deactivate venue.');} finally {setBusyId('');}};
  return <View style={styles.page}><View style={styles.header}><Action label="Back" secondary onPress={onBack}/><Text style={styles.title}>Event Booking Admin</Text><Action label="Refresh" secondary onPress={load}/></View>
    <ScrollView contentContainerStyle={styles.content}><Text style={styles.section}>Bookings</Text><ScrollView horizontal showsHorizontalScrollIndicator={false}>{statuses.map(item => <TouchableOpacity key={item} onPress={() => setFilter(item)} style={[styles.filter, filter === item && styles.filterActive]}><Text style={{color: filter === item ? '#fff' : violet}}>{item}</Text></TouchableOpacity>)}</ScrollView>
    {!!error && <Text style={styles.error}>{error}</Text>}{loading ? <ActivityIndicator color={violet} style={styles.loader}/> : bookings.length ? bookings.map(b => {const bookingId = getMongoBookingId(b); return <AdminBookingCard key={bookingId || b.bookingCode} booking={b} busy={busyId === bookingId} onApprove={() => review(b, 'approve')} onReject={() => setRejecting(b)}/>;}) : <Text style={styles.empty}>No bookings found.</Text>}
    <View style={styles.row}><Text style={styles.section}>Active venues</Text><Action label="Add venue" onPress={() => setVenueForm({})}/></View>{venues.length ? venues.map(v => <View key={v.id} style={styles.card}><VenueImagePreview uri={v.image || v.images?.[0] || ''}/><Text style={styles.title}>{v.name}</Text><Text style={styles.detail}>{v.location} · {v.capacity} capacity · {v.price}</Text><Text style={styles.detail}>{v.hours} · {(v.facilities || []).join(', ')}</Text><View style={styles.row}><Action label="Edit" secondary onPress={() => setVenueForm({...v, _id: v.id, amenities: v.facilities, images: v.images || (v.image ? [v.image] : [])})}/><Action label={busyId === v.id ? 'Saving…' : 'Deactivate'} danger disabled={!!busyId} onPress={() => deactivate(v)}/></View></View>) : <Text style={styles.empty}>No active venues found.</Text>}</ScrollView>
    <RejectionReasonModal visible={!!rejecting} busy={!!busyId} onCancel={() => setRejecting(null)} onSubmit={reason => review(rejecting, 'reject', reason)}/><VenueFormModal visible={!!venueForm} initial={venueForm?._id ? venueForm : null} busy={venueBusy} onCancel={() => setVenueForm(null)} onSave={saveVenue}/>
  </View>;
}

const styles = StyleSheet.create({page: {flex: 1, backgroundColor: '#F8FAFC'}, header: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, backgroundColor: '#fff'}, content: {padding: 16, paddingBottom: 32}, section: {fontSize: 18, fontWeight: '700', color: '#111827', marginVertical: 12}, title: {fontSize: 16, fontWeight: '700', color: '#111827', flex: 1}, card: {backgroundColor: '#fff', borderRadius: 14, padding: 14, marginVertical: 7, borderWidth: 1, borderColor: '#E2E8F0'}, row: {flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8}, detail: {fontSize: 13, color: '#475569', marginTop: 6}, status: {color: violet, fontWeight: '700'}, reason: {color: '#B91C1C', marginTop: 8}, filter: {paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18, borderWidth: 1, borderColor: softViolet, marginRight: 8}, filterActive: {backgroundColor: violet}, action: {backgroundColor: violet, borderRadius: 9, paddingHorizontal: 14, paddingVertical: 10, alignItems: 'center'}, actionText: {color: '#fff', fontWeight: '700'}, secondary: {backgroundColor: '#F1ECFE'}, secondaryText: {color: violet}, danger: {backgroundColor: '#DC2626'}, disabled: {opacity: .45}, empty: {color: '#64748B', textAlign: 'center', padding: 18}, error: {color: '#B91C1C', marginVertical: 10}, loader: {margin: 24}, field: {marginVertical: 6}, label: {fontSize: 13, color: '#475569', marginBottom: 4}, input: {borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 9, paddingHorizontal: 11, paddingVertical: 9, color: '#111827', backgroundColor: '#fff'}, multiline: {height: 100, textAlignVertical: 'top'}, scrim: {flex: 1, justifyContent: 'center', padding: 22, backgroundColor: '#0008'}, modal: {backgroundColor: '#fff', borderRadius: 16, padding: 18}, formPage: {padding: 20, paddingTop: 50, backgroundColor: '#F8FAFC'}, imagePreview: {width: '100%', height: 150, borderRadius: 12, overflow: 'hidden', marginTop: 8, backgroundColor: '#E2E8F0'}, previewImage: {width: '100%', height: '100%'}, imagePlaceholder: {flex: 1, alignItems: 'center', justifyContent: 'center'}, placeholderText: {color: '#64748B', fontSize: 12}});
