export const css = `
/**
* This is a standalone file that gets included with the selector playground
* highlight in the user's app html
*/
.tooltip {
  background: #333;
  border: solid 1px #333;
  border-radius: 3px;
  color: #e3e3e3;
  display: inline-block;
  font-size: 12px;
  left: 0;
  max-width: 200px;
  padding: 4px 6px;
  text-align: center;
  top: 0;
  z-index: 100;
}
.tooltip-arrow {
  height: 0;
  overflow: hidden;
  position: absolute;
  width: 0;
}
.tooltip-arrow svg {
  fill: #333;
  position: relative;
  stroke: #333;
  stroke-width: 1px;
}
.tooltip-top,
.tooltip-top-start,
.tooltip-top-end,
.tooltip-bottom.tooltip-flipped,
.tooltip-bottom-start.tooltip-flipped,
.tooltip-bottom-end.tooltip-flipped {
  margin-bottom: 5px;
}
.tooltip-top .tooltip-arrow,
.tooltip-top-start .tooltip-arrow,
.tooltip-top-end .tooltip-arrow,
.tooltip-bottom.tooltip-flipped .tooltip-arrow,
.tooltip-bottom-start.tooltip-flipped .tooltip-arrow,
.tooltip-bottom-end.tooltip-flipped .tooltip-arrow {
  top: auto;
  bottom: -6px;
  height: 6px;
  width: 12px;
}
.tooltip-top .tooltip-arrow svg,
.tooltip-top-start .tooltip-arrow svg,
.tooltip-top-end .tooltip-arrow svg,
.tooltip-bottom.tooltip-flipped .tooltip-arrow svg,
.tooltip-bottom-start.tooltip-flipped .tooltip-arrow svg,
.tooltip-bottom-end.tooltip-flipped .tooltip-arrow svg {
  top: -5px;
}
.tooltip-right,
.tooltip-right-start,
.tooltip-right-end,
.tooltip-left.tooltip-flipped,
.tooltip-left-start.tooltip-flipped,
.tooltip-left-end.tooltip-flipped {
  margin-left: 5px;
}
.tooltip-right .tooltip-arrow,
.tooltip-right-start .tooltip-arrow,
.tooltip-right-end .tooltip-arrow,
.tooltip-left.tooltip-flipped .tooltip-arrow,
.tooltip-left-start.tooltip-flipped .tooltip-arrow,
.tooltip-left-end.tooltip-flipped .tooltip-arrow {
  right: auto;
  left: -6px;
  height: 12px;
  width: 6px;
}
.tooltip-right svg,
.tooltip-right-start svg,
.tooltip-right-end svg,
.tooltip-left.tooltip-flipped svg,
.tooltip-left-start.tooltip-flipped svg,
.tooltip-left-end.tooltip-flipped svg {
  left: 0;
}
.tooltip-left,
.tooltip-left-start,
.tooltip-left-end,
.tooltip-right.tooltip-flipped,
.tooltip-right-start.tooltip-flipped,
.tooltip-right-end.tooltip-flipped {
  margin-right: 5px;
}
.tooltip-left .tooltip-arrow,
.tooltip-left-start .tooltip-arrow,
.tooltip-left-end .tooltip-arrow,
.tooltip-right.tooltip-flipped .tooltip-arrow,
.tooltip-right-start.tooltip-flipped .tooltip-arrow,
.tooltip-right-end.tooltip-flipped .tooltip-arrow {
  left: auto;
  right: -6px;
  height: 12px;
  width: 6px;
}
.tooltip-left .tooltip-arrow svg,
.tooltip-left-start .tooltip-arrow svg,
.tooltip-left-end .tooltip-arrow svg,
.tooltip-right.tooltip-flipped .tooltip-arrow svg,
.tooltip-right-start.tooltip-flipped .tooltip-arrow svg,
.tooltip-right-end.tooltip-flipped .tooltip-arrow svg {
  left: -5px;
}
.tooltip-bottom,
.tooltip-bottom-start,
.tooltip-bottom-end,
.tooltip-top.tooltip-flipped,
.tooltip-top-start.tooltip-flipped,
.tooltip-top-end.tooltip-flipped {
  margin-top: 5px;
}
.tooltip-bottom .tooltip-arrow,
.tooltip-bottom-start .tooltip-arrow,
.tooltip-bottom-end .tooltip-arrow,
.tooltip-top.tooltip-flipped .tooltip-arrow,
.tooltip-top-start.tooltip-flipped .tooltip-arrow,
.tooltip-top-end.tooltip-flipped .tooltip-arrow {
  bottom: auto;
  height: 6px;
  top: -6px;
  width: 12px;
}
.tooltip-bottom svg,
.tooltip-bottom-start svg,
.tooltip-bottom-end svg,
.tooltip-top.tooltip-flipped svg,
.tooltip-top-start.tooltip-flipped svg,
.tooltip-top-end.tooltip-flipped svg {
  top: 0;
}
.tooltip-top-start .tooltip-arrow,
.tooltip-bottom-start .tooltip-arrow {
  left: 0;
}
.tooltip-top-end .tooltip-arrow,
.tooltip-bottom-end .tooltip-arrow {
  right: 0;
}
.tooltip-left-start .tooltip-arrow,
.tooltip-right-start .tooltip-arrow {
  top: 0;
}
.tooltip-left-end .tooltip-arrow,
.tooltip-right-end .tooltip-arrow {
  bottom: 0;
}
.highlight {
  background: rgba(159, 196, 231, 0.6);
  border: solid 2px #9FC4E7;
  cursor: pointer;
}
.tooltip {
  font-family: sans-serif;
  font-size: 14px;
  max-width: 400px !important;
}
`
