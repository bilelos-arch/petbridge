import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface CheckIn {
  id: string;
  checkInNumber: number;
  status: string;
  isLate: boolean;
  dueDate?: string;
  scheduledFor?: string;
  message?: string;
}

interface AdoptionTimelineProps {
  checkIns: CheckIn[];
  progress: number;
  total: number;
}

const CHECKIN_LABELS: Record<number, string> = {
  1: 'J+1',
  2: 'J+3',
  3: 'J+14',
  4: 'J+30',
};

export default function AdoptionTimeline({ checkIns, progress, total }: AdoptionTimelineProps) {
  const getDotConfig = (checkIn: CheckIn) => {
    if (checkIn.status === 'COMPLETE') return { emoji: '✅', color: '#00b894' };
    if (checkIn.isLate) return { emoji: '⚠️', color: '#FF4444' };
    if (checkIn.status === 'EN_ATTENTE') return { emoji: '⏳', color: '#FF6B35' };
    return { emoji: '○', color: '#b2bec3' };
  };

  const progressPercent = total > 0 ? (progress / total) * 100 : 0;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🐾 Parcours d'adoption</Text>
      <View style={styles.dotsRow}>
        {[...checkIns]
          .sort((a, b) => a.checkInNumber - b.checkInNumber)
          .map((checkIn) => {
            const config = getDotConfig(checkIn);
            return (
              <View key={checkIn.id} style={styles.dotItem}>
                <Text style={styles.dotEmoji}>{config.emoji}</Text>
                <Text style={[styles.dotLabel, { color: config.color }]}>
                  {CHECKIN_LABELS[checkIn.checkInNumber] || `#${checkIn.checkInNumber}`}
                </Text>
              </View>
            );
          })}
      </View>
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBarFill, { width: `${progressPercent}%` as any }]} />
      </View>
      <Text style={styles.progressText}>{progress}/{total} check-ins complétés</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#E8F5F2',
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: '#2D3436',
    marginBottom: 16,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  dotItem: {
    alignItems: 'center',
  },
  dotEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  dotLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#4ECDC4',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#b2bec3',
    textAlign: 'center',
  },
});