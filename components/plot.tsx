import { Counter, CounterDetails } from '../lib/types';
import React, { useEffect, useRef } from 'react';
import { TopLevelSpec as VlSpec } from 'vega-lite';
import vegaEmbed from 'vega-embed';
import { DateTime } from 'luxon';
import timeFormatLocale from '../data/locale_fr';

type Props = {
  counters: Counter;
  period: string;
};
const Plot = ({ counters, period }: Props) => {
  const container = useRef(null);
  const timeUnit = {
    day: 'yearmonthdatehours' as const,
    month: 'yearmonthdate' as const,
    year: 'yearweek' as const,
  }[period];

  const timeLabel = {
    day: 'heure',
    month: 'jour',
    year: 'semaine',
  }[period];

  const format = {
    day: '%H:%M',
    month: '%e %b %Y',
    year: 'Semaine %W (%d/%m/%Y)',
  }[period];

  useEffect(() => {
    const isMobile = container.current.offsetWidth < 500;

    const axis = {
      day: {
        title: '',
        tickCount: 8,
        labelAlign: 'left' as const,
        labelExpr:
          "[timeFormat(datum.value, '%H:%M'), timeFormat(datum.value, '%H') == '00' ? timeFormat(datum.value, '%e %b') : '']",
        labelOffset: 10,
        labelPadding: 10,
        tickSize: 30,
        gridDash: {
          condition: {
            test: { field: 'value', timeUnit: 'hours' as const, equal: 0 },
            value: [],
          },
          value: [2, 2],
        },
        tickDash: {
          condition: {
            test: { field: 'value', timeUnit: 'hours' as const, equal: 0 },
            value: [],
          },
          value: [2, 2],
        },
      },
      month: {
        formatType: 'time',
        format: '%e %b %Y',
        title: '',
        labelAngle: 30,
      },
      year: {
        title: '',
        tickCount: { interval: 'week' as const, step: 10 },
        labelAngle: 0,
        labelAlign: 'left' as const,
        labelExpr:
          "[timeFormat(datum.value, 'Semaine %W'), timeFormat(datum.value, '%m') == '01' ? timeFormat(datum.value, '%Y') : '']",
        labelOffset: isMobile ? 10 : 0,
        labelPadding: isMobile ? 26 : 0,
        tickSize: 30,
        gridDash: {
          condition: {
            test: { field: 'value', timeUnit: 'month' as const, equal: 1 },
            value: [],
          },
          value: [2, 2],
        },
        tickDash: {
          condition: {
            test: { field: 'value', timeUnit: 'month' as const, equal: 1 },
            value: [],
          },
          value: [2, 2],
        },
      },
    }[period];

    const data: CounterDetails[] = counters[period].map(
      ({ time, count, id }) => ({
        time: DateTime.fromISO(time),
        count,
        id,
      })
    );

    const timePart = {
      field: 'time',
      axis,
      timeUnit,
    };
    const countPart = {
      field: 'count',
      type: 'quantitative',
      axis: { title: 'Passages par ' + timeLabel },
    };

    const vegaSpec: VlSpec = {
      $schema: 'https://vega.github.io/schema/vega-lite/v4.json',
      description: 'Nombre de passages de vélo',
      data: {
        values: data,
      },
      transform: [
        {
          joinaggregate: [
            {
              op: 'sum',
              field: 'count',
              as: 'total',
            },
          ],
          groupby: ['time'],
        },
      ],
      width: 'container',
      height: isMobile ? data.length * 5 : 200,
      mark: 'bar',
      encoding: {
        x: isMobile ? countPart : timePart,
        y: isMobile ? timePart : countPart,
        color: {
          field: 'id',
          legend: { title: 'Compteur' },
          scale: { range: ['#75CBB7', '#CAE26E'] },
        },
        tooltip: [
          { field: 'id', title: 'Sens' },
          { field: 'time', title: 'Moment', type: 'temporal', format },
          { field: 'count', title: 'Passages' },
          { field: 'total', title: 'Passages total' },
        ],
      },
    };

    vegaEmbed(container.current, vegaSpec, { timeFormatLocale }).then((r) => r);
  }, []);

  return (
    <div
      // eslint-disable-next-line no-return-assign
      ref={(el) => (container.current = el)}
      className="w-full rounded-xl p-6 bg-white mb-3"
    />
  );
};

export default Plot;
