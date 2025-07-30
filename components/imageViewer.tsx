import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

type Props = {
	imgSource: string;
};

export default function ImageViewer({ imgSource }: Props) {
	return (
		<View style={styles.imageContainer}>
			<View style={styles.imageContainer}>
				<Image source={imgSource} style={styles.image} />
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	image: {
		width: 320, // Adjusted width for better fit
		height: 440,
		borderRadius: 18,
	},
	imageContainer: {
		flex: 1,
	},
});
