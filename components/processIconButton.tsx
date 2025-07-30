import { Pressable, StyleSheet, Text } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';

type Props = {
	icon: keyof typeof FontAwesome.glyphMap;
	label: string;
	onPress: () => void;

};

export default function ProcessButton({ icon, label, onPress }: Props) {
	return (
		<Pressable style={styles.processButton} onPress={onPress}>
			<FontAwesome name={icon} size={24} />
			<Text style={[styles.processButtonLabel]}>{label}</Text>
		</Pressable>
	);
}

const styles = StyleSheet.create({
	processButton: {
		justifyContent: 'center',
          alignItems: 'center',
          color: '#00205B',
	},
     processButtonLabel: {
          width: 108,
		marginTop: 8,
          fontSize: 16,
          color:'#00205B',
		textAlign: 'center',
		fontWeight: '700',
	},
});
