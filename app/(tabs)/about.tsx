import { StyleSheet, Text, View } from 'react-native';

export default function AboutScreen() {
     return (
          <View style={styles.container}>
               <Text style={styles.text}>Velvet Ladle</Text>
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