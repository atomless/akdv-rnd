;((window, document, $, css_utils, event_utils) => {

    'use strict';

    const THEME_CLASS = 'css-theme';
  
    const config = Object.seal({
        available_themes : Array.from(document.getElementsByClassName(THEME_CLASS)),
        available_theme_ids : Array.from(document.getElementsByClassName(THEME_CLASS)).map((el) => el.id),
        id_template : window.akdv.utils_string.stringLiteralTemplate`dswb-${0}-theme-css`,
        // (see html/base_template) default is defined by the last linked 
        // css theme el with media=all not media=none - DO NOT SET THE DEFAULT HERE!
        default_theme_id : false
    });


    const themes = window.akdv.themes = {

        init : async (query_params) => {

            if (!config.available_themes.length) {
                throw new TypeError(`No Linked CSS Theme Found with class: ${THEME_CLASS}`);
            }

            themes.setDefaultThemeIdBasedOnLinkedCSSThemesInHTML();
            themes.current_theme = themes.getFormattedThemeIdUsing(query_params.theme);
            document.body.setAttribute('data-theme-initialized', true);
            document.body.setAttribute('style', '');
            await event_utils.delay(17); // wait for paint!!
            css_utils.updateCachedValues();
            themes.addEventListeners();
        },


        get current_theme() {

            return Array.from(document.getElementsByClassName(THEME_CLASS)).filter((el) => el.media !== 'none').pop().id;
        },


        set current_theme(theme_id) {

            let ct = this.current_theme;

            if (!this.getIsSupportedThemeId(theme_id)) {
                window._log.warn('AKDV THEMES ERROR - UNSUPPORTED THEME', theme_id);
                if (!ct) {
                    window._log.info('AKDV THEMES - SETTING THEME TO DEFAULT', theme_id);
                    theme_id = config.default_theme_id;
                } else {
                    // if unsupported theme and already a theme set 
                    // then return
                    return;
                }
            }
            if (theme_id !== ct) {
                let css_filename = theme_id.replace(/-(?!.*-)/, '.').replace(/-/g,'_');

                document.getElementById(theme_id).setAttribute('media', 'all');
                // for firefox
                Array.from(document.querySelectorAll(`[href*="${css_filename}"]`)).forEach(el => el.media = 'all');
                
                Array.from(document.querySelectorAll(`link`))
                    .filter(el => el.href.includes('theme') && !el.href.includes(css_filename) && el.id !== theme_id)
                    .forEach(el => el.setAttribute('media', 'none'));
            }
        },


        setDefaultThemeIdBasedOnLinkedCSSThemesInHTML() {

            // set to the last linked css theme without media=none
            // as this will be the one that has overridden all others.
            let default_theme_id = config.available_themes.reduce(
                (default_theme_id, theme_el) => (theme_el.media !== 'none')
                    ? theme_el.id 
                    : default_theme_id, 
                false);

            if (default_theme_id === false) {
                throw new TypeError('No Active Linked CSS Theme Found (wihout media=none)');
            }

            config.default_theme_id = default_theme_id;
        },


        getFormattedThemeIdUsing : (theme) => (theme)
            ? config.id_template.with(theme) 
            : config.default_theme_id,


        getIsSupportedThemeId : (theme_id) => (config.available_theme_ids.indexOf(theme_id) > -1),


        onThemeChange(e, theme) {

            this.current_theme = this.getFormattedThemeIdUsing(theme);
        },


        addEventListeners() {

            $(window).on('theme-change.akdv', this.onThemeChange.bind(this));
        }

    };


})(window, document, window.jQuery, window.akdv.utils_css, window.akdv.utils_event);