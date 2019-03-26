'use strict';

const fs = require('fs');
const request = require('request');


global.getLocalFileAsync = (local_file_path) => new Promise((resolve, reject) => {

        const stream = fs.createReadStream(local_file_path);

        stream.on('end', resolve(stream)); 
        stream.on('error', reject);
    });


global.getLocalFileSync = (local_file_path) => {
    
    let stream = '';

    try {
        stream = fs.readFileSync(local_file_path);
    } catch(err) {
        console.log(err.message);
    }

    return stream;
};


global.sendPOSTRequest = (form_obj) => new Promise((resolve, reject) => {

        request.post(form_obj, (err, httpResponse, body) => { 

            if (err) { 
                reject(err); 
            } else { 
                resolve({ 
                    body: JSON.parse(body), 
                    status: httpResponse.statusCode, 
                    content_type: httpResponse.headers['content-type']
                });
            }
        });
    });
