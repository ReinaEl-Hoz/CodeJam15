declare module "react-plotly.js" {
  import Plotly from "plotly.js";
  import { Component } from "react";

  interface PlotParams {
    data: Partial<Plotly.PlotData>[];
    layout?: Partial<Plotly.Layout>;
    config?: Partial<Plotly.Config>;
    style?: React.CSSProperties;
    useResizeHandler?: boolean;
    className?: string;
    divId?: string;
    debug?: boolean;
  }

  export default class Plot extends Component<PlotParams> {}
}
