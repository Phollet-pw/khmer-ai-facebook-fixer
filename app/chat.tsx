import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { ThemedText } from '../components/themed-text';

// ─────────────────────────────────────────────
// THEME
// ─────────────────────────────────────────────
const T = {
  bgDeep:      '#0a0a0f',
  bgCard:      '#12121a',
  bgCardHover: '#1a1a28',
  bgInput:     '#0f0f18',
  accent:      '#6366f1',
  accentLight: '#818cf8',
  accentWarm:  '#f59e0b',
  textPrimary: '#e8e8f0',
  textSec:     '#8888a0',
  textDim:     '#55556a',
  border:      'rgba(255,255,255,0.07)',
  borderStrong:'rgba(255,255,255,0.12)',
  userBubble:  '#6366f1',
  aiBubble:    '#16161f',
  green:       '#22c55e',
  red:         '#ef4444',
};

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────
type ModeKey = 'chat' | 'content' | 'idea' | 'prompt';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  time: string;
  images?: string[];
}

// ─────────────────────────────────────────────
// MODE CONFIG
// ─────────────────────────────────────────────
const MODES: Record<ModeKey, { emoji: string; label: string; labelKm: string; desc: string; system: string }> = {
  chat: {
    emoji: '💬', label: 'Chat', labelKm: 'Chat & ឆ្លើយសារ',
    desc: 'ជួយ chat និងឆ្លើយសារ',
    system: 'អ្នកជា Khmer AI Assistant ដ៏ឆ្លាតវៃ។ ឆ្លើយតបជាភាសាខ្មែរ ដោយរួសរាយ ច្បាស់លាស់ និងជួយដោះស្រាយ។ ប្រើ emoji សមរម្យ។',
  },
  content: {
    emoji: '✍️', label: 'Content', labelKm: 'Content & Caption',
    desc: 'សរសេរ content និង caption',
    system: 'អ្នកជា Khmer Content Writer ជំនាញ។ ជួយសរសេរ content ប្រកបដោយភាពច្នៃប្រឌិត caption ទាក់ទាញ post ល្អ និង copy ដ៏មានឥទ្ធិពលសម្រាប់ social media ជាភាសាខ្មែរ។',
  },
  idea: {
    emoji: '🧠', label: 'Idea', labelKm: 'Idea & យុទ្ធសាស្ត្រ',
    desc: 'ជួយគិត idea និងផែនការ',
    system: 'អ្នកជា Strategic Advisor ជំនាញ។ ជួយគិត idea ថ្មី រៀបចំយុទ្ធសាស្ត្រ ដោះស្រាយបញ្ហា និង brainstorm ដំណោះស្រាយ។ ឆ្លើយជាភាសាខ្មែរ ដោយ structured ច្បាស់ actionable។',
  },
  prompt: {
    emoji: '⚙️', label: 'Prompt', labelKm: 'Prompt & Workflow',
    desc: 'រៀបចំ prompt និង workflow',
    system: 'អ្នកជា Prompt Engineer និង Workflow Specialist ជំនាញ។ ជួយរៀបចំ prompt ប្រសិទ្ធភាព workflow ច្បាស់ SOP template និង automation strategy។ ឆ្លើយជាភាសាខ្មែរ structured ហើយ prompt copy-paste ready។',
  },
};

const STARTERS: Record<ModeKey, string> = {
  chat:    'ជំរាបសួរ! ខ្ញុំត្រូវការជំនួយ 💬',
  content: 'ខ្ញុំត្រូវការជំនួយ content ✍️',
  idea:    'ជួយខ្ញុំគិត idea ថ្មី 🧠',
  prompt:  'ជួយខ្ញុំរៀបចំ prompt ⚙️',
};

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
const getTime = () =>
  new Date().toLocaleTimeString('km-KH', { hour: '2-digit', minute: '2-digit' });

const genId = () => Math.random().toString(36).slice(2, 9);

const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;

  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return btoa(binary);
};

