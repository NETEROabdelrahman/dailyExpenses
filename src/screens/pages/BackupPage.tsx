import React, {useState} from 'react';
import {Alert, Text, TextInput, TouchableOpacity, View} from 'react-native';
import PageHeader from '../../components/PageHeader';
import {
  downloadSupabaseBackup,
  signInWithSupabase,
  signUpWithSupabase,
  SupabaseSession,
  uploadSupabaseBackup,
} from '../../services/supabaseBackup';
import {AppState} from '../../store/appSlice';
import styles from '../../styles/appStyles';

type BackupPageProps = {
  backupPayload: AppState;
  backendSettings: AppState['backendSettings'];
  onBack: () => void;
  onSupabaseUrlChange: (value: string) => void;
  onAnonKeyChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onSaveSettings: () => Promise<void>;
  onBackupSucceeded: () => void;
  onRestoreSucceeded: () => void;
  onRestoreBackup: (payload: AppState) => void;
};

const isAppStateBackup = (value: unknown): value is AppState => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<AppState>;
  return (
    Array.isArray(candidate.expenses) &&
    Array.isArray(candidate.debts) &&
    Array.isArray(candidate.balanceTransactions) &&
    Array.isArray(candidate.periods) &&
    Array.isArray(candidate.categories)
  );
};

