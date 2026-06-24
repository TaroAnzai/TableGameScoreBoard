import { BlurView } from 'expo-blur';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
interface TextInputModalProps {
  open: boolean;
  onComfirm: (inputText: string, inputText2?: string) => void;
  onClose: () => void;
  value?: string;
  title?: string;
  discription?: string;
  InputLabel?: string;
  inputType?: 'text' | 'email' | 'number' | 'password';
  twoInput?: boolean;
  twoInputLabel?: string;
  twoValue?: string;
  twoInputType?: 'text' | 'email' | 'number' | 'password';
}

const getKeyboardType = (type?: string) => {
  switch (type) {
    case 'email':
      return 'email-address';
    case 'number':
      return 'numeric';
    default:
      return 'default';
  }
};

export const TextInputModal2 = ({
  open,
  onComfirm,
  onClose,
  value,
  title,
  discription,
  InputLabel,
  inputType = 'text',
  twoInput = false,
  twoInputLabel = '',
  twoValue = '',
  twoInputType = 'text',
}: TextInputModalProps) => {
  const { t } = useTranslation();

  const [inputText, setInputText] = useState(value ?? '');
  const [inputText2, setInputText2] = useState(twoValue ?? '');

  return (
    <Modal
      key={`${open}-${value}-${twoValue}`}
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.modalContent}>
          <View style={styles.modalInner}>
            {title && <Text style={styles.title}>{title}</Text>}
            {discription && <Text style={styles.description}>{discription}</Text>}

            {InputLabel && <Text style={styles.label}>{InputLabel}</Text>}
            <TextInput
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              keyboardType={getKeyboardType(inputType)}
              secureTextEntry={inputType === 'password'}
              autoCapitalize="none"
            />

            {twoInput && (
              <>
                {twoInputLabel && <Text style={styles.label}>{twoInputLabel}</Text>}
                <TextInput
                  style={styles.input}
                  value={inputText2}
                  onChangeText={setInputText2}
                  keyboardType={getKeyboardType(twoInputType)}
                  secureTextEntry={twoInputType === 'password'}
                  autoCapitalize="none"
                />
              </>
            )}

            <View style={styles.footer}>
              <Pressable style={[styles.button, styles.cancelButton]} onPress={onClose}>
                <Text style={styles.cancelButtonText}>{t('Common.Cancel')}</Text>
              </Pressable>

              <Pressable
                style={[styles.button, styles.okButton]}
                onPress={() => onComfirm(inputText, inputText2)}
              >
                <Text style={styles.okButtonText}>OK</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  content: {
    width: '100%',
    maxWidth: 400,
    overflow: 'hidden',
    backgroundColor: 'rgba(20, 83, 45, 0.45)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(144, 238, 144, 0.3)',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#ffffff',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#fdfffd',
    marginBottom: 6,
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 14,
    color: '#ffffff',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
  },
  button: {
    minWidth: 80,
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  cancelButton: {
    backgroundColor: '#e5e7eb',
  },
  okButton: {
    backgroundColor: '#166534',
  },
  cancelButtonText: {
    color: '#111827',
    fontWeight: '600',
  },
  okButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  blurBox: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 24,
    overflow: 'hidden',
  },

  greenLayer: {
    padding: 24,
    backgroundColor: 'rgba(20, 83, 45, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(144, 238, 144, 0.35)',
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(144, 238, 144, 0.35)',
    backgroundColor: 'rgba(20, 83, 45, 0.55)', // BlurViewなしでこれだけでも代用可
  },
  modalInner: {
    padding: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.05)', // 微かなハイライトでガラス感
  },
});
