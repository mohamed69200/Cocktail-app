import React, { useState, useEffect } from 'react';
import { Text, View, FlatList, Image, TouchableOpacity, SafeAreaView, ActivityIndicator, Button, StyleSheet, Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

// URL de l'API pour récupérer les cocktails par catégorie
const API_URL = 'https://www.thecocktaildb.com/api/json/v1/1/filter.php?c=';

const App = () => {
  return (
    <NavigationContainer>
      <AppNavigator />
    </NavigationContainer>
  );
};

const Stack = createStackNavigator();

// Composant de navigation
const AppNavigator = () => {
  return (
    <Stack.Navigator initialRouteName="Home">
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Category" component={CategoryScreen} />
      <Stack.Screen name="Details" component={DetailScreen} />
      <Stack.Screen name="Favorites" component={FavoritesScreen} />
    </Stack.Navigator>
  );
};

// Fonction utilitaire pour ajouter aux favoris
const addToFavorites = async (cocktail, navigation) => {
  try {
    // Récupérer les favoris existants
    const storedFavorites = await AsyncStorage.getItem('favoriteCocktails');
    let favorites = storedFavorites ? JSON.parse(storedFavorites) : [];

    // Vérifier si le cocktail existe déjà
    const exists = favorites.some(fav => fav.idDrink === cocktail.idDrink);
    
    if (exists) {
      Alert.alert(
        'Déjà dans les favoris',
        'Ce cocktail est déjà dans votre liste de favoris.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Ajouter le nouveau favori
    favorites.push(cocktail);
    await AsyncStorage.setItem('favoriteCocktails', JSON.stringify(favorites));
    
    Alert.alert(
      'Favori ajouté',
      'Le cocktail a été ajouté à vos favoris.',
      [
        { text: 'OK' },
        { 
          text: 'Voir les favoris', 
          onPress: () => navigation.navigate('Favorites') 
        }
      ]
    );
  } catch (error) {
    console.error('Erreur lors de l\'ajout aux favoris', error);
    Alert.alert(
      'Erreur',
      'Impossible d\'ajouter le cocktail aux favoris.',
      [{ text: 'OK' }]
    );
  }
};

// HomeScreen : Affiche la liste des cocktails par catégorie
const HomeScreen = ({ navigation }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = () => {
    setLoading(true);
    fetch('https://www.thecocktaildb.com/api/json/v1/1/list.php?c=list')
      .then((response) => response.json())
      .then((data) => {
        setCategories(data.drinks);
        setLoading(false);
      })
      .catch((err) => {
        setError('Erreur de récupération des catégories');
        setLoading(false);
      });
  };

  if (loading) {
    return (
      <View style={styles.centeredView}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Chargement des catégories...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centeredView}>
        <Text>{error}</Text>
        <Button title="Réessayer" onPress={fetchCategories} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Catégories de Cocktails</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Favorites')}>
          <Text style={styles.favoritesLink}>Mes Favoris</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={categories}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => navigation.navigate('Category', { category: item.strCategory })}>
            <View style={styles.itemContainer}>
              <Text style={styles.itemText}>{item.strCategory}</Text>
            </View>
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item.strCategory}
      />
    </SafeAreaView>
  );
};

// CategoryScreen : Affiche les cocktails d'une catégorie spécifique
const CategoryScreen = ({ route, navigation }) => {
  const { category } = route.params;
  const [cocktails, setCocktails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCocktails();
  }, [category]);

  const fetchCocktails = () => {
    setLoading(true);
    fetch(API_URL + category)
      .then((response) => response.json())
      .then((data) => {
        setCocktails(data.drinks);
        setLoading(false);
      })
      .catch((err) => {
        setError('Erreur de récupération des cocktails');
        setLoading(false);
      });
  };

  if (loading) {
    return (
      <View style={styles.centeredView}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Chargement des cocktails...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centeredView}>
        <Text>{error}</Text>
        <Button title="Réessayer" onPress={fetchCocktails} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={cocktails}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => navigation.navigate('Details', { cocktailId: item.idDrink })}>
            <View style={styles.itemContainer}>
              <Text style={styles.itemText}>{item.strDrink}</Text>
              <Image source={{ uri: item.strDrinkThumb }} style={styles.image} />
            </View>
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item.idDrink}
      />
    </SafeAreaView>
  );
};