function BackupPage({
  backupPayload,
  backendSettings,
  onBack,
  onSupabaseUrlChange,
  onAnonKeyChange,
  onEmailChange,
  onSaveSettings,
  onBackupSucceeded,
  onRestoreSucceeded,
  onRestoreBackup,
}: BackupPageProps): React.JSX.Element {
  const [password, setPassword] = useState('');
  const [session, setSession] = useState<SupabaseSession | null>(null);
  const [statusText, setStatusText] = useState('');
  const [busy, setBusy] = useState(false);

  const getConfig = () => {
    const cleanUrl = backendSettings.supabaseUrl.trim();
    const cleanAnonKey = backendSettings.anonKey.trim();

    if (!cleanUrl || !cleanAnonKey) {
      throw new Error('أدخل رابط Supabase ومفتاح anon.');
    }

    return {
      url: cleanUrl,
      anonKey: cleanAnonKey,
    };
  };

  const runBackendAction = async (
    action: () => Promise<void>,
    successMessage: string,
  ) => {
    try {
      setBusy(true);
      setStatusText('');
      await action();
      setStatusText(successMessage);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'حدث خطأ غير متوقع.';
      setStatusText(message);
      Alert.alert('خطأ', message);
    } finally {
      setBusy(false);
    }
  };

  const signUp = () =>
    runBackendAction(async () => {
      const nextSession = await signUpWithSupabase(
        getConfig(),
        backendSettings.email,
        password,
      );
      setSession(nextSession);
    }, 'تم إنشاء الحساب وتسجيل الدخول.');

  const signIn = () =>
    runBackendAction(async () => {
      const nextSession = await signInWithSupabase(
        getConfig(),
        backendSettings.email,
        password,
      );
      setSession(nextSession);
    }, 'تم تسجيل الدخول.');

  const saveSettings = () =>
    runBackendAction(async () => {
      await onSaveSettings();
    }, 'تم حفظ إعدادات Supabase على هذا الجهاز.');

  const backup = () =>
    runBackendAction(async () => {
      if (!session) {
        throw new Error('سجل الدخول أولاً.');
      }

      await uploadSupabaseBackup(getConfig(), session, backupPayload);
      onBackupSucceeded();
    }, 'تم رفع النسخة الاحتياطية.');

  const restore = () => {
    if (!session) {
      Alert.alert('بيانات ناقصة', 'سجل الدخول أولاً.');
      return;
    }

    Alert.alert(
      'استعادة النسخة',
      'سيتم استبدال البيانات الحالية بالنسخة المحفوظة على Supabase.',
      [
        {text: 'إلغاء', style: 'cancel'},
        {
          text: 'استعادة',
          style: 'destructive',
          onPress: () =>
            runBackendAction(async () => {
              const record = await downloadSupabaseBackup(getConfig(), session);

              if (!record) {
                throw new Error('لا توجد نسخة احتياطية لهذا الحساب.');
              }

              if (!isAppStateBackup(record.payload)) {
                throw new Error('النسخة المحفوظة غير متوافقة مع هذا الإصدار.');
              }

              onRestoreBackup(record.payload);
              onRestoreSucceeded();
            }, 'تمت استعادة النسخة الاحتياطية.'),
        },
      ],
    );
  };

  return (
    <>
      <PageHeader title="النسخ الاحتياطي" onBack={onBack} />

      <View style={styles.backupCard}>
        <Text style={styles.sectionTitle}>Supabase</Text>

        <View style={styles.compactField}>
          <Text style={styles.label}>Project URL</Text>
          <TextInput
            style={styles.input}
            placeholder="https://xxxx.supabase.co"
            autoCapitalize="none"
            value={backendSettings.supabaseUrl}
            onChangeText={onSupabaseUrlChange}
          />
        </View>

        <View style={styles.compactField}>
          <Text style={styles.label}>Anon key</Text>
          <TextInput
            style={styles.input}
            placeholder="eyJ..."
            autoCapitalize="none"
            value={backendSettings.anonKey}
            onChangeText={onAnonKeyChange}
          />
        </View>

        <View style={styles.compactFieldsRow}>
          <View style={styles.compactField}>
            <Text style={styles.label}>البريد الإلكتروني</Text>
            <TextInput
              style={styles.input}
              placeholder="name@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={backendSettings.email}
              onChangeText={onEmailChange}
            />
          </View>

          <View style={styles.compactField}>
            <Text style={styles.label}>كلمة المرور</Text>
            <TextInput
              style={styles.input}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>
        </View>

        <View style={styles.inlineRow}>
          <TouchableOpacity
            style={styles.secondaryBtn}
            disabled={busy}
            onPress={saveSettings}>
            <Text style={styles.btnText}>حفظ الإعدادات</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inlineRow}>
          <TouchableOpacity
            style={styles.secondaryBtn}
            disabled={busy}
            onPress={signUp}>
            <Text style={styles.btnText}>إنشاء حساب</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.primaryBtn}
            disabled={busy}
            onPress={signIn}>
            <Text style={styles.btnText}>تسجيل الدخول</Text>
          </TouchableOpacity>
        </View>

        {session ? (
          <Text style={styles.backupStatusText}>متصل: {session.email}</Text>
        ) : null}

        <Text
          style={[
            styles.backupStatusText,
            backendSettings.hasUnsyncedChanges ? styles.warningValue : null,
          ]}>
          {backendSettings.hasUnsyncedChanges
            ? 'توجد تغييرات غير محفوظة في النسخة الاحتياطية.'
            : 'النسخة الاحتياطية محدثة.'}
        </Text>

        {backendSettings.lastBackupAtISO ? (
          <Text style={styles.backupStatusText}>
            آخر رفع: {new Date(backendSettings.lastBackupAtISO).toLocaleString('ar-EG')}
          </Text>
        ) : null}

        {backendSettings.lastRestoreAtISO ? (
          <Text style={styles.backupStatusText}>
            آخر استعادة: {new Date(backendSettings.lastRestoreAtISO).toLocaleString('ar-EG')}
          </Text>
        ) : null}
      </View>

      <View style={styles.backupCard}>
        <Text style={styles.sectionTitle}>البيانات</Text>

        <View style={styles.inlineRow}>
          <TouchableOpacity
            style={styles.primaryBtn}
            disabled={busy}
            onPress={backup}>
            <Text style={styles.btnText}>رفع نسخة</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelBtn}
            disabled={busy}
            onPress={restore}>
            <Text style={styles.btnText}>استعادة</Text>
          </TouchableOpacity>
        </View>

        {statusText ? (
          <Text style={styles.backupStatusText}>{statusText}</Text>
        ) : null}
      </View>
    </>
  );
}

export default BackupPage;
