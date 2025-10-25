import p5 from "p5";
import "p5/lib/addons/p5.sound";
import '@lib/p5.polygon.js';
import './style.scss';

import PolygonsNo1 from './PolygonsNo1';
// Configure p5.capture options before initializing the sketch
if (typeof window !== 'undefined' && window.P5Capture) {
  window.P5Capture.setDefaultOptions({
    format: 'mp4',
    framerate: 30,
    bitrate: 10000,
    quality: 1,
    disableUi: true,
  });
}
new p5(PolygonsNo1);