;((window, document, d3) => {

    'use strict';

    const constant = (_) => (() => _);

    d3.forceXY = (xy) => {

      var strength = constant(0.1),
          nodes,
          strengths,
          xz;

      if (typeof xy !== "function") {
        xy = constant(xy === null ? [0,0] : xy);
      }

      const force = (alpha) => {

        for (var i = 0, n = nodes.length, node; i < n; ++i) {
          node = nodes[i]; 
          node.vx += (xz[i][0] - node.x) * strengths[i] * alpha;
          node.vy += (xz[i][1] - node.y) * strengths[i] * alpha;
        }
      }

      const initialize = () => {
        
        if (!nodes) {
          return;
        }
        var i, n = nodes.length;
        strengths = new Array(n);
        xz = new Array(n);
        for (i = 0; i < n; ++i) {
          strengths[i] = (xz[i] = xy(nodes[i], i, nodes)).includes(NaN) ? 0 : +strength(nodes[i], i, nodes);
        }
      }

      force.initialize = (_) => {

        nodes = _;
        initialize();
      };

      force.strength = (_) => _ ? (strength = typeof _ === "function" ? _ : constant(+_), initialize(), force) : strength;

      force.xy = (_) => _ ? (xy = typeof _ === "function" ? _ : constant(_), initialize(), force) : xy;

      return force;
    }
})(window, window.document, window.d3);