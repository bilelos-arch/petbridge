import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StatusBar, ActivityIndicator,
  KeyboardAvoidingView, Platform, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { threadService } from '../../src/services/threadService';
import { useAuthStore } from '../../src/store/authStore';
import LoadingScreen from '../../src/components/LoadingScreen';

export default function ThreadScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const [thread, setThread] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const loadThread = useCallback(async () => {
    try {
      const data = await threadService.getThreadById(id);
      setThread(data);
      await threadService.markAsRead(id);
    } catch (e) {
      console.error('Erreur thread:', e);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadThread();
    // Polling toutes les 5 secondes
    const interval = setInterval(loadThread, 5000);
    return () => clearInterval(interval);
  }, [loadThread]);

  const handleSend = async () => {
    if (!message.trim() || isSending) return;
    const content = message.trim();
    setMessage('');
    setIsSending(true);
    try {
      const newMsg = await threadService.sendMessage(id, content);
      setThread((prev: any) => ({
        ...prev,
        messages: [...(prev?.messages || []), newMsg],
      }));
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (e) {
      console.error('Erreur envoi:', e);
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
  };

  if (isLoading) return <LoadingScreen />;

  const messages = thread?.messages || [];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F7F8FA' }} edges={['top']}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View style={{
          flexDirection: 'row', alignItems: 'center',
          paddingHorizontal: 16, paddingVertical: 12,
          backgroundColor: '#FFFFFF', elevation: 2,
          borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
        }}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
            <Text style={{ fontSize: 22 }}>←</Text>
          </TouchableOpacity>
          {thread?.adoption?.animal?.photoUrl ? (
            <Image
              source={{ uri: thread.adoption.animal.photoUrl }}
              style={{ width: 40, height: 40, borderRadius: 20, marginRight: 10 }}
              resizeMode="cover"
            />
          ) : (
            <View style={{
              width: 40, height: 40, borderRadius: 20,
              backgroundColor: '#FFF0EB', alignItems: 'center',
              justifyContent: 'center', marginRight: 10,
            }}>
              <Text style={{ fontSize: 18 }}>🐾</Text>
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: '800', color: '#2D3436' }} numberOfLines={1}>
              {thread?.adoption?.animal?.name || 'Animal'}
            </Text>
            <Text style={{ fontSize: 12, color: '#b2bec3' }}>
              Adoption en cours
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push(`/checkins?adoptionId=${thread.adoption.id}`)}
            style={{
              backgroundColor: '#FFF0EB', borderRadius: 20,
              paddingHorizontal: 12, paddingVertical: 6,
            }}
          >
            <Text style={{ fontSize: 12, color: '#FF6B35', fontWeight: '700' }}>🐾 Check-ins</Text>
          </TouchableOpacity>
        </View>

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: 40 }}>
              <Text style={{ fontSize: 32, marginBottom: 8 }}>👋</Text>
              <Text style={{ fontSize: 14, color: '#b2bec3', textAlign: 'center' }}>
                Démarrez la conversation !
              </Text>
            </View>
          }
          renderItem={({ item, index }) => {
            const isMe = item.sender.id === user?.id;
            const prevMsg = messages[index - 1];
            const showDate = !prevMsg || formatDate(item.createdAt) !== formatDate(prevMsg.createdAt);
            return (
              <View>
                {showDate && (
                  <View style={{ alignItems: 'center', marginVertical: 12 }}>
                    <Text style={{
                      fontSize: 12, color: '#b2bec3',
                      backgroundColor: '#F0F0F0',
                      paddingHorizontal: 12, paddingVertical: 4,
                      borderRadius: 10,
                    }}>
                      {formatDate(item.createdAt)}
                    </Text>
                  </View>
                )}
                <View style={{
                  flexDirection: 'row',
                  justifyContent: isMe ? 'flex-end' : 'flex-start',
                  marginBottom: 8,
                }}>
                  {!isMe && (
                    <View style={{
                      width: 30, height: 30, borderRadius: 15,
                      backgroundColor: '#FF6B35',
                      alignItems: 'center', justifyContent: 'center',
                      marginRight: 8, alignSelf: 'flex-end',
                    }}>
                      <Text style={{ color: '#FFF', fontSize: 12, fontWeight: '700' }}>
                        {item.sender.name?.charAt(0)?.toUpperCase() || '?'}
                      </Text>
                    </View>
                  )}
                  <View style={{ maxWidth: '75%' }}>
                    <View style={{
                      backgroundColor: isMe ? '#FF6B35' : '#FFFFFF',
                      borderRadius: 18,
                      borderBottomRightRadius: isMe ? 4 : 18,
                      borderBottomLeftRadius: isMe ? 18 : 4,
                      paddingHorizontal: 14, paddingVertical: 10,
                      elevation: 1,
                    }}>
                      <Text style={{
                        fontSize: 15, color: isMe ? '#FFFFFF' : '#2D3436',
                        lineHeight: 22,
                      }}>
                        {item.content}
                      </Text>
                    </View>
                    <Text style={{
                      fontSize: 11, color: '#b2bec3',
                      marginTop: 4, alignSelf: isMe ? 'flex-end' : 'flex-start',
                    }}>
                      {formatTime(item.createdAt)}
                      {isMe && (item.isRead ? ' ✓✓' : ' ✓')}
                    </Text>
                  </View>
                </View>
              </View>
            );
          }}
        />

        {/* Input */}
        <View style={{
          flexDirection: 'row', alignItems: 'flex-end',
          paddingHorizontal: 16, paddingVertical: 12,
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1, borderTopColor: '#F0F0F0',
        }}>
          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder="Écrire un message..."
            placeholderTextColor="#b2bec3"
            multiline
            maxLength={1000}
            style={{
              flex: 1, backgroundColor: '#F7F8FA',
              borderRadius: 22, paddingHorizontal: 16,
              paddingVertical: 10, fontSize: 15,
              color: '#2D3436', maxHeight: 100,
              borderWidth: 1.5, borderColor: '#E8ECEF',
              marginRight: 10,
            }}
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={!message.trim() || isSending}
            style={{
              width: 44, height: 44, borderRadius: 22,
              backgroundColor: message.trim() ? '#FF6B35' : '#E8ECEF',
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            {isSending
              ? <ActivityIndicator size="small" color="#FFFFFF" />
              : <Text style={{ fontSize: 18 }}>➤</Text>
            }
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}