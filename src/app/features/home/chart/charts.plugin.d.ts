import { ChartType, Plugin } from 'chart.js';

declare module 'chart.js' {
  interface PluginOptionsByType<TType extends ChartType> {
    centerText?: {
      text?: string;
      fontStyle?: string;
      color?: string;
      sidePadding?: number;
    };
  }
}