// ─────────────────────────────────────────────
// TYPING DOTS
// ─────────────────────────────────────────────
function TypingDots() {
  const anims = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ];

  useEffect(() => {
    const loop = Animated.loop(
      Animated.stagger(
        200,
        anims.map(a =>
          Animated.sequence([
            Animated.timing(a, { toValue: -6, duration: 300, useNativeDriver: true }),
            Animated.timing(a, { toValue: 0, duration: 300, useNativeDriver: true }),
          ])
        )
      )
    );
    loop.start();
    return () => loop.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={styles.typingRow}>
      <View style={[styles.avatar, styles.avatarAI]}>
        <Text style={styles.iconSmall}>✦</Text>
      </View>
      <View style={styles.typingBubble}>
        {anims.map((a, i) => (
          <Animated.View key={i} style={[styles.typingDot, { transform: [{ translateY: a }] }]} />
        ))}
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────
// MESSAGE BUBBLE
// ─────────────────────────────────────────────
function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === 'user';
  return (
    <View style={[styles.msgRow, isUser && styles.msgRowUser]}>
      {!isUser && (
        <View style={[styles.avatar, styles.avatarAI]}>
          <Text style={styles.iconSmall}>✦</Text>
        </View>
      )}
      <View style={{ maxWidth: '75%' }}>
        {msg.images && msg.images.length > 0 && (
          <View style={styles.imgRow}>
            {msg.images.map((src, i) => (
              <Image key={i} source={{ uri: src }} style={styles.msgImage} />
            ))}
          </View>
        )}
        <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAI]}>
          <Text style={isUser ? [styles.bubbleText, { color: '#fff' } as const] : styles.bubbleText}>
            {msg.text}
          </Text>
        </View>
        <Text style={[styles.bubbleTime, isUser && ({ textAlign: 'right' } as const)]}>{msg.time}</Text>
      </View>
      {isUser && (
        <View style={[styles.avatar, styles.avatarUser]}>
          <Ionicons name="person" size={14} color={T.accentLight} />
        </View>
      )}
    </View>
  );
}

