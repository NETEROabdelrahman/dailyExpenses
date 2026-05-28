import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';

type PageHeaderProps = {
  title: string;
  onBack: () => void;
};

function PageHeader({title, onBack}: PageHeaderProps): React.JSX.Element {
  return (
    <View style={styles.pageHeaderRow}>
      <TouchableOpacity style={styles.backBtn} onPress={onBack}>
        <Text style={styles.btnText}>رجوع</Text>
      </TouchableOpacity>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pageHeaderRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backBtn: {
    backgroundColor: '#64748b',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  btnText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'right',
  },
});

export default PageHeader;
