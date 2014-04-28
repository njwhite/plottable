///<reference path="reference.ts" />

module Plottable {
  export class PAxis extends Component {
    public axisElement: D3.Selection;
    private baseline: D3.Selection;
    private scale: Scale;
    private orientation: string;
    private _formatter: (n: any) => string;
    private tickLength = 5;
    private tickLabelOffsetPadding = 3;
    private isHorizontal = true;

    /**
     * Creates an Axis.
     *
     * @constructor
     * @param {Scale} scale The Scale to base the Axis on.
     * @param {string} orientation The orientation of the Axis (top/bottom/left/right)
     * @param {any} [(n: any) => string] A function to format tick labels.
     */
    constructor(scale: Scale, orientation: string, formatter?: (n: any) => string) {
      super();
      this.scale = scale;
      var orientationLC = orientation.toLowerCase();

      if (orientationLC !== "top" &&
          orientationLC !== "bottom" &&
          orientationLC !== "left" &&
          orientationLC !== "right") {
        throw new Error("unsupported orientation for Axis");
      }
      this.orientation = orientationLC;

      if (this.orientation === "top" || this.orientation === "bottom") {
        this.isHorizontal = true;
        this.minimumHeight(30);
      } else {
        this.isHorizontal = false;
        this.minimumWidth(50);
      }

      this.classed("axis", true);
      if (formatter == null) {
        formatter = function (n: any) {
          if (typeof n === "number") {
            return Math.round(n * 100) / 100; // default keeps two decimal places
          }
          return n;
        };
      }
      this._formatter = formatter;

      this._registerToBroadcaster(this.scale, () => this.rescale());
    }

    public _anchor(element: D3.Selection) {
      super._anchor(element);
      // this.axisElement = this.content.append("g").classed("axis", true);
      this.baseline = this.content.append("line").classed("baseline", true);
      return this;
    }

    public _render() {
      // if (this.orientation === "left") {this.axisElement.attr("transform", "translate(" + this.minimumWidth() + ", 0)");};
      // if (this.orientation === "top")  {this.axisElement.attr("transform", "translate(0," + this.minimumHeight() + ")");};
      var domain = this.scale.domain();

      var baselineAttributes = {
        x1: 0,
        y1: 0,
        x2: 0,
        y2: 0
      };

      var tickValues = this.scale.ticks(10);

      var tickSelection = this.content.selectAll(".tick").data(tickValues);
      var tickEnterSelection = tickSelection.enter().append("g").classed("tick", true);
      tickEnterSelection.append("line").classed("tick-mark", true);
      tickEnterSelection.append("text").classed("tick-label", true);
      tickSelection.exit().remove();

      var tickGroupAttrHash = {
        x: (d: any) => 0,
        y: (d: any) => 0
      };

      var tickTransformGenerator = (d: any, i: number) => {
        return "translate(" + tickGroupAttrHash["x"](d) + ", " + tickGroupAttrHash["y"](d) + ")";
      };

      var tickMarkAttrHash = {
        x1: 0,
        y1: 0,
        x2: 0,
        y2: 0
      };

      var tickLabelAttrHash = {
        x: 0,
        y: 0,
        dx: "0em",
        dy: "0.3em"
      };

      var tickLabelTextAnchor = "middle";

      if (this.isHorizontal) {
        tickGroupAttrHash["x"] = (d: any) => this.scale.scale(d);
      } else {
        tickGroupAttrHash["y"] = (d: any) => this.scale.scale(d);
      }

      switch(this.orientation) {
        case "bottom":
          baselineAttributes.x2 = this.availableWidth;

          tickMarkAttrHash["y2"] = this.tickLength;

          tickLabelAttrHash["y"] = tickMarkAttrHash["y2"] + this.tickLabelOffsetPadding;
          tickLabelAttrHash["dy"] = "0.95em";
          break;

        case "top":
          baselineAttributes.x2 = this.availableWidth;
          baselineAttributes.y1 = this.availableHeight;
          baselineAttributes.y2 = this.availableHeight;

          tickMarkAttrHash["y1"] = this.availableHeight;
          tickMarkAttrHash["y2"] = this.availableHeight - this.tickLength;

          tickLabelAttrHash["y"] = tickMarkAttrHash["y2"] - this.tickLabelOffsetPadding;
          tickLabelAttrHash["dy"] = "-.25em";
          break;

        case "left":
          baselineAttributes.x1 = this.availableWidth;
          baselineAttributes.x2 = this.availableWidth;
          baselineAttributes.y2 = this.availableHeight;

          tickMarkAttrHash["x1"] = this.availableWidth;
          tickMarkAttrHash["x2"] = this.availableWidth - this.tickLength;

          tickLabelTextAnchor = "end";
          tickLabelAttrHash["x"] = tickMarkAttrHash["x2"] - this.tickLabelOffsetPadding;
          break;

        case "right":
          baselineAttributes.y2 = this.availableHeight;

          tickMarkAttrHash["x2"] = this.tickLength;

          tickLabelTextAnchor = "start";
          tickLabelAttrHash["x"] = tickMarkAttrHash["x2"] + this.tickLabelOffsetPadding;
          break;
      }

      this.baseline.attr(baselineAttributes);
      tickSelection.select("text").text(this._formatter);
      tickSelection.each(function (d: any) {
        var tick = d3.select(this);
        tick.select("line").attr(tickMarkAttrHash);
        tick.select("text").style("text-anchor", tickLabelTextAnchor)
                           .attr(tickLabelAttrHash);
      });
      tickSelection.attr("transform", tickTransformGenerator);

      return this;
    }

    private rescale() {
      return (this.element != null) ? this._render() : null;
      // short circuit, we don't care about perf.
    }

    public formatter(formatFunction: (n: any) => string) {
      this._formatter = formatFunction;
      return this;
    }
  }
}
