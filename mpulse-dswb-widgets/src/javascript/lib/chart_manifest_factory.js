;((window) => {


    'use strict';

    window.chartManifestFactory = ({
        container_id = window.required(),
        chart = window.required(),
        namespace = window.required(),
        datasource = false
    } = {}) => ({
        container_id,
        chart,
        namespace,
        datasource
    });


})(window);