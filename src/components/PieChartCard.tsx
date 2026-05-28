import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import Svg, {G, Path, Text as SvgText} from 'react-native-svg';
import {arc as d3Arc, pie as d3Pie, PieArcDatum} from 'd3-shape';
import {PIE_CHART_SIZE} from '../constants/appConstants';
import {PieDatum} from '../types/expense';

type PieChartCardProps = {
  data: PieDatum[];
};

function PieChartCard({data}: PieChartCardProps): React.JSX.Element {
  const total = data.reduce((sum, part) => sum + part.population, 0);

  return (
    <View style={styles.card}>
      {data.length > 0 ? (
        <>
          <View style={styles.pieCanvasWrap}>
            <Svg
              width={PIE_CHART_SIZE}
              height={PIE_CHART_SIZE}
              viewBox={`0 0 ${PIE_CHART_SIZE} ${PIE_CHART_SIZE}`}>
              <G x={PIE_CHART_SIZE / 2} y={PIE_CHART_SIZE / 2}>
                {(() => {
                  const pieGenerator = d3Pie<PieDatum>()
                    .value(item => item.population)
                    .sort(null);
                  const slices = pieGenerator(data);
                  const radius = PIE_CHART_SIZE / 2;
                  const arcGenerator = d3Arc<PieArcDatum<PieDatum>>()
                    .innerRadius(0)
                    .outerRadius(radius - 4);
                  const labelArc = d3Arc<PieArcDatum<PieDatum>>()
                    .innerRadius(radius * 0.62)
                    .outerRadius(radius * 0.62);

                  return slices.map(slice => {
                    const path = arcGenerator(slice);
                    if (!path) {
                      return null;
                    }

                    const [labelX, labelY] = labelArc.centroid(slice);
                    const percentage = total > 0 ? (slice.data.population / total) * 100 : 0;

                    return (
                      <G key={slice.data.name}>
                        <Path d={path} fill={slice.data.color} />
                        <SvgText
                          x={labelX}
                          y={labelY}
                          fill="#ffffff"
                          fontSize="13"
                          fontWeight="700"
                          textAnchor="middle"
                          alignmentBaseline="middle">
                          {`${percentage.toFixed(0)}%`}
                        </SvgText>
                      </G>
                    );
                  });
                })()}
              </G>
            </Svg>
          </View>
          <View style={styles.pieLegendWrap}>
            {data.map(item => {
              const percentage = total > 0 ? (item.population / total) * 100 : 0;

              return (
                <View key={item.name} style={styles.pieLegendRow}>
                  <Text style={styles.pieLegendText}>
                    {percentage.toFixed(1)}% - {item.population.toFixed(2)} ج.م - {item.name}
                  </Text>
                  <View
                    style={[
                      styles.pieLegendColor,
                      {backgroundColor: item.color},
                    ]}
                  />
                </View>
              );
            })}
          </View>
        </>
      ) : (
        <Text style={styles.emptyText}>أضف مصروفات لرؤية الرسم البياني</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#f5f3ff',
    borderRadius: 14,
    padding: 14,
    gap: 8,
    shadowColor: '#0f172a',
    shadowOpacity: 0.07,
    shadowOffset: {width: 0, height: 4},
    shadowRadius: 10,
    elevation: 2,
  },
  pieCanvasWrap: {
    width: PIE_CHART_SIZE,
    alignSelf: 'center',
  },
  pieLegendWrap: {
    marginTop: 8,
    gap: 6,
  },
  pieLegendRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingVertical: 6,
  },
  pieLegendColor: {
    width: 14,
    height: 14,
    borderRadius: 3,
  },
  pieLegendText: {
    color: '#334155',
    textAlign: 'right',
    writingDirection: 'rtl',
    flex: 1,
    marginLeft: 10,
  },
  emptyText: {
    color: '#64748b',
    textAlign: 'center',
  },
});

export default PieChartCard;
