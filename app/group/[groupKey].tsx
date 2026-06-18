import { useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

const GroupPage = () => {
  const { groupKey } = useLocalSearchParams<{ groupKey: string }>();

  return (
    <View>
      <h1>Group: {groupKey}</h1>
    </View>
  );
};

export default GroupPage;
