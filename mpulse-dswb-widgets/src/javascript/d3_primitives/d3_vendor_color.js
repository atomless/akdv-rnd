;(function(window, document, d3) {

    'use strict';

    window.D3VendorColor = function() {

        
        /** ================ Options / Defaults ================== */
        var chart_width = 0;
        
        var commonVendors = [
            'everestjs.net',
            'ordergroove.com',
            'bazaarvoice.com',
            'cloudfront.net',
            'demdex.net',
            'omtrdc.net',
            'amazonaws.com',
            'company-target.com',
            'demandbase.com',
            'krxd.net',
            'univide.com'
        ];
        
        var genericVendors = [];
        
        var commonVendorColors = [
            'hsl(0, 100%, 50%)',
            'hsl(120, 100%, 50%)',
            'hsl(60, 100%, 50%)',
            'hsl(200, 100%, 70%)',
            'hsl(90, 100%, 50%)',
            'hsl(230, 100%, 80%)',
            'hsl(30, 100%, 50%)',
            'hsl(160, 100%, 50%)',
            'hsl(330, 100%, 50%)',
            'hsl(140, 100%, 50%)',
            'hsl(250, 100%, 80%)'
        ];
        
        var genericVendorColors = [
            'hsl(0, 50%, 40%)',
            'hsl(120, 50%, 40%)',
            'hsl(60, 50%, 40%)',
            'hsl(200, 50%, 40%)',
            'hsl(90, 50%, 40%)',
            'hsl(230, 50%, 40%)',
            'hsl(30, 50%, 40%)',
            'hsl(160, 50%, 40%)',
            'hsl(330, 50%, 40%)',
            'hsl(140, 50%, 40%)',
            'hsl(250, 50%, 40%)'
        ];

        
        
        /** ================ Init Threshold ================== */
        var vendorColor = function() {
        };


        /** ================ Update Text Cell ================== */
        vendorColor.getColor = function(vendorString) {
            
            // Try and match the Vendor, to a specific Index (this fixes key vendors, to a fixed colours, keeping things consistent
            var commonVendorIndex = commonVendors.indexOf(vendorString);
            
            if( commonVendorIndex !== - 1) {
                return commonVendorColors[commonVendorIndex];
            }
            
            // Does not match as a common Vendor, let assign first-come, first-serve genericVendorColor indicies
            var genericVendorIndex = genericVendors.indexOf(vendorString);
            if(genericVendorIndex === -1) {
                genericVendorIndex = genericVendors.push(vendorString) - 1;
            }
            
            return genericVendorColors[genericVendorIndex];
        };
        
        
        
        
        /** ================  Getters / Setters ================== */

        vendorColor.chart_width = function(val) {
            chart_width = val;
              return vendorColor;
        };
        
        
        
        return vendorColor;
    }


}(window, document, window.d3));