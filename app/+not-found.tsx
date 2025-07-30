import { StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';

export default function NotFoundScreen() {
	return (
		<View style={styles.container}>
               <Text style={styles.text}>
                    <Link href="/">Go back to home</Link>
               </Text>
		</View>
	);
}

const styles = StyleSheet.create({
	text: {
		color: '#00205B',
		fontFamily: 'Nunito',
		fontSize: 24,
		fontWeight: 'bold',
	},
	container: {
		backgroundColor: '#faf4eb',
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
});
