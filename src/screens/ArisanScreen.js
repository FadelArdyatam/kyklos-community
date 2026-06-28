import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import AppHeader from '../components/AppHeader';
import { useTheme } from '../context/ThemeContext';
import { useCommunity } from '../context/CommunityContext';
import communityService from '../services/communityService';
import arisanService from '../services/arisanService';
import { useCurrency } from '../hooks/useCurrency';

const ArisanScreen = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { activeCommunity } = useCommunity();
  const { formatRupiah } = useCurrency();

  const [loading, setLoading] = useState(true);
  const [arisanPocket, setArisanPocket] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [periods, setPeriods] = useState([]);

  useEffect(() => {
    const fetchArisanData = async () => {
      if (!activeCommunity?.id) return;
      try {
        setLoading(true);
        const pockets = await communityService.getPockets(activeCommunity.id);
        const arisan = pockets.find(p => p.type === 'ARISAN');
        
        if (arisan) {
          setArisanPocket(arisan);
          const [parts, per] = await Promise.all([
            arisanService.getParticipants(arisan.id),
            arisanService.getPeriods(arisan.id)
          ]);
          setParticipants(parts || []);
          setPeriods(per || []);
        }
      } catch (error) {
        console.error("Error fetching arisan data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchArisanData();
  }, [activeCommunity?.id]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </SafeAreaView>
    );
  }

  if (!arisanPocket) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <AppHeader />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Feather name="info" size={48} color="#adb5bd" style={{ marginBottom: 16 }} />
          <Text style={{ fontSize: 16, color: '#495057', textAlign: 'center' }}>
            Tidak ada kantong Arisan di komunitas ini.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Find current active period (the earliest one that is not 'completed')
  const activePeriod = periods.find(p => p.status !== 'completed') || periods[0];
  const totalPeriods = periods.length || 1;
  const currentRound = activePeriod ? periods.indexOf(activePeriod) + 1 : 1;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <AppHeader />

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Current Round Info */}
        <Text style={styles.subheading}>CURRENT ROUND</Text>
        <View style={styles.roundTitleRow}>
          <Text style={[styles.roundTitle, { color: theme.colors.primary }]}>Round {currentRound} of {totalPeriods}</Text>
          {activePeriod?.status === 'completed' && (
            <View style={[styles.drawnBadge, { backgroundColor: theme.colors.primary }]}>
              <Ionicons name="checkmark-circle-outline" size={14} color="#fff" style={{ marginRight: 4 }} />
              <Text style={styles.drawnBadgeText}>DRAWN</Text>
            </View>
          )}
        </View>
        <View style={styles.periodRow}>
          <Feather name="calendar" size={14} color="#6c757d" style={{ marginRight: 6 }} />
          <Text style={styles.periodText}>Period: {activePeriod ? new Date(activePeriod.startDate).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }) : 'N/A'}</Text>
        </View>

        {/* Round Recipient Card */}
        {activePeriod?.recipientId ? (
          <View style={styles.recipientCard}>
            <Text style={styles.subheading}>ROUND RECIPIENT</Text>
            <View style={styles.recipientProfileRow}>
              <View style={[styles.recipientAvatarContainer, { borderColor: theme.colors.primary }]}>
                <Image
                  source={{ uri: activePeriod.recipient?.avatarUrl || 'https://i.pravatar.cc/150?img=5' }}
                  style={styles.recipientAvatar}
                />
              </View>
              <View style={styles.recipientInfo}>
                <Text style={styles.recipientName}>{activePeriod.recipient?.name || 'Anggota'}</Text>
                <Text style={[styles.recipientAmount, { color: theme.colors.primary }]}>{formatRupiah(activePeriod.amount || 0)}</Text>
              </View>
              <TouchableOpacity style={styles.chevronButton}>
                <Feather name="chevron-right" size={20} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.payoutStatusRow}>
              <Text style={styles.payoutLabel}>Payout Status</Text>
              <View style={styles.completedBadge}>
                <Text style={styles.completedBadgeText}>COMPLETED</Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={[styles.recipientCard, { alignItems: 'center', paddingVertical: 30 }]}>
            <Text style={{ color: '#adb5bd', fontSize: 14 }}>Belum ada penarikan untuk putaran ini.</Text>
          </View>
        )}

        {/* Participants Section */}
        <View style={styles.participantsHeader}>
          <Text style={styles.sectionTitle}>Participants</Text>
          <Text style={styles.membersCount}>{participants.length} Members</Text>
        </View>

        {participants.length === 0 ? (
          <Text style={{ textAlign: 'center', padding: 20, color: '#6c757d' }}>Belum ada peserta.</Text>
        ) : (
          participants.map((participant, index) => (
            <View key={participant.id || index} style={styles.participantCard}>
              <Image source={{ uri: participant.member?.avatarUrl || `https://i.pravatar.cc/150?img=${60 + index}` }} style={styles.participantAvatar} />
              <View style={styles.participantInfo}>
                <Text style={styles.participantName}>{participant.member?.name || 'Anggota'}</Text>
                <Text style={styles.memberSince}>Bergabung: {new Date(participant.joinedAt || Date.now()).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}</Text>
              </View>
              <View style={styles.participantRight}>
                <Text style={styles.participantAmount}>{formatRupiah(participant.contributionAmount || 0)}</Text>
                <View style={[styles.statusBadge, styles.lunasBadge]}>
                  <Text style={styles.lunasText}>AKTIF</Text>
                </View>
              </View>
            </View>
          ))
        )}

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
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
    padding: 20,
  },
  subheading: {
    fontSize: 12,
    color: '#6c757d',
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  roundTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  roundTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    // color dynamic
  },
  drawnBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    // backgroundColor dynamic
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  drawnBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  periodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  periodText: {
    color: '#6c757d',
    fontSize: 14,
  },
  recipientCard: {
    backgroundColor: '#f4f6fa',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 24,
  },
  recipientProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  recipientAvatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    // borderColor dynamic
    justifyContent: 'center',
    alignItems: 'center',
  },
  recipientAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  recipientInfo: {
    flex: 1,
    marginLeft: 15,
  },
  recipientName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111',
  },
  recipientAmount: {
    fontSize: 15,
    fontWeight: '700',
    // color dynamic
    marginTop: 4,
    fontFamily: 'monospace',
  },
  chevronButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 16,
  },
  payoutStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  payoutLabel: {
    color: '#6c757d',
    fontSize: 14,
  },
  completedBadge: {
    backgroundColor: '#c6f6d5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  completedBadgeText: {
    color: '#22c55e',
    fontSize: 12,
    fontWeight: '700',
  },
  participantsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#111',
  },
  membersCount: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 2,
  },
  participantCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  participantAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
  },
  participantInfo: {
    flex: 1,
    marginLeft: 12,
  },
  participantName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
  },
  memberSince: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 2,
  },
  participantRight: {
    alignItems: 'flex-end',
  },
  participantAmount: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'monospace',
    color: '#111',
    marginBottom: 6,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  lunasBadge: {
    backgroundColor: '#e6f8f0',
  },
  lunasText: {
    color: '#00b873',
    fontSize: 11,
    fontWeight: '700',
  },
  belumBadge: {
    backgroundColor: '#f1f3f5',
  },
  belumText: {
    color: '#6c757d',
    fontSize: 11,
    fontWeight: '700',
  },
  terlambatBadge: {
    backgroundColor: '#fceaea',
  },
  terlambatText: {
    color: '#dc3545',
    fontSize: 11,
    fontWeight: '700',
  },
});

export default ArisanScreen;
