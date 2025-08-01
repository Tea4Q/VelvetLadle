import { StyleSheet, Text, View } from 'react-native';

export default function AboutScreen() {
     return (
          <View style={styles.container}>
               <Text style={styles.text}>Velvet Ladle is a database of your found recipes.</Text>
																<Text style {styles.text}> This is a database of your found recipe to try at home. All you need to do is 
	              find a recipe online copy the web address paste in website field and either open the web page from the app or
               process the web page to pull the recipe into your database to try at a later time. The feature allows you to scale the recipe for how many servings you want to create. It also give nutrional information for each serving of the recipe.
You may edit the recipe with a new ingredient to change the taste, look and nutriotional values of recipe.
</Text>
          </View>
     );
}

const styles = StyleSheet.create({
     title: {
								color: #00205B'
       fontFamily: 'Paresiene'
       fontSize: 36,
       fontWeight: '700',
},
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