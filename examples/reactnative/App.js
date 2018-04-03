import Provider, { Asset } from 'asset-provider';
import React, { Component } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  View
} from 'react-native';

const instructions = Platform.select({
  ios: 'Press Cmd+R to reload,\n' +
    'Cmd+D or shake for dev menu',
  android: 'Double tap R on your keyboard to reload,\n' +
    'Shake or press menu button for dev menu',
});

export default class App extends Component<{}> {
  render() {
    return (
      <View style={styles.container}>
        <Text style={styles.instructions}>
          {instructions}
        </Text>
        <Provider uri='http://localhost:8080/godaddy-homer-tiger.svgs'>
          <View>
            <Asset name='godaddy' width={100} height={100}>
              <Text style={styles.loading}>
                Loading Assets
              </Text>
            </Asset>

            <Asset name='homer' width={100} height={100} style={{ backgroundColor: 'red' }} />
            <Asset name='tiger' width={100} height={100} />
          </View>
        </Provider>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  loading: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
});
