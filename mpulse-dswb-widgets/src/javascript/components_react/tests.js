window.akdv.utils_event.on(window, 'render-complete', 'akdv', e => { 

    ReactDOM.render(
        <NumberInput label_text="oranges" default_value="20" max="10000" min="10" step="10" />,
        document.querySelector("#react-container")
    );

});
