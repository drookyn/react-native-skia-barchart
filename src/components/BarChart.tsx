import React from 'react';
import {
  Canvas,
  DashPathEffect,
  Group,
  Path,
  Skia,
  Text,
  useFont,
} from '@shopify/react-native-skia';
import Animated, {
  FadeIn,
  FadeOut,
  interpolate,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import {StyleSheet} from 'react-native';
import {scaleLinear, scalePoint} from 'd3';
import {isEmpty, isNil} from 'lodash-es';

const fontRessource = require('../assets/fonts/NunitoSans_10pt-Regular.ttf');

export const BarChart = ({
  data = [],
  paddingHorizontal = 25,
  paddingVertical = 20,
  barWidth: barWidthProp = 15,
  yAxisMax = null,
  borderRadius = 5,
  chartColor = '#b44666',
  labelsColor = '#fff',
  targetColor = 'rgba(255,255,255,0.25)',
  yAxisLinesColor = 'rgba(255,255,255,0.25)',
  hasTarget = false,
  yTicks = 4,
  targetHeight = 150,
  targetTolerance = 1.05,
  loading = false,
  style = {},
  ...rest
}) => {
  const [width, setCanvasWidth] = React.useState(0);
  const [height, setCanvasHeight] = React.useState(0);
  const animate = useSharedValue(0);

  const fontSize = 12;
  const font = useFont(fontRessource, fontSize);

  const yScaleDomain = [
    0,
    yAxisMax ??
      Math.round(
        Math.max(
          ...data.map(d => d.y),
          ...data.map(d => (d?.target ?? 0) * targetTolerance),
        ),
      ),
  ];
  const xScaleBounds = [
    (font?.getTextWidth(yScaleDomain.at(-1)?.toString() ?? '') ?? 0) +
      paddingHorizontal,
    width - paddingHorizontal,
  ];
  const chartHeight = height - paddingVertical;
  const yScaleBounds = [0, chartHeight - fontSize];

  const xScale = scalePoint()
    .domain(data.map(d => d.x.toString()))
    .range(xScaleBounds)
    .align(0);

  const barWidth = Math.min(barWidthProp, xScale.step());
  const yScale = scaleLinear().domain(yScaleDomain).range(yScaleBounds);

  const points = React.useMemo(
    () =>
      data.map(point => ({
        x: xScale(point.x.toString()),
        y: yScale(point.y),
        target: point?.target ? yScale(point.target) : null,
      })),
    [data, xScale, yScale],
  );

  React.useEffect(() => {
    animate.value = 0;
    animate.value = withDelay(250, withTiming(1, {duration: 750}));
  }, [data, width, height, animate]);

  const path = useDerivedValue(() => {
    const newPath = Skia.Path.Make();

    data.forEach((point, index) => {
      const rect = Skia.XYWHRect(
        points[index].x - barWidth / 2,
        chartHeight,
        barWidth,
        points[index].y *
          interpolate(
            animate.value - index * (1 / data.length),
            [-1, 0, 1 - index * (1 / data.length), 2],
            [0, 0, 1, 1],
          ) *
          -1,
      );

      newPath.addRRect(Skia.RRectXY(rect, borderRadius, borderRadius));
    });

    return newPath;
  });

  const targetPath = useDerivedValue(() => {
    if (!hasTarget) {
      return null;
    }

    const newPath = Skia.Path.Make();

    data.forEach((point, index) => {
      const rect = Skia.XYWHRect(
        points[index].x - (barWidth * 1.5) / 2,
        chartHeight -
          points[index].target -
          (targetHeight / 2) * (1 - targetTolerance),
        barWidth * 1.5,
        targetHeight * (1 - targetTolerance),
      );

      newPath.addRRect(Skia.RRectXY(rect, borderRadius / 2, borderRadius / 2));
    });

    return newPath;
  });

  const handleOnLayout = React.useCallback(({nativeEvent: {layout}}) => {
    setCanvasWidth(Math.round(layout.width));
    setCanvasHeight(Math.round(layout.height));
  }, []);

  const hasData = !isEmpty(data) && !loading;
  const hasFont = !isNil(font);

  return (
    <Animated.View style={[styles.container, style]} {...rest}>
      {loading && (
        <Animated.Text
          entering={FadeIn}
          exiting={FadeOut}
          style={[styles.loading]}>
          Loading
        </Animated.Text>
      )}

      {hasData && (
        <Animated.View
          style={[styles.inner]}
          onLayout={handleOnLayout}
          entering={FadeIn.duration(250)}>
          <Canvas
            style={{
              width,
              height,
            }}>
            {hasFont && (
              <Group>
                {yScale.ticks(yTicks).map((label, index) => {
                  const yPoint = chartHeight - yScale(label);

                  return (
                    <Group key={`y-${label}-${index}`}>
                      <Text
                        color={labelsColor}
                        font={font}
                        x={0}
                        y={yPoint}
                        text={`${label}`}
                      />

                      <Path
                        color={yAxisLinesColor}
                        style="stroke"
                        strokeWidth={StyleSheet.hairlineWidth}
                        path={`M${xScaleBounds[0]},${yPoint} L${xScaleBounds[1]},${yPoint}`}>
                        <DashPathEffect intervals={[5, 10]} />
                      </Path>
                    </Group>
                  );
                })}
              </Group>
            )}

            {hasFont && (
              <Group>
                {xScale.domain().map((label, index) => (
                  <Group color={labelsColor} key={`x-${label}-${index}`}>
                    <Text
                      font={font}
                      x={xScale(`${label}`) - barWidth / 2}
                      y={height}
                      text={`${label}`}
                    />
                  </Group>
                ))}
              </Group>
            )}

            <Path path={path} color={chartColor} />

            {hasTarget && (
              <Group opacity={animate}>
                <Path
                  path={targetPath}
                  color={targetColor}
                  style="stroke"
                  strokeJoin="round"
                  strokeWidth={1}
                />
                <Path path={targetPath} color={targetColor} />
              </Group>
            )}
          </Canvas>
        </Animated.View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 30,
  },
  inner: {
    flexGrow: 1,
    width: '100%',
  },
  loading: {
    alignSelf: 'center',
    color: '#020202',
    fontSize: 30,
  },
});
