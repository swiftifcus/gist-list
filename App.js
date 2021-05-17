/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

import React, {useEffect, useState, useRef, useMemo} from 'react';
import type {Node} from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  FlatList,
  Image,
  Animated,
  Pressable,
  Dimensions,
  ActivityIndicator,
} from 'react-native';

import axios from 'axios';

const App: () => Node = () => {
  const [gists, setGists] = useState([]);
  const [page, setPage] = useState(1);
  const [modalImageUri, setModalImageUri] = useState();
  const [modalImageWidth, setModalImageWidth] = useState(0);
  const [modalImageHeight, setModalImageHeight] = useState(0);
  const [modalShowing, setModalShowing] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const perPage = 30;

  const getFilename = file => {
    return file[Object.keys(file)[0]].filename || '';
  };

  const getImageDimensions = image => {
    const {width, height} = image;
    setModalImageWidth(width);
    setModalImageHeight(height);
  };

  const fadeIn = () => {
    Animated.timing(fadeAnim, {
      toValue: 1.0,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  };

  const fadeOut = () => {
    Animated.timing(fadeAnim, {
      toValue: 0.0,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  };

  const fadeInAndOut = image => () => {
    if (!modalShowing) {
      setModalImageUri(image);
      fadeIn();
      setModalShowing(true);
      setTimeout(() => {
        fadeOut();
        setTimeout(() => {
          setModalShowing(false);
        }, 1000);
      }, 1000);
    }
  };

  const fetchMore = async () => {
    const result = await axios.get(
      `https://api.github.com/gists/public?per_page=${perPage}&page=${page}`,
    );
    const data = await result.data;
    setPage(prevState => prevState + 1);

    // Cuvaju se samo podaci koji su bitni za aplikaciju da se memorija ne bi punila
    // nebitnim informacijama. U zavisnosti od konkretne potrebe, mogu se cuvati i druga
    // polja.
    const mappedData = data.map(d => {
      return {
        id: d.id,
        files: d.files,
        owner: d.owner,
        updated_at: d.updated_at,
      };
    });

    // Posto se gistovi jako cesto kreiraju i azuriraju moze doci do problema da se
    // javljaju duplikati. Ovim nacinom redom proveravamo gistove iz trenutnog zahteva
    // zajedno sa gistovima iz state-a i cim dodjemo do gista iz zahteva koji je
    // stariji od najstarijeg gista iz state-a, dodajemo sve preostale gistove u state
    const oldestCurrentDate = new Date(gists[gists.length - 1].updated_at);
    let filteredData;

    for (let i = 0; i < mappedData.length; i++) {
      if (oldestCurrentDate > new Date(mappedData[i].updated_at).getTime()) {
        filteredData = mappedData.slice(i);
        break;
      }
    }

    setGists(prevState => [...prevState, ...filteredData]);
  };

  useEffect(() => {
    const api = `https://api.github.com/gists/public?per_page=${perPage}&page=1`;
    const fetchData = async () => {
      const result = await axios.get(api, {
        headers: {Accept: 'application/vnd.github.v3+json'},
      });
      const data = await result.data;
      // Cuvaju se samo podaci koji su bitni za aplikaciju da se memorija ne bi punila
      // nebitnim informacijama. U zavisnosti od konkretne potrebe, mogu se cuvati i druga
      // polja.
      const mappedData = data.map(d => {
        return {
          id: d.id,
          owner: d.owner,
          files: d.files,
          updated_at: d.updated_at,
        };
      });
      setGists(mappedData);
      // setGists(data);
      setPage(prevState => prevState + 1);
    };
    fetchData();
  }, []);

  const renderItem = ({item}) => (
    <Pressable
      style={styles.rowContainer}
      onPress={fadeInAndOut(item.owner.avatar_url)}>
      <SafeAreaView style={styles.row}>
        <Image
          style={styles.avatarImage}
          source={{uri: item.owner.avatar_url}}
        />
        <Text style={styles.filenameText}>{getFilename(item.files)}</Text>
      </SafeAreaView>
    </Pressable>
  );

  const headerComponent = () => <Text style={styles.headerText}>Gists</Text>;

  return (
    <SafeAreaView style={{flex: 1}}>
      {/* Lista */}
      <FlatList
        data={gists}
        initialNumToRender={20}
        onEndReached={fetchMore}
        onEndReachedThreshold={0.5}
        ListHeaderComponentStyle={styles.headerContainer}
        ListHeaderComponent={headerComponent}
        ListEmptyComponent={<ActivityIndicator size="large" />}
        keyExtractor={item => item.id}
        renderItem={renderItem}
      />
      {/* Modal */}
      {/* Kod modala koji dolazi sa react-nativeom nije moguce menjati duzinu fade-a */}
      <Animated.View style={[styles.animationContainer]}>
        <Animated.Image
          onLayout={e => getImageDimensions(e.nativeEvent.layout)}
          style={[
            styles.animatedImage,
            {
              left: Dimensions.get('window').width / 2 - modalImageWidth / 2,
              top: Dimensions.get('window').height / 2 - modalImageHeight / 2,
              opacity: fadeAnim,
            },
          ]}
          source={{uri: modalImageUri}}
        />
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  animationContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  animatedImage: {
    height: 100,
    width: 100,
    backgroundColor: 'white',
    zIndex: 1000,
  },
  filenameText: {
    marginLeft: 20,
    alignSelf: 'center',
    flexWrap: 'wrap',
    flexShrink: 1,
  },
  avatarImage: {
    width: 50,
    height: 50,
  },
  rowContainer: {
    borderBottomColor: 'lightgrey',
    borderBottomWidth: 1,
  },
  row: {
    margin: 5,
    marginLeft: 10,
    flexDirection: 'row',
  },
  headerContainer: {
    paddingTop: 5,
    paddingBottom: 5,
    marginBottom: 10,
    backgroundColor: 'lightgrey',
  },
  headerText: {
    fontWeight: 'bold',
    marginLeft: 10,
  },
});

export default App;