// ─────────────────────────────────────────────
// WELCOME SCREEN
// ─────────────────────────────────────────────
function WelcomeScreen({ onPickMode }: { onPickMode: (m: ModeKey) => void }) {
  return (
    <View style={styles.welcome}>
      <View style={styles.welcomeIcon}>
        <ThemedText style={{ fontSize: 28 }}>✦</ThemedText>
      </View>
      <Text style={styles.welcomeTitle}>Khmer AI Chat</Text>
      <Text style={styles.welcomeSub}>ជ្រើសរើសប្រភេទជំនួយ ឬវាយសំណួររបស់អ្នក</Text>
      <View style={styles.modeGrid}>
        {(Object.keys(MODES) as ModeKey[]).map(k => (
          <TouchableOpacity key={k} style={styles.modeCard} onPress={() => onPickMode(k)} activeOpacity={0.7}>
            <Text style={styles.modeEmoji}>{MODES[k].emoji}</Text>
            <Text style={styles.modeCardLabel}>{MODES[k].labelKm}</Text>
            <Text style={styles.modeCardDesc}>{MODES[k].desc}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────
export default function ChatScreen() {
  const router = useRouter();
  const [messages, setMessages]       = useState<Message[]>([]);
  const [input, setInput]             = useState('');
  const [mode, setMode]               = useState<ModeKey>('chat');
  const [loading, setLoading]         = useState(false);
  const [started, setStarted]         = useState(false);
  const [images, setImages]           = useState<string[]>([]);
  const [recording, setRecording]     = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  const flatRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);

  const scrollToEnd = useCallback(() => {
    setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
  }, []);

  // ── API CALL ──
  const callAI = useCallback(
    async (userText: string, _history: Message[]) => {
      setLoading(true);

      try {
        const res = await fetch('https://khmerai.store/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            senderId: 'app-user',
            message: userText,
          }),
        });

        const data = await res.json();

        if (!res.ok || !data.ok || !data.reply) {
          throw new Error(data.error || 'AI មិនអាចឆ្លើយបាន');
        }

        const aiMsg: Message = {
          id: genId(),
          role: 'assistant',
          text: data.reply,
          time: getTime(),
        };

        setMessages(prev => [...prev, aiMsg]);
        scrollToEnd();

        return data.reply;
      } catch (err) {
        console.error('callAI error:', err);

        const errMsg: Message = {
          id: genId(),
          role: 'assistant',
          text: '⚠️ មិនអាចភ្ជាប់ AI បានទេ។ សូមពិនិត្យ connection។',
          time: getTime(),
        };

        setMessages(prev => [...prev, errMsg]);
        scrollToEnd();

        return errMsg.text;
      } finally {
        setLoading(false);
      }
    },
    [scrollToEnd]
  );

  // ── SEND ──
  const send = useCallback(async () => {
    const text = input.trim();
    if (!text && !images.length) return;
    if (loading) return;

    Keyboard.dismiss();
    const displayText = text || '(រូបភាព)';
    const userMsg: Message = {
      id: genId(),
      role: 'user',
      text: displayText,
      time: getTime(),
      images: images.length ? [...images] : undefined,
    };

    setInput('');
    setImages([]);

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    if (!started) setStarted(true);
    scrollToEnd();

    await callAI(displayText, newHistory);
  }, [input, images, loading, messages, started, callAI, scrollToEnd]);

  // ── PICK MODE ──
  const pickMode = useCallback(
    async (m: ModeKey) => {
      setMode(m);
      setStarted(true);
      const userMsg: Message = { id: genId(), role: 'user', text: STARTERS[m], time: getTime() };
      const newHistory = [userMsg];
      setMessages(newHistory);
      scrollToEnd();
      await callAI(STARTERS[m], newHistory);
    },
    [callAI, scrollToEnd]
  );

  // ── SWITCH MODE (in-chat) ──
  const switchMode = useCallback((m: ModeKey) => {
    setMode(m);
  }, []);

  // ── IMAGE PICKER ──
  const pickImage = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      setImages(prev => [...prev, ...result.assets.map(a => a.uri)]);
    }
  }, []);

  // ── VOICE ──
  const toggleVoice = useCallback(async () => {
    if (isRecording && recording) {
      try {
        await recording.stopAndUnloadAsync();
        setRecording(null);
        setIsRecording(false);

        const uri = recording.getURI();

        if (!uri) {
          setInput('⚠️ មិនអាចយក voice file បានទេ');
          return;
        }

        const userMsg: Message = {
          id: genId(),
          role: 'user',
          text: '🎤 (voice message recorded)',
          time: getTime(),
        };

        setMessages(prev => [...prev, userMsg]);
        scrollToEnd();

        const audioRes = await fetch(uri);
        const audioBuffer = await audioRes.arrayBuffer();
        const audioBase64 = arrayBufferToBase64(audioBuffer);

        const res = await fetch('https://khmerai.store/voice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            senderId: 'app-voice-user',
            audioBase64,
            message: 'សូមស្តាប់សំឡេងនេះ ហើយឆ្លើយតបជាភាសាខ្មែរ',
          }),
        });

        const data = await res.json();

        if (!res.ok || !data.ok) {
          throw new Error(data.error || 'voice failed');
        }

        const aiMsg: Message = {
          id: genId(),
          role: 'assistant',
          text: data.reply || data.text || 'សូមអភ័យទោស បង ខ្ញុំមិនទាន់អាចស្តាប់បានទេ 🙏',
          time: getTime(),
        };

        setMessages(prev => [...prev, aiMsg]);
        scrollToEnd();
      } catch (err) {
        console.error('voice app error:', err);

        const errMsg: Message = {
          id: genId(),
          role: 'assistant',
          text: '⚠️ Voice មានបញ្ហា សូមព្យាយាមម្តងទៀត 🙏',
          time: getTime(),
        };

        setMessages(prev => [...prev, errMsg]);
        scrollToEnd();
      }

      return;
    }

    try {
      await Audio.requestPermissionsAsync();

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: rec } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(rec);
      setIsRecording(true);
    } catch (err) {
      console.error('start recording error:', err);
    }
  }, [isRecording, recording]);

  // ── RENDER ITEM ──
  const renderItem = useCallback(({ item }: { item: Message }) => <MessageBubble msg={item} />, []);

  const keyExtractor = useCallback((item: Message) => item.id, []);

  // ─────────────────────────────────────────
  return (
    <SafeAreaView style={styles.root}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBack} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={18} color={T.textSec} />
        </TouchableOpacity>
        <View style={styles.headerAvatar}>
          <Text style={{ fontSize: 16 }}>✦</Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>Khmer AI Chat</Text>
          <View style={styles.headerStatus}>
            <View style={styles.statusDot} />
            <Text style={styles.headerStatusText}>អនឡាញ · phollet AI</Text>
          </View>
        </View>
        <View style={styles.modeBadge}>
          <Text style={styles.modeBadgeText}>
            {MODES[mode].emoji} {MODES[mode].label}
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* MESSAGES */}
        {!started ? (
          <WelcomeScreen onPickMode={pickMode} />
        ) : (
          <FlatList
            ref={flatRef}
            data={messages}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            contentContainerStyle={styles.msgList}
            onContentSizeChange={scrollToEnd}
            ListFooterComponent={loading ? <TypingDots /> : null}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* MODE BAR (visible after started) */}
        {started && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.modeBar}
            contentContainerStyle={styles.modeBarContent}
          >
            {(Object.keys(MODES) as ModeKey[]).map(k => (
              <TouchableOpacity
                key={k}
                style={[styles.modePill, mode === k && styles.modePillActive]}
                onPress={() => switchMode(k)}
                activeOpacity={0.7}
              >
                <Text style={[styles.modePillText, mode === k && styles.modePillTextActive]}>
                  {MODES[k].emoji} {MODES[k].label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* IMAGE PREVIEW */}
        {images.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.previewBar}>
            {images.map((uri, i) => (
              <View key={i} style={styles.previewWrap}>
                <Image source={{ uri }} style={styles.previewThumb} />
                <TouchableOpacity
                  style={styles.removeImg}
                  onPress={() => setImages(prev => prev.filter((_, j) => j !== i))}
                >
                  <Ionicons name="close" size={10} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}

        {/* INPUT BAR */}
        <View style={styles.inputArea}>
          <View style={styles.inputRow}>
            <TouchableOpacity style={styles.actionBtn} onPress={pickImage}>
              <Ionicons name="image-outline" size={20} color={T.textSec} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, isRecording && styles.actionBtnRec]}
              onPress={toggleVoice}
            >
              <Ionicons
                name={isRecording ? 'stop' : 'mic-outline'}
                size={20}
                color={isRecording ? T.red : T.textSec}
              />
            </TouchableOpacity>
            <TextInput
              ref={inputRef}
              style={styles.inputBox}
              value={input}
              onChangeText={setInput}
              placeholder="វាយសំណួររបស់អ្នក…"
              placeholderTextColor={T.textDim}
              multiline
              maxLength={2000}
              returnKeyType="default"
              blurOnSubmit={false}
            />
            <TouchableOpacity
              style={[styles.sendBtn, (loading || (!input.trim() && !images.length)) && styles.sendBtnDisabled]}
              onPress={send}
              disabled={loading || (!input.trim() && !images.length)}
              activeOpacity={0.8}
            >
              {loading ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="send" size={18} color="#fff" />}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bgDeep },

  // ── Header ──
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: T.border,
    backgroundColor: T.bgDeep,
  },
  headerBack: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: T.border,
    alignItems: 'center', justifyContent: 'center',
  },
  headerAvatar: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: '#6366f133',
    borderWidth: 1, borderColor: '#6366f155',
    alignItems: 'center', justifyContent: 'center',
  },
  headerInfo: { flex: 1 },
  headerName: { fontSize: 15, fontWeight: '700', color: T.textPrimary },
  headerStatus: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: T.green },
  headerStatusText: { fontSize: 11, color: T.textDim },
  modeBadge: {
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 100, borderWidth: 1, borderColor: T.border,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  modeBadgeText: { fontSize: 11, color: T.textSec },

  // ── Messages ──
  msgList: { padding: 16, gap: 6, paddingBottom: 8 },
  msgRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginVertical: 3 },
  msgRowUser: { flexDirection: 'row-reverse' },
  avatar: {
    width: 28, height: 28, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  avatarAI: { backgroundColor: '#6366f122', borderWidth: 1, borderColor: '#6366f133' },
  avatarUser: { backgroundColor: 'rgba(99,102,241,0.15)', borderWidth: 1, borderColor: 'rgba(99,102,241,0.25)' },
  iconSmall: { fontSize: 14 } as any,
  bubble: {
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 18, maxWidth: '100%',
  },
  bubbleAI: {
    backgroundColor: T.aiBubble,
    borderWidth: 1, borderColor: T.border,
    borderBottomLeftRadius: 4,
  },
  bubbleUser: {
    backgroundColor: T.userBubble,
    borderBottomRightRadius: 4,
  },
  bubbleText: { fontSize: 14, color: T.textPrimary, lineHeight: 22 },
  bubbleTime: { fontSize: 10, color: T.textDim, marginTop: 4 },
  imgRow: { flexDirection: 'row', gap: 4, flexWrap: 'wrap', marginBottom: 4, justifyContent: 'flex-end' },
  msgImage: { width: 90, height: 90, borderRadius: 10 },

  // ── Typing ──
  typingRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginVertical: 3, paddingLeft: 16 },
  typingBubble: {
    flexDirection: 'row', gap: 4, alignItems: 'center',
    backgroundColor: T.aiBubble,
    borderWidth: 1, borderColor: T.border,
    borderRadius: 18, borderBottomLeftRadius: 4,
    paddingHorizontal: 14, paddingVertical: 14,
  },
  typingDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: T.textDim },

  // ── Welcome ──
  welcome: {
    flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24,
  },
  welcomeIcon: {
    width: 64, height: 64, borderRadius: 20,
    backgroundColor: '#6366f122', borderWidth: 1, borderColor: '#6366f144',
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  welcomeTitle: { fontSize: 20, fontWeight: '700', color: T.textPrimary, marginBottom: 6 },
  welcomeSub: { fontSize: 13, color: T.textSec, textAlign: 'center', lineHeight: 20, maxWidth: 260 },
  modeGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10,
    marginTop: 24, justifyContent: 'center',
  },
  modeCard: {
    width: '46%',
    backgroundColor: T.bgCard,
    borderWidth: 1, borderColor: T.border,
    borderRadius: 14, padding: 14, gap: 4,
  },
  modeEmoji: { fontSize: 22 },
  modeCardLabel: { fontSize: 13, fontWeight: '600', color: T.textPrimary, lineHeight: 18 },
  modeCardDesc: { fontSize: 11, color: T.textSec, lineHeight: 16 },

  // ── Mode Bar ──
  modeBar: { flexShrink: 0, borderTopWidth: 1, borderTopColor: T.border },
  modeBarContent: { paddingHorizontal: 14, paddingVertical: 8, gap: 6 },
  modePill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: 100, borderWidth: 1, borderColor: T.border,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  modePillActive: {
    backgroundColor: 'rgba(99,102,241,0.15)',
    borderColor: 'rgba(99,102,241,0.4)',
  },
  modePillText: { fontSize: 12, color: T.textSec },
  modePillTextActive: { color: T.accentLight },

  // ── Input Area ──
  inputArea: {
    paddingHorizontal: 14, paddingTop: 8, paddingBottom: 12,
    borderTopWidth: 1, borderTopColor: T.border,
    backgroundColor: T.bgDeep,
  },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  actionBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1, borderColor: T.border,
    alignItems: 'center', justifyContent: 'center',
  },
  actionBtnRec: {
    backgroundColor: 'rgba(239,68,68,0.12)',
    borderColor: 'rgba(239,68,68,0.35)',
  },
  inputBox: {
    flex: 1,
    backgroundColor: T.bgInput,
    borderWidth: 1, borderColor: T.border,
    borderRadius: 14, paddingHorizontal: 14,
    paddingTop: 10, paddingBottom: 10,
    color: T.textPrimary, fontSize: 14,
    maxHeight: 120, lineHeight: 20,
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: T.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },

  // ── Image Preview ──
  previewBar: { paddingHorizontal: 14, paddingBottom: 8, flexShrink: 0 },
  previewWrap: { position: 'relative', marginRight: 8 },
  previewThumb: { width: 56, height: 56, borderRadius: 10 },
  removeImg: {
    position: 'absolute', top: -4, right: -4,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: T.red,
    alignItems: 'center', justifyContent: 'center',
  },
});