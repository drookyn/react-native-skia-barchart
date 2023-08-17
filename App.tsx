/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import {BarChart} from './src/components/BarChart';
import {Pressable, ScrollView, StyleSheet, Text} from 'react-native';
import Animated, {FadeIn, FadeOut} from 'react-native-reanimated';

function App(): JSX.Element {
  const [loading, setLoading] = React.useState(false);

  const toggleLoading = React.useCallback(() => setLoading(v => !v), []);

  const data = new Array(7).fill(null).map((_, index) => ({
    y: index * 500,
    x: `${index}`,
    target: (index + 1) * 500,
  }));

  return (
    <ScrollView contentContainerStyle={StyleSheet.flatten([styles.scrollView])}>
      <Animated.View style={[styles.card]} entering={FadeIn} exiting={FadeOut}>
        <BarChart
          data={data}
          chartColor="#b44666"
          labelsColor="#020202"
          targetColor="rgba(155, 155, 155, 0.25)"
          yAxisLinesColor="rgba(0, 0, 0, 0.5)"
          loading={loading}
          hasTarget
          yTicks={4}
        />
      </Animated.View>

      <Pressable onPress={toggleLoading} style={[styles.button]}>
        <Text style={[styles.buttonText]}>Click me</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flexGrow: 1,
    padding: 20,
    gap: 20,
  },
  card: {
    minHeight: 300,
    width: '100%',
    backgroundColor: '#fefefe',
    borderRadius: 10,
    padding: 30,
  },
  button: {
    alignSelf: 'center',
    backgroundColor: '#b44666',
    padding: 10,
    borderRadius: 10,
  },
  buttonText: {
    color: '#fefefe',
    fontWeight: 'bold',
    fontSize: 20,
  },
});

export default App;