// DetailScreen : Affiche les détails d'un cocktail
const DetailScreen = ({ route, navigation }) => {
  const { cocktailId } = route.params;
  const [cocktail, setCocktail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCocktailDetails();
  }, [cocktailId]);

  const fetchCocktailDetails = () => {
    setLoading(true);
    fetch(`https://www.thecocktaildb.com/api/json/v1/1/lookup.php?i=${cocktailId}`)
      .then((response) => response.json())
      .then((data) => {
        setCocktail(data.drinks[0]);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  };

  if (loading) {
    return (
      <View style={styles.centeredView}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Chargement des détails...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {cocktail && (
        <View style={styles.detailContainer}>
          <Text style={styles.detailTitle}>{cocktail.strDrink}</Text>
          <Image source={{ uri: cocktail.strDrinkThumb }} style={styles.detailImage} />
          <Text style={styles.instructionsText}>{cocktail.strInstructions}</Text>
          <Button 
            title="Ajouter aux favoris" 
            onPress={() => addToFavorites(cocktail, navigation)} 
          />
        </View>
      )}
    </SafeAreaView>
  );
};

// FavoritesScreen : Affiche les cocktails favoris
const FavoritesScreen = ({ navigation }) => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadFavorites();
    });

    return unsubscribe;
  }, [navigation]);

  // Charger les favoris depuis AsyncStorage
  const loadFavorites = async () => {
    try {
      const storedFavorites = await AsyncStorage.getItem('favoriteCocktails');
      if (storedFavorites !== null) {
        setFavorites(JSON.parse(storedFavorites));
      }
      setLoading(false);
    } catch (error) {
      console.error('Erreur lors du chargement des favoris', error);
      setLoading(false);
    }
  };

  // Supprimer un cocktail des favoris
  const removeFavorite = async (cocktailId) => {
    try {
      const updatedFavorites = favorites.filter(fav => fav.idDrink !== cocktailId);
      await AsyncStorage.setItem('favoriteCocktails', JSON.stringify(updatedFavorites));
      setFavorites(updatedFavorites);
      
      Alert.alert(
        'Cocktail supprimé',
        'Le cocktail a été retiré de vos favoris.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Erreur lors de la suppression du favori', error);
    }
  };

  // Confirmation avant suppression
  const confirmRemoveFavorite = (cocktailId) => {
    Alert.alert(
      'Supprimer des favoris',
      'Voulez-vous vraiment retirer ce cocktail de vos favoris ?',
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Supprimer',
          onPress: () => removeFavorite(cocktailId),
          style: 'destructive',
        },
      ]
    );
  };

  // Rendu de la liste vide
  if (loading) {
    return (
      <View style={styles.centeredView}>
        <Text>Chargement des favoris...</Text>
      </View>
    );
  }

  if (favorites.length === 0) {
    return (
      <View style={styles.centeredView}>
        <Text style={styles.emptyText}>Vous n'avez pas encore de cocktails favoris</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={favorites}
        renderItem={({ item }) => (
          <TouchableOpacity 
            onPress={() => navigation.navigate('Details', { cocktailId: item.idDrink })}
            onLongPress={() => confirmRemoveFavorite(item.idDrink)}
          >
            <View style={styles.favoriteItem}>
              <Image source={{ uri: item.strDrinkThumb }} style={styles.favoriteImage} />
              <View style={styles.favoriteTextContainer}>
                <Text style={styles.favoriteName}>{item.strDrink}</Text>
                <Text style={styles.favoriteSubtext}>Appuyez longuement pour supprimer</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item.idDrink}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  favoritesLink: {
    color: '#0000ff',
    fontSize: 16,
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemContainer: {
    padding: 15,
    marginBottom: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    alignItems: 'center',
  },
  itemText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  image: {
    width: 100,
    height: 100,
    marginTop: 5,
    borderRadius: 8,
  },
  detailContainer: {
    alignItems: 'center',
    padding: 10,
  },
  detailTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  detailImage: {
    width: 200,
    height: 200,
    marginBottom: 10,
    borderRadius: 8,
  },
  instructionsText: {
    fontSize: 16,
    textAlign: 'center',
    marginHorizontal: 10,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 18,
    color: '#888',
  },
  favoriteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginBottom: 10,
    padding: 10,
  },
  favoriteImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 15,
  },
  favoriteTextContainer: {
    flex: 1,
  },
  favoriteName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  favoriteSubtext: {
    fontSize: 12,
    color: '#666',
  },
});

export default App;