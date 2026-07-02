import React, {useEffect, useState} from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import Svg, {G, Path} from 'react-native-svg';
import {arc as d3Arc, pie as d3Pie, PieArcDatum} from 'd3-shape';
import {PIE_CHART_SIZE} from '../constants/appConstants';
import {PieDatum} from '../types/expense';

type PieChartCardProps = {
  data: PieDatum[];
  drillDownData?: Record<string, PieDatum[]>;
};

function PieChartCard({data, drillDownData}: PieChartCardProps): React.JSX.Element {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const visibleData = selectedCategory
    ? drillDownData?.[selectedCategory] ?? []
    : data;
  const total = visibleData.reduce((sum, part) => sum + part.population, 0);

  useEffect(() => {
    if (selectedCategory && !data.some(item => item.name === selectedCategory)) {
      setSelectedCategory(null);
    }
  }, [data, selectedCategory]);

  const openCategory = (category: string) => {
    if (!selectedCategory && drillDownData?.[category]) {
      setSelectedCategory(category);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.chartHeader}>
        <Text style={styles.chartTitle}>
          {selectedCategory
            ? `الفئات الفرعية: ${selectedCategory}`
            : 'المصروفات حسب الفئة'}
        </Text>
        {selectedCategory ? (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setSelectedCategory(null)}>
            <Text style={styles.backButtonText}>العودة للفئات</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {!selectedCategory && data.length > 0 && drillDownData ? (
        <Text style={styles.drillDownHint}>اضغط على فئة لعرض فئاتها الفرعية</Text>
      ) : null}

      {visibleData.length > 0 ? (
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
                  const slices = pieGenerator(visibleData);
                  const radius = PIE_CHART_SIZE / 2;
                  const arcGenerator = d3Arc<PieArcDatum<PieDatum>>()
                    .innerRadius(0)
                    .outerRadius(radius - 4);

                  return slices.map(slice => {
                    const path = arcGenerator(slice);
                    if (!path) {
                      return null;
                    }

                    return (
                      <G key={slice.data.name}>
                        <Path
                          d={path}
                          fill={slice.data.color}
                          onPress={() => openCategory(slice.data.name)}
                        />
                      </G>
                    );
                  });
                })()}
              </G>
            </Svg>
          </View>
          <View style={styles.pieLegendWrap}>
            {visibleData.map(item => {
              const percentage = total > 0 ? (item.population / total) * 100 : 0;
              const canDrillDown =
                !selectedCategory && Boolean(drillDownData?.[item.name]);

              return (
                <TouchableOpacity
                  key={item.name}
                  style={styles.pieLegendRow}
                  disabled={!canDrillDown}
                  onPress={() => openCategory(item.name)}>
                  <Text style={styles.pieLegendText}>
                    {percentage.toFixed(1)}% - {item.population.toFixed(2)} ج.م - {item.name}
                  </Text>
                  <View
                    style={[
                      styles.pieLegendColor,
                      {backgroundColor: item.color},
                    ]}
                  />
                </TouchableOpacity>
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
  chartHeader: {
    gap: 8,
    alignItems: 'flex-end',
  },
  chartTitle: {
    color: '#0f172a',
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  backButton: {
    backgroundColor: '#7c3aed',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  backButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  drillDownHint: {
    color: '#64748b',
    textAlign: 'right',
    writingDirection: 'rtl',
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
