import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import AppHeader from '../components/AppHeader';
import { useTheme } from '../context/ThemeContext';
import { useCommunity } from '../context/CommunityContext';
import communityService from '../services/communityService';
import CustomAlert from '../components/CustomAlert';
import CustomInput from '../components/CustomInput';
import PrimaryButton from '../components/PrimaryButton';

const SocialScreen = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { activeCommunity } = useCommunity();

  const [events, setEvents] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Creation State
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [showNewEventModal, setShowNewEventModal] = useState(false);
  const [showNewPostModal, setShowNewPostModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [alertConfig, setAlertConfig] = useState({ visible: false, title: '', message: '', type: 'info', onConfirm: null });
  const hideAlert = () => setAlertConfig(prev => ({ ...prev, visible: false }));

  const [eventForm, setEventForm] = useState({ title: '', description: '', date: '', location: '' });
  const [postForm, setPostForm] = useState({ title: '', content: '' });

  const [activeTab, setActiveTab] = useState('feed'); // 'feed' | 'events'

  const [selectedPost, setSelectedPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newCommentBody, setNewCommentBody] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  const loadData = async () => {
    if (!activeCommunity?.id) return;
    try {
      setLoading(true);
      const [fetchedEvents, fetchedPosts] = await Promise.all([
        communityService.getEvents(activeCommunity.id),
        communityService.getPosts(activeCommunity.id)
      ]);
      
      const mappedPosts = (fetchedPosts || []).map(post => {
          const parts = (post.body || '').split('\n\n');
          const title = parts[0] || 'Untitled';
          const content = parts.slice(1).join('\n\n') || post.body;
          return {
              id: post.id,
              title,
              content,
              createdAt: post.createdAt,
              author: post.author || { name: 'Anggota' },
              isAnnouncement: post.isAnnouncement || false,
              comments: post._count?.comments || 0,
              upvotes: post.upvotes || 0
          };
      });

      setEvents(fetchedEvents || []);
      setPosts(mappedPosts || []);
    } catch (error) {
      console.error("Error loading social data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeCommunity?.id]);

  const handleOpenComments = async (post) => {
    setSelectedPost(post);
    setShowCommentsModal(true);
    setLoadingComments(true);
    try {
      const list = await communityService.getComments(post.id);
      setComments(list || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleAddComment = async () => {
    if (!newCommentBody.trim() || submittingComment || !selectedPost) return;
    setSubmittingComment(true);
    try {
      const newComment = await communityService.addComment(selectedPost.id, { body: newCommentBody.trim() });
      setComments(prev => [...prev, newComment]);
      setNewCommentBody('');
      setPosts(prev => prev.map(p => p.id === selectedPost.id ? { ...p, comments: (p.comments || 0) + 1 } : p));
    } catch (e) {
      setAlertConfig({ visible: true, title: 'Error', message: 'Gagal mengirim komentar', type: 'error', onConfirm: hideAlert });
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleUpvote = (postId) => {
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, upvotes: (p.upvotes || 0) + 1 } : p));
  };

  const handleCreateEvent = async () => {
    if (!eventForm.title) {
      setAlertConfig({ visible: true, title: 'Error', message: 'Judul event wajib diisi', type: 'error', onConfirm: hideAlert });
      return;
    }
    setSubmitting(true);
    try {
      await communityService.createEvent(activeCommunity.id, {
        ...eventForm,
        date: eventForm.date || new Date().toISOString(),
        isOnline: false,
      });
      setShowNewEventModal(false);
      setEventForm({ title: '', description: '', date: '', location: '' });
      loadData();
    } catch (e) {
      setAlertConfig({ visible: true, title: 'Error', message: 'Gagal membuat event', type: 'error', onConfirm: hideAlert });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreatePost = async () => {
    if (!postForm.title) {
      setAlertConfig({ visible: true, title: 'Error', message: 'Judul diskusi wajib diisi', type: 'error', onConfirm: hideAlert });
      return;
    }
    setSubmitting(true);
    try {
      await communityService.createPost(activeCommunity.id, {
        body: `${postForm.title}\n\n${postForm.content}`,
        isAnnouncement: false,
      });
      setShowNewPostModal(false);
      setPostForm({ title: '', content: '' });
      loadData();
    } catch (e) {
      setAlertConfig({ visible: true, title: 'Error', message: 'Gagal membuat diskusi', type: 'error', onConfirm: hideAlert });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <AppHeader />
      <View style={{ flex: 1, backgroundColor: '#f8f9fa' }}>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        {/* Segmented Control / Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'feed' && { backgroundColor: theme.colors.primary }]}
            onPress={() => setActiveTab('feed')}
          >
            <Text style={[styles.tabText, activeTab === 'feed' && { color: '#fff' }]}>Forum & Feed</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'events' && { backgroundColor: theme.colors.primary }]}
            onPress={() => setActiveTab('events')}
          >
            <Text style={[styles.tabText, activeTab === 'events' && { color: '#fff' }]}>Acara (Events)</Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'events' ? (
          /* Events Section */
          <View>
            {loading ? (
               <ActivityIndicator style={{ padding: 20 }} color={theme.colors.primary} />
            ) : events.length === 0 ? (
               <Text style={{ textAlign: 'center', padding: 20, color: '#6c757d' }}>Belum ada event yang akan datang.</Text>
            ) : (
               events.map(event => (
                  <View key={event.id} style={styles.eventCard}>
                    <View style={styles.eventTopRow}>
                      <Text style={styles.eventTitle}>{event.title}</Text>
                    </View>
                    
                    <View style={styles.eventDateRow}>
                      <Feather name="calendar" size={14} color="#6c757d" />
                      <Text style={styles.eventDateText}>{new Date(event.date).toLocaleDateString('id-ID', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</Text>
                    </View>

                    <View style={styles.rsvpRow}>
                      <TouchableOpacity style={[styles.rsvpButtonActive, { backgroundColor: theme.colors.primary }]}>
                        <Ionicons name="checkmark-circle-outline" size={16} color="#fff" style={{ marginRight: 6 }} />
                        <Text style={styles.rsvpButtonTextActive}>Hadir</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.rsvpButtonInactive}>
                        <Text style={styles.rsvpButtonTextInactive}>Tidak</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
               ))
            )}
          </View>
        ) : (
          /* Feed Section */
          <View>
            {loading ? (
           <ActivityIndicator style={{ padding: 20 }} color={theme.colors.primary} />
        ) : posts.length === 0 ? (
           <Text style={{ textAlign: 'center', padding: 20, color: '#6c757d' }}>Belum ada post/pengumuman.</Text>
        ) : (
           posts.map(post => (
              <View key={post.id} style={styles.postCard}>
                {post.isAnnouncement && (
                  <View style={styles.pinnedBadgeContainer}>
                    <MaterialCommunityIcons name="pin-outline" size={16} color="#b45309" />
                  </View>
                )}

                <View style={styles.postHeader}>
                  {post.isAnnouncement ? (
                    <View style={[styles.megaphoneContainer, { backgroundColor: theme.colors.primaryLight }]}>
                      <Feather name="speaker" size={18} color={theme.colors.primary} />
                    </View>
                  ) : (
                    <Image source={{ uri: post.author?.avatarUrl || 'https://i.pravatar.cc/150?img=5' }} style={styles.postAvatar} />
                  )}
                  <View style={styles.postHeaderInfo}>
                    <Text style={styles.postAuthor}>{post.author?.name}</Text>
                    <Text style={styles.postSubtitle}>{post.isAnnouncement ? 'Pinned Announcement • ' : ''}{new Date(post.createdAt).toLocaleDateString('id-ID')}</Text>
                  </View>
                </View>

                <Text style={{ fontWeight: 'bold', fontSize: 16, color: '#111', marginBottom: 8 }}>{post.title}</Text>
                <Text style={styles.postBody}>{post.content}</Text>

                <View style={styles.postDivider} />

                <View style={styles.engagementRow}>

                  <TouchableOpacity style={styles.engagementItem} onPress={() => handleOpenComments(post)}>
                    <Feather name="message-square" size={16} color="#6c757d" />
                    <Text style={styles.engagementText}>{post.comments || 0}</Text>
                  </TouchableOpacity>
                </View>
              </View>
           ))
        )}
          </View>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>
      </View>

      {/* Floating Action Button */}
      <TouchableOpacity style={[styles.fab, { backgroundColor: theme.colors.primary }]} onPress={() => setShowActionSheet(true)}>
        <Feather name="plus" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Action Sheet Modal */}
      <Modal visible={showActionSheet} transparent={true} animationType="fade" onRequestClose={() => setShowActionSheet(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowActionSheet(false)}>
          <View style={styles.actionSheetContent}>
            <View style={styles.actionSheetHandle} />
            <Text style={styles.actionSheetTitle}>Buat Baru</Text>
            
            <TouchableOpacity style={styles.actionItem} onPress={() => { setShowActionSheet(false); setShowNewPostModal(true); }}>
              <View style={[styles.actionIconContainer, { backgroundColor: '#eef2ff' }]}>
                <Feather name="message-square" size={22} color="#4f46e5" />
              </View>
              <View>
                <Text style={styles.actionItemTitle}>Start Discussion</Text>
                <Text style={styles.actionItemSubtitle}>Mulai diskusi di forum komunitas</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionItem} onPress={() => { setShowActionSheet(false); setShowNewEventModal(true); }}>
              <View style={[styles.actionIconContainer, { backgroundColor: '#ecfdf5' }]}>
                <Feather name="calendar" size={22} color="#10b981" />
              </View>
              <View>
                <Text style={styles.actionItemTitle}>Create New Event</Text>
                <Text style={styles.actionItemSubtitle}>Buat acara atau pertemuan baru</Text>
              </View>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal Buat Event Baru */}
      <Modal visible={showNewEventModal} transparent={true} animationType="slide" onRequestClose={() => setShowNewEventModal(false)}>
        <View style={styles.fullModalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.fullModalContent}>
            <View style={styles.fullModalHeader}>
              <TouchableOpacity onPress={() => setShowNewEventModal(false)}>
                <Feather name="x" size={24} color="#111" />
              </TouchableOpacity>
              <Text style={styles.fullModalTitle}>Event Baru</Text>
              <View style={{ width: 24 }} />
            </View>
            
            <ScrollView contentContainerStyle={{ padding: 20 }}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>JUDUL EVENT</Text>
                <CustomInput placeholder="Contoh: Rapat Bulanan Warga" value={eventForm.title} onChangeText={(text) => setEventForm(f => ({ ...f, title: text }))} />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>TANGGAL & WAKTU</Text>
                <CustomInput placeholder="YYYY-MM-DD" value={eventForm.date} onChangeText={(text) => setEventForm(f => ({ ...f, date: text }))} />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>LOKASI</Text>
                <CustomInput placeholder="Contoh: Balai Warga" value={eventForm.location} onChangeText={(text) => setEventForm(f => ({ ...f, location: text }))} />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>DESKRIPSI (Opsional)</Text>
                <TextInput style={styles.textArea} placeholder="Tulis deskripsi..." multiline numberOfLines={4} value={eventForm.description} onChangeText={(text) => setEventForm(f => ({ ...f, description: text }))} />
              </View>
              
              <PrimaryButton title="Buat Event" onPress={handleCreateEvent} loading={submitting} />
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Modal Buat Post Baru */}
      <Modal visible={showNewPostModal} transparent={true} animationType="slide" onRequestClose={() => setShowNewPostModal(false)}>
        <View style={styles.fullModalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.fullModalContent}>
            <View style={styles.fullModalHeader}>
              <TouchableOpacity onPress={() => setShowNewPostModal(false)}>
                <Feather name="x" size={24} color="#111" />
              </TouchableOpacity>
              <Text style={styles.fullModalTitle}>Diskusi Baru</Text>
              <View style={{ width: 24 }} />
            </View>
            
            <ScrollView contentContainerStyle={{ padding: 20 }}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>JUDUL DISKUSI</Text>
                <CustomInput placeholder="Tulis judul..." value={postForm.title} onChangeText={(text) => setPostForm(f => ({ ...f, title: text }))} />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>ISI PESAN</Text>
                <TextInput style={styles.textArea} placeholder="Tuliskan isi pesan atau diskusi..." multiline numberOfLines={6} value={postForm.content} onChangeText={(text) => setPostForm(f => ({ ...f, content: text }))} />
              </View>
              
              <PrimaryButton title="Mulai Diskusi" onPress={handleCreatePost} loading={submitting} />
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Comments Modal */}
      <Modal visible={showCommentsModal} transparent={true} animationType="slide" onRequestClose={() => setShowCommentsModal(false)}>
        <View style={styles.fullModalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[styles.fullModalContent, { flex: 0.85 }]}>
            <View style={styles.fullModalHeader}>
              <TouchableOpacity onPress={() => setShowCommentsModal(false)}>
                <Feather name="x" size={24} color="#111" />
              </TouchableOpacity>
              <Text style={styles.fullModalTitle}>Komentar</Text>
              <View style={{ width: 24 }} />
            </View>

            {loadingComments ? (
              <ActivityIndicator style={{ padding: 20 }} color={theme.colors.primary} />
            ) : (
              <ScrollView contentContainerStyle={{ padding: 20 }}>
                {comments.length === 0 ? (
                  <Text style={{ textAlign: 'center', color: '#6c757d' }}>Belum ada komentar.</Text>
                ) : (
                  comments.map(c => (
                    <View key={c.id} style={{ marginBottom: 16, backgroundColor: '#f8f9fa', padding: 12, borderRadius: 8 }}>
                      <Text style={{ fontWeight: 'bold', marginBottom: 4, fontSize: 13 }}>{c.author?.name || 'Anggota'}</Text>
                      <Text style={{ color: '#333', fontSize: 14 }}>{c.body}</Text>
                    </View>
                  ))
                )}
              </ScrollView>
            )}

            <View style={{ padding: 16, paddingBottom: Platform.OS === 'ios' ? 32 : 16, borderTopWidth: 1, borderColor: '#eee', flexDirection: 'row', alignItems: 'center' }}>
              <TextInput
                style={{ flex: 1, backgroundColor: '#f1f5f9', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, marginRight: 12 }}
                placeholder="Tulis komentar..."
                value={newCommentBody}
                onChangeText={setNewCommentBody}
              />
              <TouchableOpacity onPress={handleAddComment} disabled={submittingComment || !newCommentBody.trim()}>
                <Feather name="send" size={24} color={!newCommentBody.trim() ? '#cbd5e1' : theme.colors.primary} />
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <CustomAlert 
        visible={alertConfig.visible} 
        title={alertConfig.title} 
        message={alertConfig.message} 
        type={alertConfig.type} 
        onConfirm={alertConfig.onConfirm} 
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerProfilePic: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#124068',
  },
  scrollContainer: {
    paddingBottom: 40,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6c757d',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#111',
  },
  viewAllText: {
    // color dynamic
    fontSize: 14,
    fontWeight: '600',
  },
  eventCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e9ecef',
    marginBottom: 10,
  },
  eventTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111',
  },
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stackAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#fff',
  },
  stackBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    // backgroundColor dynamic
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  stackBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    // color dynamic
  },
  eventDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  eventDateText: {
    fontSize: 14,
    color: '#6c757d',
    marginLeft: 6,
  },
  rsvpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rsvpButtonActive: {
    flex: 1,
    flexDirection: 'row',
    // backgroundColor dynamic
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    marginRight: 10,
  },
  rsvpButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  rsvpButtonInactive: {
    flex: 1,
    backgroundColor: '#f1f3f5',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    marginRight: 10,
  },
  rsvpButtonTextInactive: {
    color: '#6c757d',
    fontWeight: '600',
    fontSize: 14,
  },
  postCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e9ecef',
    marginBottom: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  pinnedBadgeContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#fff7ed', // very light orange/yellow
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomLeftRadius: 16,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingRight: 30, // to prevent overlap with the pinned badge
  },
  megaphoneContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    // backgroundColor dynamic
    justifyContent: 'center',
    alignItems: 'center',
  },
  postAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  postHeaderInfo: {
    marginLeft: 12,
    justifyContent: 'center',
  },
  postAuthor: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
  },
  postSubtitle: {
    fontSize: 13,
    color: '#6c757d',
    marginTop: 2,
  },
  postBody: {
    fontSize: 15,
    lineHeight: 22,
    color: '#343a40',
  },
  postDivider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 16,
  },
  engagementRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  engagementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  engagementText: {
    fontSize: 14,
    color: '#6c757d',
    marginLeft: 6,
    fontWeight: '500',
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 18, // slightly rounded squircle
    // backgroundColor dynamic
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  actionSheetContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  actionSheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#dee2e6',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  actionSheetTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111',
    marginBottom: 24,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
    marginBottom: 4,
  },
  actionItemSubtitle: {
    fontSize: 13,
    color: '#6c757d',
  },
  fullModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  fullModalContent: {
    backgroundColor: '#fff',
    height: '90%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  fullModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  fullModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6c757d',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    backgroundColor: '#fff',
    minHeight: 120,
    textAlignVertical: 'top',
  },
});

export default SocialScreen;
