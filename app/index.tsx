import { View, Text } from "react-native";
import { Button } from "@/components/ui/button";
import ButtonGridSection from '@/components/ButtonGridSection';
export default function Index() {
  return (
    <View>
      <ButtonGridSection></ButtonGridSection>
    <Button>
      <Text>Button</Text>
    </Button>
    </View>
  );
}
