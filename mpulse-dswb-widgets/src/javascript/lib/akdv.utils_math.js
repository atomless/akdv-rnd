;((window) => {

    'use strict';
  

    window.akdv.utils_math = {


        safeQuotient(n, d) {

            return isFinite(n / d)? n / d : 0;
        },


        intQuotient : (n, d) => ~~(n / d),


        sigmoid : (z) => 1 / (1 + Math.exp(-z)),


        logNormalDistributionGenerator(mu, sigma, start, end, interval, yMult) {
            
            let results = [];
            let fFunc = (mu, sigma, x) => {

                let val = Math.exp(-0.5 * Math.pow(Math.log((x - mu) / sigma), 2)) / (x * sigma * Math.sqrt( 2 * Math.PI ));

                return (isNaN(val))? 0 : val;
            };
            
            for (var x = start; x <= end; x += interval) {
                
                let y = fFunc(mu, sigma, x) * yMult;

                results.push({ x : x, y : y });
            }
            
            return results;
        },


        norm : (min, max, value) => (value - min) / (max - min),


        clamp : (min, max, value) => Math.min(max, Math.max(min, value)),


        roundFloatTo : (n = window.required(), p = 2) => +(`${Math.round(`${n}e+${p}`)}e-${p}`),


        percentile(arr = [0], k = 50, pre_sorted = false) {

            let l = arr.length;

            if (k === 0 || l < 2) {
                return arr[0];
            }

            if (k === 100) {
                return arr.slice(-1).pop();
            }

            let index = l * k * 0.01;

            if (!pre_sorted) {
                arr = arr.slice().sort((a, b) => a - b);
            }

            if (index % 1 === 0) {
                return (index > l - 1)
                    ? arr.slice(-1).pop()
                    : (arr[index - 1] + arr[index]) * 0.5;
            } else {
                return arr[Math.floor(index)];
            }
        },


		mode : (arr = []) => arr.reduce((a, b, i, arr) => arr.filter(v => v === a).length >= arr.filter(v => v === b).length? a : b, false),


        smoothstep(min, max, value) {
          
          const t = this.norm(min, max, value);
          return (t * t) * (3.0 - 2.0 * t);
        },


        lerp(min, max, value) {

            return min + value * (max - min);
        },
        

        random_bm(min, max, skew) {

            var u = 0, v = 0;
            while(u === 0) {
                u = Math.random();
            }
            while(v === 0) {
                v = Math.random();
            }

            let num = Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
            num = num / 10.0 + 0.5;
            
            if (num > 1 || num < 0) {
                num = this.randn_bm(min, max, skew);
            }

            num = Math.pow(num, skew);
            num *= max - min;
            num += min;

            return num;
        }

    };


})(window);
