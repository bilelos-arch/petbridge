import { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert,
         ActivityIndicator, Image, Modal, TextInput, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../src/store/authStore';
import { animalService } from '../../src/services/animalService';
import { router, useFocusEffect } from 'expo-router';
import { adoptionService } from '../../src/services/adoptionService';
import { showToast } from '../../src/components/Toast';
import EmptyState from '../../src/components/EmptyState';
import LoadingScreen from '../../src/components/LoadingScreen';

// Types
interface UserProfile {
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  city?: string;
  rescuedAnimalsCount?: number;
  phoneNumber?: string;
  [key: string]: any;
}

interface User {
  id: string;
  email: string;
  profile?: UserProfile;
}

interface Animal {
  id: string;
  name: string;
  type: 'DOG' | 'CAT';
  breed?: string;
  age: string;
  photoUrl?: string;
  status?: string;
  city?: string;
}

interface Adoption {
  id: string;
  animal: Animal;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EN_ATTENTE' | 'ACCEPTEE' | 'REFUSEE' | 'ANNULEE' | 'COMPLETEE';
  message?: string;
  adopter: any;
  thread?: { id: string };
  donneurId?: string;
  animalId?: string;
  matchScore?: number;
  createdAt: string;
}

interface AccordionProps {
  id: string;
  title: string;
  count: number;
  emoji: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  
  // STATE
  const [myAnimals, setMyAnimals] = useState<Animal[]>([]);
  const [myRequests, setMyRequests] = useState<Adoption[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<Adoption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);
  const [messageModal, setMessageModal] = useState<{ visible: boolean; adoptionId: string }>({ visible: false, adoptionId: '' });
  const [messageText, setMessageText] = useState('');

  // ACCORDION COMPONENT
  const Accordion = ({ id, title, count, emoji, isOpen, onToggle, children }: AccordionProps) => (
    <View style={styles.sectionContainer}>
      <TouchableOpacity
        style={styles.accordionHeader}
        onPress={onToggle}
        activeOpacity={0.8}
      >
        <Text style={{ fontSize: 20, marginRight: 10 }}>{emoji}</Text>
        <Text style={styles.accordionTitle}>{title}</Text>
        <View style={{ backgroundColor: '#FFF0EB', borderRadius: 12,
                       paddingHorizontal: 10, paddingVertical: 3, marginRight: 10 }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#FF6B35' }}>{count}</Text>
        </View>
        <Text style={{ fontSize: 18, color: '#b2bec3',
                       transform: [{ rotate: isOpen ? '90deg' : '0deg' }] }}>›</Text>
      </TouchableOpacity>
      {isOpen && (
        <View style={{ paddingHorizontal: 12, paddingBottom: 12 }}>
          {children}
        </View>
      )}
    </View>
  );

  // STATUS CONFIGS
  const STATUS_ADOPTION = {
    EN_ATTENTE: { label: '⏳ En attente', color: '#e17055', bg: '#FFF4F0' },
    ACCEPTEE:   { label: '✅ Acceptée',   color: '#00b894', bg: '#EAFAF4' },
    REFUSEE:    { label: '❌ Refusée',    color: '#d63031', bg: '#FFF0F0' },
    ANNULEE:    { label: '🚫 Annulée',    color: '#636e72', bg: '#F5F5F5' },
    COMPLETEE:  { label: '🏠 Complétée', color: '#0984e3', bg: '#EEF6FF' },
  };

  const STATUS_ANIMAL = {
    DISPONIBLE:          { label: '🟢 Disponible',    color: '#00b894', bg: '#EAFAF4' },
    ATTENTE_VALIDATION:  { label: '⏳ En validation', color: '#e17055', bg: '#FFF4F0' },
    EN_COURS_ADOPTION:   { label: '🐾 En cours',      color: '#4ECDC4', bg: '#E8F5F2' },
    ADOPTE:              { label: '🏠 Adopté',         color: '#636e72', bg: '#F5F5F5' },
    REJETE:              { label: '❌ Rejeté',         color: '#d63031', bg: '#FFF0F0' },
  };

  // DATA LOADING
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    if (!user?.id) return;
        setIsLoading(true);
    try {
      const [animals, sent, received] = await Promise.all([
        animalService.getMyAnimals(),
        adoptionService.getMyRequests(),
        adoptionService.getReceivedRequests(),
      ]);

      // Convert service types to our local types if needed      setMyAnimals(animals as unknown as Animal[]);
      setMyRequests(sent as unknown as Adoption[]);
      setReceivedRequests(received as unknown as Adoption[]);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Erreur', 'Impossible de charger les données');
    } finally {
      setIsLoading(false);
    }
  };

  // HANDLERS
  const toggleAccordion = (id: string) => {
    setOpenAccordion(openAccordion === id ? null : id);
  };

  const handleSendMessage = async (adoptionId: string) => {
    if (!messageText.trim()) return;
    
    try {
      await adoptionService.sendPreAcceptanceMessage(adoptionId, messageText);
      showToast.success('Message envoyé');
      setMessageModal({ visible: false, adoptionId: '' });
      setMessageText('');
      loadData(); // Refresh to show conversation
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Erreur', 'Impossible d\'envoyer le message');
    }
  };

  const handleAccept = async (adoptionId: string) => {
    try {
      await adoptionService.acceptRequest(adoptionId);
      showToast.success('Adoption acceptée');
      loadData();
    } catch (error) {
      console.error('Error accepting adoption:', error);
      Alert.alert('Erreur', 'Impossible d\'accepter l\'adoption');
    }
  };

  const handleReject = async (adoptionId: string) => {
    try {
      await adoptionService.rejectRequest(adoptionId);
      showToast.success('Adoption refusée');
      loadData();
    } catch (error) {
      console.error('Error rejecting adoption:', error);
      Alert.alert('Erreur', 'Impossible de refuser l\'adoption');
    }
  };

  const handleCancelRequest = async (adoptionId: string) => {
    try {
      await adoptionService.cancelRequest(adoptionId);
      showToast.success('Demande annulée');
      loadData();
    } catch (error) {
      console.error('Error cancelling request:', error);
      Alert.alert('Erreur', 'Impossible d\'annuler la demande');
    }
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  const fullName = `${user?.profile?.firstName || ''} ${user?.profile?.lastName || ''}`.trim() || 'Mon Profil';
  const avatarUrl = user?.profile?.avatarUrl;
  const city = user?.profile?.city;

  // BADGE LOGIC (from Prompt 2)
  const completionBadge = true; // This would come from user data in real implementation
  const warningBadge = true;    // This would come from user data in real implementation
  const saviorBadge = true;     // This would come from user data in real implementation
  const rescuedAnimalsCount = user?.profile?.saviorCount || 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.push('/profile/edit')} style={styles.avatarContainer}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>{fullName.charAt(0).toUpperCase()}</Text>
              </View>
            )}
            <View style={styles.editIndicator}>
              <Text style={styles.editText}>✏️</Text>
            </View>
          </TouchableOpacity>
          <Text style={styles.name}>{fullName}</Text>
          {city && (
            <Text style={styles.city}>📍 {city}</Text>
          )}
          
          {/* BADGES */}
          <View style={styles.badgesContainer}>
            {/* Savior Badge - always shown if true */}
            {saviorBadge && (
              <View style={[styles.badge, styles.saviorBadge]}>
                <Text style={styles.badgeIcon}>🦸</Text>
                <Text style={[styles.badgeText, styles.saviorText]}>
                  Sauveur d'animaux - {rescuedAnimalsCount} animal{rescuedAnimalsCount === 1 ? '' : 's'} secouru{rescuedAnimalsCount === 1 ? '' : 's'}
                </Text>
              </View>
            )}
            
            {/* Completion Badge - shown only if completionBadge=true and warningBadge=false */}
            {completionBadge && !warningBadge && (
              <View style={[styles.badge, styles.completionBadge]}>
                <Text style={styles.badgeIcon}>🏆</Text>
                <Text style={styles.badgeText}>Adoptant exemplaire</Text>
              </View>
            )}
            
            {/* Warning Badge - shown if warningBadge=true (takes priority over completion when both are true) */}
            {warningBadge && (
              <View style={[styles.badge, styles.warningBadge]}>
                <Text style={styles.badgeIcon}>⚠️</Text>
                <Text style={[styles.badgeText, styles.warningText]}>Avertissement</Text>
              </View>
            )}
          </View>
        </View>

        {/* MON ESPACE */}
        <View style={styles.mySpaceContainer}>
          <Text style={styles.sectionTitle}>Mon espace</Text>
          <TouchableOpacity 
            style={styles.mySpaceButton}
            onPress={() => router.push('/(tabs)/notifications')}
          >
            <Text style={styles.mySpaceButtonText}>💬 Mes messages</Text>
          </TouchableOpacity>
          <View style={styles.separator} />
          <TouchableOpacity             style={styles.mySpaceButton}
            onPress={() => router.push('/sightings/all')}
          >
            <Text style={styles.mySpaceButtonText}>🚨 Mes signalements</Text>
          </TouchableOpacity>
        </View>

        {/* MES ANNONCES */}
        <Accordion
          id="myAnimals"
          title="Mes annonces"
          count={myAnimals.length}
          emoji="📢"
          isOpen={openAccordion === 'myAnimals'}
          onToggle={() => toggleAccordion('myAnimals')}
        >
          {myAnimals.length === 0 ? (
            <EmptyState
              emoji="📢"
              title="Aucune annonce"
              subtitle="Publiez votre première annonce pour trouver un foyer à un animal"
              buttonLabel="+ Publier"
              onPress={() => router.push('/(tabs)/publish')}
            />
          ) : (
            myAnimals.map((animal) => (
              <TouchableOpacity
                key={animal.id}
                style={styles.animalItem}
                onPress={() => router.push(`/animal/${animal.id}`)}
              >
                <Image                     source={{ uri: animal.photoUrl || 'https://placehold.co/68x68' }}
                  style={styles.animalImage}
                />
                <View style={styles.animalInfo}>
                  <Text style={styles.animalName}>{animal.name}</Text>
                  <View style={styles.statusRow}>
                    <Text style={[styles.statusText, {
                      backgroundColor: STATUS_ANIMAL[animal.status?.toUpperCase() as keyof typeof STATUS_ANIMAL]?.bg,
                      color: STATUS_ANIMAL[animal.status?.toUpperCase() as keyof typeof STATUS_ANIMAL]?.color
                    }]}>
                      {STATUS_ANIMAL[animal.status?.toUpperCase() as keyof typeof STATUS_ANIMAL]?.label}
                    </Text>
                  </View>
                  <Text style={styles.animalDetails}>
                    {animal.breed || 'Sans race'} - {animal.city || 'Ville non spécifiée'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </Accordion>

        {/* DEMANDES ENVOYÉES */}
        <Accordion
          id="sentAdoptions"
          title="Demandes envoyées"
          count={myRequests.length}
          emoji="📤"
          isOpen={openAccordion === 'sentAdoptions'}
          onToggle={() => toggleAccordion('sentAdoptions')}
        >
          {myRequests.length === 0 ? (
            <EmptyState
              emoji="📤"
              title="Aucune demande"
              subtitle="Vous n'avez pas encore envoyé de demande d'adoption"
            />
          ) : (
            myRequests.map((adoption) => (
              <View key={adoption.id} style={styles.adoptionItem}>
                <TouchableOpacity
                  style={styles.animalItem}
                  onPress={() => router.push(`/animal/${adoption.animal?.id}`)}
                >
                  <Image
                    source={{ uri: adoption.animal?.photoUrl || 'https://placehold.co/68x68' }}
                    style={styles.animalImage}
                  />
                  <View style={styles.animalInfo}>
                    <Text style={styles.animalName}>{adoption.animal?.name}</Text>
                    <Text style={styles.animalDetails}>
                      {adoption.animal?.breed || 'Sans race'} - {adoption.animal?.age}
                    </Text>
                  </View>
                </TouchableOpacity>
                <View style={styles.statusContainer}>
                  <Text style={[styles.statusText, {
                    backgroundColor: STATUS_ADOPTION[adoption.status as keyof typeof STATUS_ADOPTION]?.bg,
                    color: STATUS_ADOPTION[adoption.status as keyof typeof STATUS_ADOPTION]?.color
                  }]}>
                    {STATUS_ADOPTION[adoption.status as keyof typeof STATUS_ADOPTION]?.label}
                  </Text>
                </View>
                {adoption.status === 'EN_ATTENTE' && (
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => handleCancelRequest(adoption.id)}
                  >
                    <Text style={styles.cancelButtonText}>Annuler</Text>
                  </TouchableOpacity>
                )}
                {adoption.status === 'ACCEPTEE' && adoption.thread?.id && (
                  <TouchableOpacity
                    style={styles.conversationButton}
                    onPress={() => router.push(`/thread/${adoption.thread?.id}`)}
                  >
                    <Text style={styles.conversationButtonText}>💬 Conversation</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))
          )}
        </Accordion>

        {/* DEMANDES REÇUES */}
        <Accordion
          id="receivedAdoptions"
          title="Demandes reçues"
          count={receivedRequests.length}
          emoji="📥"
          isOpen={openAccordion === 'receivedAdoptions'}
          onToggle={() => toggleAccordion('receivedAdoptions')}
        >
          {receivedRequests.length === 0 ? (
            <EmptyState
              emoji="📥"
              title="Aucune demande"
              subtitle="Vous n'avez pas encore reçu de demande d'adoption pour vos animaux"
            />
          ) : (
            receivedRequests.map((adoption) => (
              <View key={adoption.id} style={styles.adoptionItem}>
                <View style={styles.adopterInfo}>
                  <TouchableOpacity
                    style={styles.adopterProfile}
                    onPress={() => router.push(`/user/${adoption.adopter?.id}?animalId=${adoption.animal?.id}`)}
                  >
                    {adoption.adopter?.profile?.avatarUrl ? (
                      <Image
                        source={{ uri: adoption.adopter.profile.avatarUrl }}
                        style={styles.adopterAvatar}
                      />
                    ) : (
                      <View style={styles.adopterAvatarPlaceholder}>
                        <Text style={styles.adopterAvatarText}>
                          {adoption.adopter?.profile?.firstName?.charAt(0) || '?'}
                        </Text>
                      </View>
                    )}
                    <Text style={styles.adopterName}>
                      {adoption.adopter?.profile?.firstName || 'Utilisateur'}
                    </Text>
                  </TouchableOpacity>
                  <View style={styles.adopterDetails}>
                    <Text style={styles.adopterDetailLabel}>Ville:</Text>
                    <Text style={styles.adopterDetailValue}>{adoption.adopter?.profile?.city || 'Non spécifiée'}</Text>
                    <Text style={styles.adopterDetailLabel}>Email:</Text>
                    <Text style={styles.adopterDetailValue}>{adoption.adopter?.email}</Text>
                    <Text style={styles.adopterDetailLabel}>Téléphone:</Text>
                    <Text style={styles.adopterDetailValue}>{adoption.adopter?.profile?.phoneNumber || 'Non spécifié'}</Text>
                    <TouchableOpacity
                      style={styles.profileLink}
                      onPress={() => router.push(`/user/${adoption.adopter?.id}?animalId=${adoption.animal?.id}`)}
                    >
                      <Text style={styles.profileLinkText}>Profil complet ›</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.animalItem}
                  onPress={() => router.push(`/animal/${adoption.animal?.id}`)}
                >
                  <Image
                    source={{ uri: adoption.animal?.photoUrl || 'https://placehold.co/68x68' }}
                    style={styles.animalImage}
                  />
                  <View style={styles.animalInfo}>
                    <Text style={styles.animalName}>{adoption.animal?.name}</Text>
                    <Text style={styles.animalDetails}>
                      {adoption.animal?.breed || 'Sans race'} - {adoption.animal?.age}
                    </Text>
                  </View>
                </TouchableOpacity>
                
                {adoption.message && (
                  <View style={styles.messageContainer}>
                    <Text style={styles.messageText}>{adoption.message}</Text>
                  </View>
                )}
                <View style={styles.actionsContainer}>
                  {adoption.status === 'EN_ATTENTE' && (
                    <>
                      <TouchableOpacity
                        style={styles.acceptButton}
                        onPress={() => handleAccept(adoption.id)}
                      >
                        <Text style={styles.acceptButtonText}>✅ Accepter</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.messageButton}
                        onPress={() => {
                          setMessageModal({ visible: true, adoptionId: adoption.id });
                        }}
                      >
                        <Text style={styles.messageButtonText}>💬 Message</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.rejectButton}
                        onPress={() => handleReject(adoption.id)}
                      >
                        <Text style={styles.rejectButtonText}>❌ Refuser</Text>
                      </TouchableOpacity>
                    </>
                  )}
                  {adoption.status === 'ACCEPTEE' && adoption.thread?.id && (
                    <TouchableOpacity
                      style={styles.openConversationButton}
                      onPress={() => router.push(`/thread/${adoption.thread?.id}`)}
                    >
                      <Text style={styles.openConversationButtonText}>💬 Ouvrir la conversation</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))
          )}
        </Accordion>

        {/* BAS DE PAGE */}
        <View style={styles.bottomButtonsContainer}>
          <TouchableOpacity
            style={[styles.bottomButton, styles.editProfileButton]}
            onPress={() => router.push('/profile/edit')}
          >
            <Text style={styles.bottomButtonText}>✏️ Éditer le profil</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.bottomButton, styles.logoutButton]}
            onPress={logout}
          >
            <Text style={styles.bottomButtonText}>🚪 Se déconnecter</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* MODAL MESSAGE */}
      <Modal
        visible={messageModal.visible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setMessageModal({ visible: false, adoptionId: '' })}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Envoyer un message pré-acceptation</Text>
            <TextInput              style={styles.modalInput}
              placeholder="Écrivez votre message..."
              multiline
              numberOfLines={4}
              value={messageText}
              onChangeText={setMessageText}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setMessageModal({ visible: false, adoptionId: '' })}
              >
                <Text style={styles.modalCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSendButton}
                onPress={() => handleSendMessage(messageModal.adoptionId)}
                disabled={!messageText.trim()}
              >
                {messageText.trim() ? (
                  <Text style={styles.modalSendText}>Envoyer</Text>
                ) : (
                  <Text style={styles.modalSendText}>Envoyer</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#636e72',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  avatarPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#FF6B35',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 36,
    color: '#FFF',
    fontWeight: '700',
  },
  editIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#2D3436',
    borderRadius: 14,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  editText: {
    color: '#FFF',
    fontSize: 13,
  },
  name: {
    fontSize: 22,
    fontWeight: '900',
    color: '#2D3436',
    marginBottom: 4,
  },
  city: {
    fontSize: 14,
    color: '#b2bec3',
    marginBottom: 8,
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  completionBadge: {
    backgroundColor: '#FFE66D',
  },
  warningBadge: {
    backgroundColor: '#FF4444',
  },
  saviorBadge: {
    backgroundColor: '#6C5CE7',
  },
  badgeIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2D3436',
  },
  warningText: {
    color: '#FFFFFF',
  },
  saviorText: {
    color: '#FFFFFF',
  },
  mySpaceContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#2D3436',
    marginBottom: 12,
  },
  mySpaceButton: {
    backgroundColor: '#FF6B35',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  mySpaceButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  separator: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 12,
  },
  sectionContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  accordionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  accordionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2D3436',
  },
  accordionIcon: {
    fontSize: 16,
    color: '#636e72',
  },
  accordionContent: {
    backgroundColor: '#FFFFFF',
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 14,
    color: '#b2bec3',
    textAlign: 'center',
  },
  publishButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#FF6B35',
    borderRadius: 8,
  },
  publishButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  animalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  animalImage: {
    width: 68,
    height: 68,
    borderRadius: 12,
    marginRight: 12,
  },
  animalInfo: {
    flex: 1,
  },
  animalName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2D3436',
    marginBottom: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  animalDetails: {
    fontSize: 14,
    color: '#636e72',
  },
  adoptionItem: {
    marginBottom: 20,
  },
  adopterInfo: {
    marginBottom: 12,
  },
  adopterProfile: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  adopterAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 8,
  },
  adopterAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF6B35',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  adopterAvatarText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  adopterName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2D3436',
  },
  adopterDetails: {
    marginTop: 8,
  },
  adopterDetailLabel: {
    fontSize: 12,
    color: '#636e72',
    marginBottom: 2,
  },
  adopterDetailValue: {
    fontSize: 12,
    color: '#2D3436',
    fontWeight: '500',
  },
  profileLink: {
    marginTop: 8,
  },
  profileLinkText: {
    fontSize: 12,
    color: '#4ECDC4',
    fontWeight: '600',
  },
  statusContainer: {
    alignItems: 'flex-end',
    marginTop: 4,
  },
  messageContainer: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 12,
    marginVertical: 8,
  },
  messageText: {
    fontSize: 14,
    color: '#2D3436',
    fontStyle: 'italic',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  acceptButton: {
    flex: 1,
    backgroundColor: '#00B894',
    padding: 10,
    borderRadius: 8,
    marginRight: 4,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  rejectButton: {
    flex: 1,
    backgroundColor: '#FF3B30',
    padding: 10,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  rejectButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  messageButton: {
    flex: 1,
    backgroundColor: '#5B8DEF',
    padding: 10,
    borderRadius: 8,
    marginLeft: 4,
    alignItems: 'center',
  },
  messageButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  cancelButton: {
    backgroundColor: '#F8F9FA',
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
  },
  cancelButtonText: {
    color: '#636e72',
    fontSize: 12,
    fontWeight: '600',
  },
  conversationButton: {
    backgroundColor: '#5B8DEF',
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
  },
  conversationButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  openConversationButton: {
    backgroundColor: '#4ECDC4',
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
  },
  openConversationButtonText: {
    color: '#FFFFFF'
  },
  bottomButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  bottomButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  editProfileButton: {
    backgroundColor: '#F7F8FA',
    borderWidth: 1,
    borderColor: '#E8ECEF',
  },
  logoutButton: {
    backgroundColor: '#FFF0F0',
    borderWidth: 1,
    borderColor: '#FFD0CC',
  },
  bottomButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D3436',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#2D3436',
    marginBottom: 16,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#2D3436',
    marginBottom: 16,
    minHeight: 100,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalCancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
  },
  modalCancelText: {
    fontSize: 15,
    color: '#636e72',
    fontWeight: '600',
  },
  modalSendButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalSendText: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
