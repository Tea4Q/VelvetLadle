import { View, Pressable, StyleSheet, Text } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';

type Props = {
	icon: keyof typeof FontAwesome.glyphMap;
	label: string;
	onPress: () => void;
};

export default function CircleButton({ onPress, label, icon }: Props) {
	return (
		<View style={styles.circleButtonContainer}>
			<Pressable style={styles.circleButton} onPress={onPress}>
				<FontAwesome name={icon} size={24} color="#00205B" />
				<Text style={[styles.circleButtonLabel]}>{label}</Text>
			</Pressable>
		</View>
	);
}

const styles = StyleSheet.create({
     circleButtonContainer: {
          width: 84,
          height: 84,
          marginHorizontal: 10,
          borderWidth: 4,
          borderColor: '#faf4eb',
          color: '#00205B',
          borderRadius: 42,
          padding: 3,
     },
     circleButton: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          borderRadius: 42,
          backgroundColor: '#faf4eb',
          color: '#00205B',
     },
     circleButtonLabel: {
          width: 108,
          textAlign: 'center',
          fontSize: 16,
          color: '#00205B',
          fontWeight: '700',
     },

});
